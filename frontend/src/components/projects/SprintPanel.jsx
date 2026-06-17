import { useState, useRef, useEffect } from "react";
import {
  Plus, Play, CheckCircle, Trash2, Zap, ChevronDown,
  Calendar, TrendingDown, LayoutGrid, Rows3,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  useSprints, useCreateSprint, useUpdateSprint,
  useDeleteSprint, useSprintBurndown,
} from "@/hooks/useSprints";
import BurndownChart from "@/components/projects/BurndownChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SPRINT_STATUSES } from "@/lib/constants";

const STATUS_CONFIG = Object.fromEntries(
  Object.values(SPRINT_STATUSES).map(s => [s.value, { label: s.label, color: s.badgeCls }])
);

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function SprintHeader({
  workspaceId, boardId, activeSprint, onSelectSprint, sprintView, onSprintViewChange,
}) {
  const { data: sprints = [] } = useSprints(workspaceId, boardId);
  const createSprint  = useCreateSprint(workspaceId, boardId);
  const updateSprint  = useUpdateSprint(workspaceId, boardId);
  const deleteSprint  = useDeleteSprint(workspaceId, boardId);
  const { data: burndown } = useSprintBurndown(workspaceId, boardId, activeSprint?.id);

  const [showDropdown, setShowDropdown] = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [showBurndown, setShowBurndown] = useState(false);
  const [form, setForm] = useState({ name: "", goal: "", start_date: "", end_date: "" });
  const [confirmState, setConfirmState] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    createSprint.mutate(form, {
      onSuccess: (sprint) => {
        setCreating(false);
        setForm({ name: "", goal: "", start_date: "", end_date: "" });
        onSelectSprint(sprint);
      },
    });
  };

  const totalTasks = activeSprint?.task_count || 0;
  const doneTasks  = activeSprint?.completed_count || 0;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const daysLeft = activeSprint?.end_date
    ? Math.max(0, Math.ceil((new Date(activeSprint.end_date + "T00:00:00") - new Date()) / 86400000))
    : null;
  const isOverdue = daysLeft === 0 && activeSprint?.status === "active";

  const isExecution = activeSprint?.status === "active" || activeSprint?.status === "completed";

  return (
    <div className="flex-shrink-0 border-b bg-card">

      {/* ── Main bar ── */}
      <div className="flex items-center gap-2.5 px-6 py-2.5 flex-wrap min-h-[52px]">

        {/* Sprint selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border bg-background hover:bg-accent transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="max-w-[160px] truncate">
              {activeSprint ? activeSprint.name : "Select sprint"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden py-1">
              {sprints.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">No sprints yet</p>
              ) : (
                sprints.map(sprint => {
                  const cfg = STATUS_CONFIG[sprint.status] || STATUS_CONFIG.planning;
                  const p = sprint.task_count > 0
                    ? Math.round((sprint.completed_count / sprint.task_count) * 100)
                    : 0;
                  return (
                    <button
                      key={sprint.id}
                      onClick={() => { onSelectSprint(sprint); setShowDropdown(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors",
                        activeSprint?.id === sprint.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{sprint.name}</div>
                        {sprint.task_count > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p}%` }} />
                            </div>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {sprint.completed_count}/{sprint.task_count}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0", cfg.color)}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })
              )}
              <div className="border-t mt-1 pt-1 px-2">
                <button
                  onClick={() => { setCreating(true); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New sprint
                </button>
              </div>
            </div>
          )}
        </div>

        {activeSprint ? (
          <>
            {/* Status badge */}
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0",
              STATUS_CONFIG[activeSprint.status]?.color
            )}>
              {STATUS_CONFIG[activeSprint.status]?.label}
            </span>

            {/* Goal */}
            {activeSprint.goal && (
              <span className="text-xs text-muted-foreground hidden xl:block max-w-xs truncate">
                {activeSprint.goal}
              </span>
            )}

            <div className="w-px h-4 bg-border flex-shrink-0" />

            {/* Date range + days left */}
            {activeSprint.start_date && activeSprint.end_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span>
                  {fmtDate(activeSprint.start_date)} – {fmtDate(activeSprint.end_date)}
                </span>
                {daysLeft !== null && activeSprint.status === "active" && (
                  <span className={cn(
                    "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                    isOverdue
                      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                      : daysLeft <= 2
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isOverdue ? "Overdue" : `${daysLeft}d left`}
                  </span>
                )}
              </div>
            )}

            <div className="w-px h-4 bg-border flex-shrink-0" />

            {/* Progress */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{doneTasks}</span>
                /{totalTasks} done
              </span>
              {totalTasks > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">{pct}%</span>
                </div>
              )}
            </div>

            {/* Push actions to the right */}
            <div className="flex-1" />

            {/* View toggle — only during execution */}
            {isExecution && (
              <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onSprintViewChange("columns")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    sprintView === "columns"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Columns</span>
                </button>
                <button
                  onClick={() => onSprintViewChange("swimlanes")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    sprintView === "swimlanes"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Rows3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Swim lanes</span>
                </button>
              </div>
            )}

            {/* Burndown toggle */}
            {burndown && burndown.total > 0 && (
              <button
                onClick={() => setShowBurndown(!showBurndown)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0",
                  showBurndown
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Burndown</span>
              </button>
            )}

            {/* Start sprint */}
            {activeSprint.status === "planning" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs flex-shrink-0"
                onClick={() => updateSprint.mutate({ sprintId: activeSprint.id, status: "active" })}
              >
                <Play className="w-3 h-3" /> Start Sprint
              </Button>
            )}

            {/* Complete sprint */}
            {activeSprint.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs flex-shrink-0 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                onClick={() => updateSprint.mutate({ sprintId: activeSprint.id, status: "completed" })}
              >
                <CheckCircle className="w-3 h-3" /> Complete
              </Button>
            )}

            {/* Delete */}
            <button
              onClick={() => setConfirmState({
                message: `Delete "${activeSprint.name}"? This cannot be undone.`,
                onConfirm: () => { deleteSprint.mutate(activeSprint.id); onSelectSprint(null); },
              })}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors flex-shrink-0"
              title="Delete sprint"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* New sprint */}
            <button
              onClick={() => setCreating(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
              title="New sprint"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 ml-1">
            <span className="text-sm text-muted-foreground">No sprint selected</span>
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New sprint
            </Button>
          </div>
        )}
      </div>

      {/* ── Burndown chart (expandable) ── */}
      {showBurndown && burndown && (
        <div className="border-t px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-4 mb-3">
            <p className="text-xs font-semibold">Burndown</p>
            <span className="text-xs text-emerald-600 font-medium">{burndown.completed} done</span>
            <span className="text-xs text-orange-500 font-medium">{burndown.remaining} remaining</span>
          </div>
          <BurndownChart data={burndown} height={100} />
        </div>
      )}

      {/* ── Inline create form ── */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="border-t px-6 py-4 bg-muted/20 flex items-end gap-3 flex-wrap"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Sprint name *</label>
            <input
              autoFocus required
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Sprint 3"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-muted-foreground mb-1 block">Goal (optional)</label>
            <input
              className="w-full text-sm border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              placeholder="What will this sprint accomplish?"
              value={form.goal}
              onChange={e => setForm({ ...form, goal: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start</label>
            <input
              type="date"
              className="text-sm border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End</label>
            <input
              type="date"
              className="text-sm border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-ring"
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createSprint.isPending}>
              {createSprint.isPending ? "Creating…" : "Create"}
            </Button>
            <Button
              type="button" size="sm" variant="outline"
              onClick={() => {
                setCreating(false);
                setForm({ name: "", goal: "", start_date: "", end_date: "" });
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {confirmState && (
        <ConfirmModal
          title="Delete sprint?"
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
