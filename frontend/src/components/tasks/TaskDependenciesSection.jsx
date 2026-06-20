import { useState } from "react";
import { useDependencies, useAddDependency, useRemoveDependency } from "@/hooks/useDependencies";
import { useTasks } from "@/hooks/useTasks";
import { X, Plus, AlertTriangle, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPriority } from "@/lib/constants";

function PriorityIcon({ value }) {
  const p = getPriority(value);
  const Icon = p.icon;
  return <Icon className={cn("w-3 h-3 flex-shrink-0", p.textCls)} />;
}

function DepRow({ dep, onRemove }) {
  const task = dep.task;
  return (
    <div className="flex items-center gap-2 group px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
      <PriorityIcon value={task?.priority} />
      <span className="text-xs flex-1 truncate">{task?.title}</span>
      {task?.status_detail && (
        <span
          className="text-[10px] px-1.5 rounded font-medium leading-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: task.status_detail.color + "20", color: task.status_detail.color }}
        >
          {task.status_detail.name}
        </span>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive transition-opacity flex-shrink-0 ml-auto"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function DepPicker({ tasks, label, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const filtered = tasks
    .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="mx-2 mb-2 border rounded-lg bg-background shadow-md overflow-hidden">
      <div className="px-2.5 py-1.5 border-b flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-1.5 border-b">
        <Search className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
        <input
          autoFocus
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/60"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-40 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center">No eligible tasks</p>
        ) : (
          filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => { onAdd(t.id); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
            >
              <PriorityIcon value={t.priority} />
              <span className="truncate flex-1">{t.title}</span>
              {t.status_detail && (
                <span
                  className="text-[10px] flex-shrink-0"
                  style={{ color: t.status_detail.color }}
                >
                  {t.status_detail.name}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function DepCard({ icon: Icon, iconCls, borderCls, bgCls, labelCls, label, count, onAdd, showPicker, children }) {
  return (
    <div className={cn("rounded-lg border overflow-hidden", borderCls, bgCls)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", iconCls)} />
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider flex-1", labelCls)}>
          {label}
        </span>
        {count > 0 && (
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", iconCls, borderCls, "bg-transparent border")}>
            {count}
          </span>
        )}
        <button
          onClick={onAdd}
          className={cn(
            "flex items-center gap-0.5 text-[11px] font-medium transition-colors px-1.5 py-0.5 rounded",
            showPicker ? `${iconCls} bg-black/5 dark:bg-white/5` : `${labelCls} hover:bg-black/5 dark:hover:bg-white/5`,
          )}
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {children}
    </div>
  );
}

export default function TaskDependenciesSection({ workspaceId, boardId, taskId }) {
  const { data: deps = { blocked_by: [], blocking: [] } } = useDependencies(workspaceId, boardId, taskId);
  const { data: allTasks = [] } = useTasks(workspaceId, boardId);
  const addDep = useAddDependency(workspaceId, boardId, taskId);
  const removeDep = useRemoveDependency(workspaceId, boardId, taskId);
  const [picker, setPicker] = useState(null); // "blocked_by" | "blocks" | null

  // A task cannot appear in both directions — mutual exclusion prevents circular deadlocks
  const blockedByIds = new Set(deps.blocked_by.map((d) => d.task?.id).filter(Boolean));
  const blockingIds  = new Set(deps.blocking.map((d) => d.task?.id).filter(Boolean));

  const availableForBlockedBy = allTasks.filter(
    (t) => t.id !== taskId && !blockedByIds.has(t.id) && !blockingIds.has(t.id),
  );
  const availableForBlocking = allTasks.filter(
    (t) => t.id !== taskId && !blockingIds.has(t.id) && !blockedByIds.has(t.id),
  );

  return (
    <div className="space-y-2">
      {/* Blocked by */}
      <DepCard
        icon={AlertTriangle}
        iconCls="text-amber-500"
        borderCls="border-amber-500/25"
        bgCls="bg-amber-500/5"
        labelCls="text-amber-600/70 dark:text-amber-400/70"
        label="Blocked by"
        count={deps.blocked_by.length}
        onAdd={() => setPicker(picker === "blocked_by" ? null : "blocked_by")}
        showPicker={picker === "blocked_by"}
      >
        {picker === "blocked_by" && (
          <DepPicker
            tasks={availableForBlockedBy}
            label="This task is blocked by…"
            onAdd={(id) => addDep.mutate({ task_id: id, type: "blocked_by" })}
            onClose={() => setPicker(null)}
          />
        )}
        <div className="px-1 pb-1.5 space-y-0.5">
          {deps.blocked_by.map((d) => (
            <DepRow key={d.id} dep={d} onRemove={() => removeDep.mutate(d.id)} />
          ))}
          {deps.blocked_by.length === 0 && picker !== "blocked_by" && (
            <p className="text-[11px] text-muted-foreground/50 text-center py-2 italic">
              Not blocked by anything
            </p>
          )}
        </div>
      </DepCard>

      {/* Blocking */}
      <DepCard
        icon={ArrowRight}
        iconCls="text-blue-500"
        borderCls="border-blue-500/25"
        bgCls="bg-blue-500/5"
        labelCls="text-blue-600/70 dark:text-blue-400/70"
        label="Blocking"
        count={deps.blocking.length}
        onAdd={() => setPicker(picker === "blocks" ? null : "blocks")}
        showPicker={picker === "blocks"}
      >
        {picker === "blocks" && (
          <DepPicker
            tasks={availableForBlocking}
            label="This task blocks…"
            onAdd={(id) => addDep.mutate({ task_id: id, type: "blocks" })}
            onClose={() => setPicker(null)}
          />
        )}
        <div className="px-1 pb-1.5 space-y-0.5">
          {deps.blocking.map((d) => (
            <DepRow key={d.id} dep={d} onRemove={() => removeDep.mutate(d.id)} />
          ))}
          {deps.blocking.length === 0 && picker !== "blocks" && (
            <p className="text-[11px] text-muted-foreground/50 text-center py-2 italic">
              Not blocking any tasks
            </p>
          )}
        </div>
      </DepCard>
    </div>
  );
}
