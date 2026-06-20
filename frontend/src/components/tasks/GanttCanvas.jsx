/**
 * GanttCanvas
 * -----------
 * Pure canvas renderer for the Gantt bar area.
 *
 * Animation system:
 *  - hoverRef tracks { taskId, _target, alpha } — mutated by RAF tick, never causes re-renders.
 *  - startAnimLoop() starts a RAF loop that lerps alpha 0↔1 and stops when stable.
 *  - setHover(taskId) exposed via imperative ref — GanttView calls it from mousemove.
 *  - Two-pass bar draw: pass 1 = all bars, pass 2 = hover overlay (always on top).
 *
 * Performance notes:
 *  - ctx.shadowBlur is reset via ctx.save()/ctx.restore() after every glow — never bleeds.
 *  - taskRowMap built once per draw frame, reused for hover overlay + dependency arrows.
 *  - RAF loop stops when alpha is stable (battery-friendly — no idle spinning).
 */

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { parseDate, daysBetween, GROUP_H, ROW_H } from "@/hooks/useGanttModel";

// ── Helpers ───────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r = 4) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function formatDate(d) {
  if (!d) return "";
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function getTheme() {
  const dark = document.documentElement.classList.contains("dark");
  return {
    bg: dark ? "#09090b" : "#ffffff",
    rowAlt: dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)",
    groupBg: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    statusBg: dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.015)",
    gridLine: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
    gridMaj: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.28)",
    shading: dark ? "rgba(99,102,241,0.09)" : "rgba(99,102,241,0.07)",
    currentBorder: dark ? "rgba(99,102,241,0.40)" : "rgba(99,102,241,0.35)",
    todayLine: "rgba(248,113,113,0.85)",
    todayFill: "rgb(248,113,113)",
    text: dark ? "#e2e8f0" : "#1e293b",
    textMuted: dark ? "#475569" : "#94a3b8",
    textOnBar: "#ffffff",
    arrowLine: dark ? "#475569" : "#94a3b8",
    arrowFill: dark ? "#475569" : "#94a3b8",
    outOfRangeFill: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    chipBg: dark ? "rgba(12,12,18,0.97)" : "rgba(255,255,255,0.97)",
    chipText: dark ? "#f1f5f9" : "#0f172a",
    chipBorder: dark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.12)",
    chipShadow: dark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.18)",
  };
}

const BAR_H = 22;
const SPRINT_BAR_H = 26;
const BAR_FONT =
  '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const CHIP_FONT =
  '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ── Component ─────────────────────────────────────────────────────────────────
