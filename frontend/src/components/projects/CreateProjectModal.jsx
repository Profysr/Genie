import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCreateProject } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export default function CreateProjectModal({ open, onClose }) {
  const { workspaceSlug } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { mutate, isPending, error } = useCreateProject(workspaceSlug);

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ name, description }, { onSuccess: () => { onClose(); setName(""); setDescription(""); } });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border rounded-xl shadow-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">New Project</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error.response?.data?.name?.[0] || "Something went wrong."}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="project-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending || !name.trim()}>{isPending ? "Creating..." : "Create project"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
