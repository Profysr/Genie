import { useState } from "react";
import { useCreateTask } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const PRIORITIES = ["no_priority", "low", "medium", "high", "urgent"];

export default function CreateTaskModal({ open, onClose, workspaceSlug, projectId, defaultStatusId }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("no_priority");
  const { mutate, isPending } = useCreateTask(workspaceSlug, projectId);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(
      { title, priority, status_id: defaultStatusId || null },
      { onSuccess: () => { onClose(); setTitle(""); setPriority("no_priority"); } }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border rounded-xl shadow-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">New Task</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      priority === p ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"
                    }`}
                  >
                    {p.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending || !title.trim()}>{isPending ? "Creating..." : "Create task"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