const GanttCanvas = forwardRef(function GanttCanvas(
  {
    rows,
    statuses,
    criticalSet,
    pxPerDay,
    rangeStart,
    headerSegments,
    scrollTopRef,
    scrollLeftRef,
    wrapperRef,
    dragPreview,
  },
  ref,
) {
  const canvasRef = useRef(null);
  const drawRef = useRef(null);
  // { taskId: displayed task, _target: mouse-over task, alpha: 0-1 }
  const hoverRef = useRef({ taskId: null, _target: null, alpha: 0 });
  const animRafRef = useRef(null);

  // ── Animation loop ──────────────────────────────────────────────────────────
  // Lerps hoverRef.alpha toward 0 or 1. Stops when stable. Battery-safe.
  const startAnimLoop = useCallback(() => {
    if (animRafRef.current) return;

    const tick = () => {
      const h = hoverRef.current;

      // When faded out, switch to the new target (crossfade)
      if (h.taskId !== h._target && h.alpha < 0.05) {
        h.taskId = h._target;
        h.alpha = 0;
      }

      const wantShow = !!(h.taskId && h.taskId === h._target);
      const alphaTarget = wantShow ? 1 : 0;
      const speed = wantShow ? 0.2 : 0.15;

      h.alpha += (alphaTarget - h.alpha) * speed;
      if (Math.abs(h.alpha - alphaTarget) < 0.008) h.alpha = alphaTarget;

      drawRef.current?.();

      if (Math.abs(h.alpha - alphaTarget) > 0.008) {
        animRafRef.current = requestAnimationFrame(tick);
      } else {
        animRafRef.current = null; // loop ends — no idle spinning
      }
    };

    animRafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Core draw function ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef?.current;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const W = wrapper.clientWidth;
    const H = wrapper.clientHeight;
    if (!W || !H) return;

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const sT = scrollTopRef.current;
    const sL = scrollLeftRef.current;
    const C = getTheme();

    // 1 ── Background ─────────────────────────────────────────────────────────
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // 2 ── Current-period shading + accent borders ────────────────────────────
    if (headerSegments?.bottom) {
      for (const seg of headerSegments.bottom) {
        if (!seg.current) continue;
        const sx = seg.x - sL;
        if (sx + seg.w < 0 || sx > W) continue;
        ctx.fillStyle = C.shading;
        ctx.fillRect(sx, 0, seg.w, H);
        ctx.strokeStyle = C.currentBorder;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        for (const bx of [sx + 0.5, sx + seg.w - 0.5]) {
          if (bx >= -1 && bx <= W + 1) {
            ctx.beginPath();
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx, H);
            ctx.stroke();
          }
        }
      }
    }

    // 3 ── Vertical grid lines ─────────────────────────────────────────────────
    if (headerSegments?.bottom) {
      for (const seg of headerSegments.bottom) {
        const sx = seg.x - sL;
        if (sx < -1 || sx > W + 1) continue;
        ctx.strokeStyle = seg.monthBoundary ? C.gridMaj : C.gridLine;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, H);
        ctx.stroke();
      }
    }

    // 4 ── Binary-search first visible row ─────────────────────────────────────
    let startIdx = rows.length;
    {
      let lo = 0,
        hi = rows.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (rows[mid].y + rows[mid].h <= sT) lo = mid + 1;
        else {
          startIdx = mid;
          hi = mid - 1;
        }
      }
    }

    // 5 ── Row backgrounds + horizontal separators ─────────────────────────────
    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      const ry = row.y - sT;
      if (ry > H) break;

      if (row.type === "sprint") {
        ctx.fillStyle = C.groupBg;
        ctx.fillRect(0, ry, W, row.h);
      } else if (row.type === "status") {
        ctx.fillStyle = C.statusBg;
        ctx.fillRect(0, ry, W, row.h);
      } else if (i % 2 === 1) {
        ctx.fillStyle = C.rowAlt;
        ctx.fillRect(0, ry, W, row.h);
      }

      ctx.strokeStyle = C.gridLine;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, ry + row.h - 0.5);
      ctx.lineTo(W, ry + row.h - 0.5);
      ctx.stroke();
    }

    // Build task row map — reused for hover overlay + dependency arrows
    const taskRowMap = new Map(
      rows.filter((r) => r.type === "task").map((r) => [r.task.id, r]),
    );

    // 6 ── Today line (glow + crisp line + diamond marker) ─────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayX = daysBetween(rangeStart, today) * pxPerDay - sL;
    if (todayX >= 0 && todayX <= W) {
      // Soft glow behind line
      ctx.save();
      ctx.shadowColor = C.todayFill;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = C.todayFill;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(todayX, 0);
      ctx.lineTo(todayX, H);
      ctx.stroke();
      ctx.restore(); // shadowBlur → 0

      // Crisp foreground line
      ctx.strokeStyle = C.todayLine;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(todayX, 0);
      ctx.lineTo(todayX, H);
      ctx.stroke();

      // Diamond marker at top
      ctx.fillStyle = C.todayFill;
      ctx.save();
      ctx.translate(todayX, 7);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    // 7 ── Bars ─────────────────────────────────────────────────────────────────
    ctx.font = BAR_FONT;

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      const ry = row.y - sT;
      if (ry > H) break;

      // ── Sprint bar ──────────────────────────────────────────────────────────
      if (row.type === "sprint") {
        const { sprint } = row;
        const sd = parseDate(sprint.start_date);
        const ed = parseDate(sprint.end_date);
        if (!sd || !ed) continue;

        const bxAbs = daysBetween(rangeStart, sd) * pxPerDay;
        const bwAbs = (daysBetween(sd, ed) + 1) * pxPerDay;
        const bxScr = bxAbs - sL;
        if (bxScr + bwAbs < 0 || bxScr > W) continue;

        const barColor =
          sprint.status === "completed"
            ? "#10b981"
            : sprint.status === "active"
              ? "#6366f1"
              : "#94a3b8";
        const barY = ry + (GROUP_H - SPRINT_BAR_H) / 2;

        const done = sprint.completed_count ?? 0;
        const total = sprint.task_count ?? 0;
        const pct = total > 0 ? done / total : 0;

        // Split-fill background — clip to rounded rect shape so edges stay clean
        ctx.save();
        roundRect(ctx, bxScr, barY, bwAbs, SPRINT_BAR_H, 2);
        ctx.clip();

        // Completed portion — solid, high opacity
        if (pct > 0) {
          ctx.fillStyle = barColor + "d4"; // ~83 % opacity
          ctx.fillRect(bxScr, barY, bwAbs * pct, SPRINT_BAR_H);
        }

        // Remaining portion — faint, existing-style low opacity
        if (pct < 1) {
          ctx.fillStyle = barColor + "28";
          ctx.fillRect(
            bxScr + bwAbs * pct,
            barY,
            bwAbs * (1 - pct),
            SPRINT_BAR_H,
          );
        }

        ctx.restore(); // end clip

        // Border on top of fill
        ctx.strokeStyle = barColor + "66";
        ctx.lineWidth = 1;
        roundRect(ctx, bxScr, barY, bwAbs, SPRINT_BAR_H, 5);
        ctx.stroke();

        // Left accent stripe
        ctx.fillStyle = barColor;
        ctx.fillRect(bxScr, barY + 4, 3, SPRINT_BAR_H - 8);
        ctx.beginPath();
        ctx.arc(bxScr + 1.5, barY + 4, 1.5, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bxScr + 1.5, barY + SPRINT_BAR_H - 4, 1.5, 0, Math.PI);
        ctx.fill();

        // Sprint name — white on completed side, colored on remaining
        if (bwAbs > 48) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(
            Math.max(bxScr + 10, 1),
            barY + 1,
            bwAbs - 14,
            SPRINT_BAR_H - 2,
          );
          ctx.clip();
          ctx.fillStyle = pct > 0.25 ? C.textOnBar : C.text;
          ctx.fillText(sprint.name, bxScr + 12, barY + SPRINT_BAR_H / 2 + 4);
          ctx.restore();
        }

        // "done/total" badge on the right
        if (total > 0 && bwAbs > 100) {
          ctx.font = CHIP_FONT;
          const badge = `${done}/${total}`;
          const badgeW = ctx.measureText(badge).width + 10;
          const badgeX = bxScr + bwAbs - badgeW - 6;
          if (badgeX > bxScr + 40) {
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            roundRect(ctx, badgeX, barY + 5, badgeW, 16, 3);
            ctx.fill();
            ctx.fillStyle = C.textOnBar;
            ctx.fillText(badge, badgeX + 5, barY + SPRINT_BAR_H / 2 + 4);
          }
          ctx.font = BAR_FONT;
        }
        continue;
      }

      // ── Status group — background already drawn in section 5 ───────────────
      if (row.type === "status") continue;

      // ── Task bar ───────────────────────────────────────────────────────────
      if (row.type === "task") {
        const { task } = row;
        const isPrev = dragPreview?.taskId === task.id;
        const dd = isPrev ? dragPreview.deltaDays : 0;
        const dType = isPrev ? dragPreview.type : "move";

        const sd = parseDate(task.start_date || task.due_date);
        const ed = parseDate(task.due_date || task.start_date);
        if (!sd) continue;

        let bxAbs = daysBetween(rangeStart, sd) * pxPerDay;
        let bwAbs = Math.max(pxPerDay, (daysBetween(sd, ed) + 1) * pxPerDay);
        if (dType === "move") {
          bxAbs += dd * pxPerDay;
        }
        if (dType === "resize") {
          bwAbs = Math.max(pxPerDay, bwAbs + dd * pxPerDay);
        }
        if (dType === "resize-left") {
          bxAbs += dd * pxPerDay;
          bwAbs = Math.max(pxPerDay, bwAbs - dd * pxPerDay);
        }

        const bxScr = bxAbs - sL;
        if (bxScr + bwAbs < 0 || bxScr > W) continue;

        const barY = ry + (ROW_H - BAR_H) / 2;
        const color = criticalSet?.has(task.id)
          ? "#f59e0b"
          : statuses.find((s) => s.id === task.status_id)?.color || "#6366f1";

        // Out-of-sprint-range: muted dashed bar
        const taskEnd = task.due_date || task.start_date;
        const taskStart = task.start_date || task.due_date;
        const isOutOfRange =
          row.sprintStart &&
          ((taskEnd && taskEnd < row.sprintStart) ||
            (taskStart && row.sprintEnd && taskStart > row.sprintEnd));

        if (isOutOfRange) {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = C.outOfRangeFill;
          roundRect(ctx, bxScr, barY, bwAbs, BAR_H, 2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          roundRect(ctx, bxScr, barY, bwAbs, BAR_H, 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          continue;
        }

        // Drop-shadow ghost while dragging
        if (isPrev) {
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.shadowColor = "rgba(0,0,0,0.6)";
          ctx.shadowBlur = 22;
          ctx.shadowOffsetY = 7;
          ctx.fillStyle = color;
          roundRect(ctx, bxScr, barY, bwAbs, BAR_H, 3);
          ctx.fill();
          ctx.restore(); // clears shadow
        }

        // Base fill
        ctx.globalAlpha = isPrev ? 0.78 : 1;
        ctx.fillStyle = color;
        roundRect(ctx, bxScr, barY, bwAbs, BAR_H, 3);
        ctx.fill();

        // Gradient sheen — commented out, using plain color instead
        // const sheen = ctx.createLinearGradient(bxScr, barY, bxScr, barY + BAR_H);
        // sheen.addColorStop(0,    "rgba(255,255,255,0.22)");
        // sheen.addColorStop(0.45, "rgba(255,255,255,0.03)");
        // sheen.addColorStop(1,    "rgba(0,0,0,0.16)");
        // ctx.fillStyle = sheen;
        // roundRect(ctx, bxScr, barY, bwAbs, BAR_H, 3);
        // ctx.fill();
        ctx.globalAlpha = 1;

        // Title label
        if (bwAbs > 24) {
          ctx.font = BAR_FONT;
          ctx.fillStyle = C.textOnBar;
          ctx.save();
          ctx.beginPath();
          ctx.rect(
            Math.max(bxScr + 6, 0),
            barY,
            Math.min(bwAbs - 12, W),
            BAR_H,
          );
          ctx.clip();
          ctx.fillText(
            task.title,
            Math.max(bxScr + 6, 4),
            barY + BAR_H / 2 + 4,
          );
          ctx.restore();
        }

        // Drag delta pill ("+3d" / "-2d") floating above bar center
        // if (isPrev && Math.abs(dd) > 0) {
        //   ctx.font = CHIP_FONT;
        //   const sign  = dd > 0 ? "+" : "";
        //   const label = `${sign}${dd}d`;
        //   const tipW  = ctx.measureText(label).width + 16;
        //   const tipH  = 20;
        //   const tipX  = Math.max(
        //     2,
        //     Math.min(bxScr + bwAbs / 2 - tipW / 2, W - tipW - 2),
        //   );
        //   const tipY = barY - 30;
        //   ctx.save();
        //   ctx.shadowColor   = "rgba(0,0,0,0.4)";
        //   ctx.shadowBlur    = 10;
        //   ctx.shadowOffsetY = 2;
        //   ctx.fillStyle = "#1e293b";
        //   roundRect(ctx, tipX, tipY, tipW, tipH, 10);
        //   ctx.fill();
        //   ctx.restore();
        //   ctx.fillStyle = "#f1f5f9";
        //   ctx.fillText(label, tipX + 8, tipY + 13);
        //   ctx.font = BAR_FONT;
        // }
      }
    }

    // 7.5 ── Hover overlay — grip handles + date chips (glow/brightening removed)
    const { taskId: hId, alpha: hAlpha } = hoverRef.current;
    if (hId && hAlpha > 0.01) {
      const hRow = taskRowMap.get(hId);
      if (hRow && hRow.y + hRow.h > sT && hRow.y < sT + H) {
        const { task } = hRow;
        const ry = hRow.y - sT;

        const sd = parseDate(task.start_date || task.due_date);
        const ed = parseDate(task.due_date || task.start_date);

        if (sd) {
          const isPrev = dragPreview?.taskId === task.id;
          const dd = isPrev ? dragPreview.deltaDays : 0;
          const dType = isPrev ? dragPreview.type : "move";

          let bxAbs = daysBetween(rangeStart, sd) * pxPerDay;
          let bwAbs = Math.max(pxPerDay, (daysBetween(sd, ed) + 1) * pxPerDay);
          if (dType === "move") {
            bxAbs += dd * pxPerDay;
          }
          if (dType === "resize") {
            bwAbs = Math.max(pxPerDay, bwAbs + dd * pxPerDay);
          }
          if (dType === "resize-left") {
            bxAbs += dd * pxPerDay;
            bwAbs = Math.max(pxPerDay, bwAbs - dd * pxPerDay);
          }

          const bxScr = bxAbs - sL;
          const barY = ry + (ROW_H - BAR_H) / 2;

          // ── Glow halo — commented out ───────────────────────────────────────
          // ctx.save();
          // ctx.shadowColor = color;
          // ctx.shadowBlur  = 18;
          // ctx.globalAlpha = hAlpha * 0.42;
          // ctx.fillStyle   = color;
          // roundRect(ctx, bxScr - 1, barY - 1, bwAbs + 2, BAR_H + 2, 4);
          // ctx.fill();
          // ctx.restore();

          // ── Brightening overlay — commented out ─────────────────────────────
          // ctx.globalAlpha = hAlpha * 0.11;
          // ctx.fillStyle   = "#ffffff";
          // roundRect(ctx, bxScr, barY, bwAbs, BAR_H, 3);
          // ctx.fill();
          // ctx.globalAlpha = 1;

          // ── Grip handles — right pair commented out to avoid title overlap
          // if (bwAbs > 28) {
          //   const gH = 10, gW = 2, gR = 1;
          //   const gy = barY + (BAR_H - gH) / 2;
          //   ctx.globalAlpha = hAlpha * 0.78;
          //   ctx.fillStyle   = "rgba(255,255,255,0.92)";
          //   // Left pair
          //   roundRect(ctx, bxScr + 5,  gy, gW, gH, gR); ctx.fill();
          //   roundRect(ctx, bxScr + 9,  gy, gW, gH, gR); ctx.fill();
          //   // Right pair
          //   roundRect(ctx, bxScr + bwAbs - 7,  gy, gW, gH, gR); ctx.fill();
          //   roundRect(ctx, bxScr + bwAbs - 11, gy, gW, gH, gR); ctx.fill();
          //   ctx.globalAlpha = 1;
          // }

          // ── Date chips — hidden while dragging (drag pill takes over) ───────
          if (!isPrev) {
            ctx.font = CHIP_FONT;
            const days = Math.max(1, daysBetween(sd, ed) + 1);
            const startStr = formatDate(sd);
            const endStr = formatDate(ed) + (days > 1 ? ` · ${days}d` : "");
            const chipH = 20;
            const chipPad = 4;
            const chipR = 1;
            const chipY = barY + (BAR_H - chipH) / 2;

            const drawChip = (text, chipX) => {
              const tw = ctx.measureText(text).width;
              const chipW = tw + chipPad * 2;
              ctx.save();
              // ctx.globalAlpha  = hAlpha * 0.96;
              // ctx.shadowColor  = C.chipShadow;
              // ctx.shadowBlur   = 10;
              // ctx.shadowOffsetY = 2;
              ctx.fillStyle = C.chipBg;
              roundRect(ctx, chipX, chipY, chipW, chipH, chipR);
              ctx.fill();
              ctx.restore();

              // ctx.globalAlpha = hAlpha * 0.96;
              ctx.strokeStyle = C.chipBorder;
              ctx.lineWidth = 1;
              roundRect(ctx, chipX, chipY, chipW, chipH, chipR);
              ctx.stroke();
              ctx.fillStyle = C.chipText;
              ctx.fillText(
                text,
                Math.round(chipX + chipPad),
                Math.round(chipY + chipH / 2 + 4),
              );
              // ctx.globalAlpha = 1;
              return chipW;
            };

            const swMeasure = ctx.measureText(startStr).width + chipPad * 2;
            const sChipX = Math.round(bxScr - swMeasure - 7);
            if (sChipX >= 2) drawChip(startStr, sChipX);

            const eChipX = Math.round(bxScr + bwAbs + 4);
            const ewMeasure = ctx.measureText(endStr).width + chipPad * 2;
            if (eChipX + ewMeasure <= W - 2) drawChip(endStr, eChipX);

            ctx.font = BAR_FONT;
          }
        }
      }
    }

    // 8 ── Dependency arrows ────────────────────────────────────────────────────
    ctx.strokeStyle = C.arrowLine;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      if (row.type !== "task") continue;
      const ry = row.y - sT;
      if (ry > H + 60) break;

      const { task } = row;
      for (const bid of task.blocked_by_ids || []) {
        const bRow = taskRowMap.get(bid);
        if (!bRow) continue;

        const bt = bRow.task;
        const bsd = parseDate(bt.start_date || bt.due_date);
        const bed = parseDate(bt.due_date || bt.start_date);
        const tsd = parseDate(task.start_date || task.due_date);
        if (!bsd || !tsd) continue;

        const x1 = (daysBetween(rangeStart, bed || bsd) + 1) * pxPerDay - sL;
        const y1 = bRow.y - sT + ROW_H / 2;
        const x2 = daysBetween(rangeStart, tsd) * pxPerDay - sL;
        const y2 = ry + ROW_H / 2;

        if ((x1 < 0 && x2 < 0) || (x1 > W && x2 > W)) continue;

        const cx = Math.abs(x2 - x1) * 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + cx, y1, x2 - cx, y2, x2, y2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = C.arrowFill;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 6, y2 - 3);
        ctx.lineTo(x2 - 6, y2 + 3);
        ctx.closePath();
        ctx.fill();
        ctx.setLineDash([4, 3]);
      }
    }
    ctx.setLineDash([]);
  }, [
    rows,
    statuses,
    criticalSet,
    pxPerDay,
    rangeStart,
    headerSegments,
    dragPreview,
    scrollTopRef,
    scrollLeftRef,
    wrapperRef,
  ]);

  // Keep drawRef current so animation tick and resize observer always call latest version
  drawRef.current = draw;

  // Expose redraw() + setHover() to parent via forwarded ref
  useImperativeHandle(
    ref,
    () => ({
      redraw: () => requestAnimationFrame(() => drawRef.current?.()),
      setHover: (taskId) => {
        const h = hoverRef.current;
        const newId = taskId ?? null;
        if (h._target === newId) return;
        h._target = newId;
        startAnimLoop();
      },
    }),
    [startAnimLoop],
  );

  // Re-draw when any data dependency changes
  useEffect(() => {
    requestAnimationFrame(() => drawRef.current?.());
  }, [draw]);

  // Re-draw on viewport resize
  useEffect(() => {
    const wrapper = wrapperRef?.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() =>
      requestAnimationFrame(() => drawRef.current?.()),
    );
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [wrapperRef]);

  // Cancel any in-flight animation RAF on unmount
  useEffect(
    () => () => {
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);
    },
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    />
  );
});

export default GanttCanvas;
