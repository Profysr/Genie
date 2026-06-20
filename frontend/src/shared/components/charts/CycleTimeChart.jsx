import { Scatter } from "react-chartjs-2";
import "./chartSetup";
import { chartColors, hexAlpha } from "./chartTheme";
import { PRIORITIES } from "@/shared/lib/constants";
import ChartCard from "./ChartCard";

function makeMedianPlugin(median, color) {
  return {
    id: "cycleMedianLine",
    afterDraw(chart) {
      if (!median) return;
      const { ctx, chartArea, scales } = chart;
      const y = scales.y.getPixelForValue(median);
      if (y < chartArea.top || y > chartArea.bottom) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.strokeStyle = color;
      ctx.setLineDash([4, 2]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "10px inherit";
      ctx.textAlign = "right";
      ctx.fillText(`Median ${median}d`, chartArea.right - 6, y - 4);
      ctx.restore();
    },
  };
}

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-muted/60">
      <span className="text-lg font-bold tabular-nums" style={{ color }}>
        {value}d
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function CycleTimeChart({ data, loading }) {
  const points = data?.data_points || [];
  const stats = data?.stats || {};
  const isEmpty = points.length === 0;
  const c = chartColors();

  const datasets = PRIORITIES.map((pri) => {
    const subset = points.filter((p) => p.priority === pri.value);
    if (!subset.length) return null;
    return {
      label: pri.label,
      data: subset.map((p) => ({
        x: new Date(p.completed_date).getTime(),
        y: p.cycle_days,
        title: p.title,
        completed_date: p.completed_date,
        priority: p.priority,
      })),
      backgroundColor: hexAlpha(pri.hex, 0.8),
      pointRadius: 5,
      pointHoverRadius: 7,
    };
  }).filter(Boolean);

  const chartData = { datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: c.mutedForeground,
          boxWidth: 12,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: c.popover,
        borderColor: c.border,
        borderWidth: 1,
        titleColor: c.foreground,
        bodyColor: c.mutedForeground,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => items[0]?.raw?.title || "",
          label: (ctx) => [
            ` Cycle time: ${ctx.raw.y}d`,
            ` Completed: ${ctx.raw.completed_date}`,
            ` Priority: ${ctx.raw.priority}`,
          ],
        },
      },
    },
    scales: {
      x: {
        grid: { color: c.border },
        ticks: {
          color: c.mutedForeground,
          font: { size: 10 },
          maxTicksLimit: 8,
          callback: (v) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          },
        },
        border: { display: false },
      },
      y: {
        grid: { color: c.border },
        ticks: {
          color: c.mutedForeground,
          font: { size: 11 },
          callback: (v) => `${v}d`,
        },
        border: { display: false },
        title: {
          display: true,
          text: "days",
          color: c.mutedForeground,
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <ChartCard
      title="Cycle Time"
      subtitle="Time from first activity → Done per task"
      loading={loading}
      empty={isEmpty}
      emptyText="Complete tasks with in-progress activity to see cycle time"
    >
      {stats.count > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          <StatPill label="Median" value={stats.median} color={c.primary} />
          <StatPill label="P75" value={stats.p75} color="#f59e0b" />
          <StatPill label="P95" value={stats.p95} color="#ef4444" />
          <StatPill label="Avg" value={stats.avg} color="#6366f1" />
          <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-muted/60">
            <span className="text-lg font-bold tabular-nums">
              {stats.count}
            </span>
            <span className="text-[10px] text-muted-foreground">Tasks</span>
          </div>
        </div>
      )}
      <div style={{ height: 220, position: "relative" }}>
        <Scatter
          data={chartData}
          options={options}
          plugins={[makeMedianPlugin(stats.median, c.primary)]}
        />
      </div>
    </ChartCard>
  );
}
