import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Trash2, Plus, Check, CheckSquare, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import VoltEditor from "@/components/ui/VoltEditor";

export function TaskTitle({ task, canEdit, update, setConflict }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const handleSave = () => {
    if (draft.trim() && draft !== task.title)
      update.mutate(
        { title: draft.trim(), version: task.version },
        { onError: (err) => { if (err?.response?.status === 409) setConflict(err.response.data); } },
      );
    setEditing(false);
  };

  if (editing && canEdit) {
    return (
      <textarea
        ref={ref}
        rows={2}
        className="w-full text-xl font-bold resize-none bg-transparent border-b-2 border-primary outline-none pb-1 leading-snug"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
        }}
      />
    );
  }

  return (
    <h2
      onClick={() => canEdit && (setDraft(task.title), setEditing(true))}
      className={cn(
        "text-xl font-bold leading-snug rounded px-1 -mx-1 py-0.5",
        canEdit && "cursor-text hover:bg-accent/40",
      )}
    >
      {task.title}
    </h2>
  );
}

export function ChildTasksSection({
  childTasks, task, canEdit, taskId, allTasks, attachChild, createChild, navigate, projectStatuses,
}) {
  const [childrenOpen, setChildrenOpen] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createChild.mutate(
      { title: newTitle.trim(), status_id: projectStatuses[0]?.id },
      { onSuccess: () => setNewTitle("") },
    );
  };

  const filtered = allTasks
    .filter((t) => !t.parent_id && t.id !== taskId && !childTasks.some((c) => c.id === t.id))
    .filter((t) => t.title.toLowerCase().includes(pickerQuery.toLowerCase()))
    .slice(0, 8);

  return (
    <div>
      <div className="flex items-center mb-2">
        <button
          onClick={() => setChildrenOpen((o) => !o)}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          {childrenOpen
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Child Tasks{" "}
            {childTasks.length > 0 && (
              <span className="ml-1 font-normal normal-case">
                ({task.done_child_count}/{childTasks.length})
              </span>
            )}
          </p>
        </button>
        {canEdit && (
          <button
            onClick={() => { setShowPicker((v) => !v); setPickerQuery(""); }}
            className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-0.5 flex-shrink-0 ml-2"
          >
            <Link2 className="w-3 h-3" /> Attach
          </button>
        )}
      </div>

      {showPicker && (
        <div className="mb-2 border rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="px-2.5 py-2 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Attach existing task</span>
            <button onClick={() => setShowPicker(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            autoFocus
            className="w-full px-2.5 py-2 text-xs border-b bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Search tasks…"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
          />
          <div className="max-h-40 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground text-center">No tasks available</p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { attachChild.mutate(t.id); setShowPicker(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.status_detail?.color || "#94a3b8" }} />
                  <span className="truncate flex-1">{t.title}</span>
                  {t.status_detail && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{t.status_detail.name}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {childrenOpen && (
        <div className="space-y-1.5 ml-1">
          {childTasks.map((child) => (
            <div key={child.id} className="flex items-center gap-2 group">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: child.status_detail?.color || "#94a3b8" }} />
              <button
                onClick={() => navigate(`?task=${child.id}`, { replace: true })}
                className="text-sm flex-1 text-left hover:text-primary transition-colors truncate"
              >
                {child.title}
              </button>
              <span className="text-xs text-muted-foreground">{child.status_detail?.name}</span>
            </div>
          ))}
          {canEdit && (
            <form onSubmit={handleAdd} className="flex gap-2 mt-1">
              <input
                className="flex-1 text-sm border-b border-border bg-transparent outline-none py-0.5 placeholder:text-muted-foreground focus:border-primary"
                placeholder="Add child task…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              {newTitle && (
                <button type="submit" className="text-primary text-xs font-medium">Add</button>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function ChecklistSection({ task, subtasks, canEdit, toggleSubtask, deleteSubtask, createSubtask }) {
  const [newSubtask, setNewSubtask] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    createSubtask.mutate(newSubtask.trim(), { onSuccess: () => setNewSubtask("") });
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Checklist{" "}
          {subtasks.length > 0 && (
            <span className="ml-1 font-normal normal-case">
              ({task.done_subtask_count}/{task.subtask_count})
            </span>
          )}
        </p>
      </div>
      <div className="space-y-1.5 mb-2">
        {subtasks.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2 group">
            <button
              onClick={() => canEdit && toggleSubtask.mutate({ subtaskId: sub.id, is_done: !sub.is_done })}
              disabled={!canEdit}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                sub.is_done ? "bg-primary border-primary" : "border-border",
                canEdit && "hover:border-primary",
              )}
            >
              {sub.is_done && <Check className="w-2.5 h-2.5 text-white" />}
            </button>
            <span className={cn("text-sm flex-1", sub.is_done && "line-through text-muted-foreground")}>
              {sub.title}
            </span>
            {canEdit && (
              <button
                onClick={() => deleteSubtask.mutate(sub.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            className="flex-1 text-sm border-b border-border bg-transparent outline-none py-0.5 placeholder:text-muted-foreground focus:border-primary"
            placeholder="Add checklist item…"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
          />
          {newSubtask && (
            <button type="submit" className="text-primary text-xs font-medium">Add</button>
          )}
        </form>
      )}
    </div>
  );
}
