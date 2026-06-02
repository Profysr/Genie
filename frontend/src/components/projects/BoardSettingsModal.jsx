import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Check, GripVertical, Settings2 } from "lucide-react";
import { useCreateStatus, useUpdateStatus, useDeleteStatus } from "@/hooks/useStatusManagement";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#94a3b8", "#6366f1", "#8b5cf6", "#ec4899",
  "#f59e0b", "#22c55e", "#14b8a6", "#3b82f6",
  "#ef4444", "#f97316", "#64748b", "#0ea5e9",
];

export default function BoardSettingsModal({ open, onClose, workspaceSlug, projectId, statuses = [] }) {
  const createStatus = useCreateStatus(workspaceSlug, projectId);
  const updateStatus = useUpdateStatus(workspaceSlug, projectId);
  const deleteStatus = useDeleteStatus(workspaceSlug, projectId);

  const [newName, setNewName]   = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [adding, setAdding]     = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createStatus.mutate(
      { name: newName.trim(), color: newColor, is_done: false },
      { onSuccess: () => { setNewName(""); setNewColor("#6366f1"); setAdding(false); } },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border rounded-xl shadow-xl w-full max-w-lg animate-scale-in">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <Dialog.Title className="text-sm font-semibold">Board Columns</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-3">
              Mark a column as <span className="font-semibold text-emerald-600">Done</span> to count its tasks toward the project completion %.
            </p>

            {statuses.map((s) => (
              <StatusRow
                key={s.id}
                status={s}
                onUpdate={(data) => updateStatus.mutate({ statusId: s.id, ...data })}
                onDelete={() => deleteStatus.mutate(s.id)}
                isDeleting={deleteStatus.isPending}
              />
            ))}

            {/* Add new column */}
            {adding ? (
              <form onSubmit={handleAdd} className="flex items-center gap-2 pt-2 border-t mt-3">
                <ColorPicker value={newColor} onChange={setNewColor} />
                <input
                  autoFocus
                  className="flex-1 text-sm border rounded-md px-2.5 py-1.5 bg-background outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Column name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" disabled={createStatus.isPending}>
                  {createStatus.isPending ? "Adding…" : "Add"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2 pt-2 border-t w-full transition-colors"
              >
                <Plus className="w-4 h-4" /> Add column
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StatusRow({ status, onUpdate, onDelete, isDeleting }) {
  const [name, setName]       = useState(status.name);
  const [editing, setEditing] = useState(false);

  const saveName = () => {
    setEditing(false);
    if (name.trim() && name !== status.name) onUpdate({ name: name.trim() });
    else setName(status.name);
  };

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border bg-background group">
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 cursor-grab flex-shrink-0" />

      {/* Color picker */}
      <ColorPicker
        value={status.color}
        onChange={(color) => onUpdate({ color })}
      />

      {/* Name */}
      {editing ? (
        <input
          autoFocus
          className="flex-1 text-sm bg-transparent outline-none border-b border-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(status.name); setEditing(false); } }}
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-text hover:text-primary transition-colors"
          onClick={() => setEditing(true)}
          title="Click to rename"
        >
          {status.name}
        </span>
      )}

      {/* Done toggle */}
      <button
        onClick={() => onUpdate({ is_done: !status.is_done })}
        title={status.is_done ? "Marked as Done — click to unmark" : "Mark as Done column"}
        className={cn(
          "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border transition-all",
          status.is_done
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "text-muted-foreground border-transparent hover:border-border"
        )}
      >
        <Check className="w-3 h-3" />
        {status.is_done ? "Done" : "Mark done"}
      </button>

      {/* Delete */}
      <button
        onClick={() => {
          if (window.confirm(`Delete "${status.name}"? Move any tasks out first.`)) onDelete();
        }}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-all flex-shrink-0"
        title="Delete column"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: value }}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="absolute top-7 left-0 z-50 bg-popover border rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 w-[136px]">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                c === value ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              onClick={() => { onChange(c); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
