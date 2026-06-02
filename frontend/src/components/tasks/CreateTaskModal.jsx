import { useState } from "react";
import { useCreateTask } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { TASK_TYPES } from "@/lib/taskTypes";
import { cn } from "@/lib/utils";

const PRIORITIES = [
  { value: "no_priority", label: "None" },
  { value: "low",         label: "Low" },
  { value: "medium",      label: "Medium" },
  { value: "high",        label: "High" },
  { value: "urgent",      label: "Urgent" },
];

const PRIORITY_COLORS = {
  no_priority: "border-input text-muted-foreground",
  low:         "border-blue-300   text-blue-600   bg-blue-50",
  medium:      "border-yellow-300 text-yellow-600 bg-yellow-50",
  high:        "border-orange-300 text-orange-600 bg-orange-50",
  urgent:      "border-red-300    text-red-600    bg-red-50",
};

export default function CreateTaskModal({
  open, onClose, workspaceSlug, projectId,
  defaultStatusId, statuses = [], members = [],
}) {
  const { mutate, isPending } = useCreateTask(workspaceSlug, projectId);

  const [title,      setTitle]      = useState("");
  const [priority,   setPriority]   = useState("no_priority");
  const [taskType,   setTaskType]   = useState("task");
  const [statusId,   setStatusId]   = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate,    setDueDate]    = useState("");
  const [desc,       setDesc]       = useState("");

  const reset = () => {
    setTitle(""); setPriority("no_priority"); setTaskType("task");
    setStatusId(""); setAssigneeId(""); setDueDate(""); setDesc("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(
      {
        title,
        priority,
        task_type:   taskType,
        status_id:   statusId || defaultStatusId || null,
        assignee_id: assigneeId || null,
        due_date:    dueDate || null,
        description: desc,
      },
      { onSuccess: () => { onClose(); reset(); } },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border rounded-xl shadow-xl w-full max-w-lg animate-scale-in">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <Dialog.Title className="text-sm font-semibold">Create Task</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Type chips */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {TASK_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = taskType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTaskType(t.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
                        active
                          ? `${t.bg} ${t.color} border-current`
                          : "border-input text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="task-title" className="text-xs font-medium">Title</Label>
              <Input
                id="task-title"
                className="mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-medium">Description</Label>
              <textarea
                className="mt-1 w-full text-sm border rounded-md px-3 py-2 bg-background outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground"
                rows={2}
                placeholder="Optional description…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {/* Row: status + priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Status</Label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  value={statusId || defaultStatusId || ""}
                  onChange={(e) => setStatusId(e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium">Priority</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium border transition-colors",
                        priority === p.value
                          ? PRIORITY_COLORS[p.value]
                          : "border-input text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row: assignee + due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Assignee</Label>
                <select
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user?.id} value={m.user?.id}>
                      {m.user?.full_name || m.user?.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium">Due Date</Label>
                <input
                  type="date"
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => { onClose(); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
                {isPending ? "Creating…" : "Create Task"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
