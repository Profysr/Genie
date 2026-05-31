import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  X, Flag, Calendar, User, CheckSquare, MessageSquare,
  ChevronDown, Trash2, Plus, Check, Activity,
} from "lucide-react";
import { useTaskDetail, useUpdateTaskDetail, useCreateComment, useDeleteComment, useCreateSubtask, useToggleSubtask, useDeleteSubtask } from "@/hooks/useTaskDetail";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "no_priority", label: "No Priority",  color: "text-muted-foreground" },
  { value: "low",         label: "Low",           color: "text-blue-500" },
  { value: "medium",      label: "Medium",        color: "text-yellow-500" },
  { value: "high",        label: "High",          color: "text-orange-500" },
  { value: "urgent",      label: "Urgent",        color: "text-red-500" },
];

export default function TaskDetailPanel({ taskId, projectStatuses = [], onClose }) {
  const { workspaceSlug, projectId } = useParams();
  const { user } = useAuthStore();
  const { data: task, isLoading } = useTaskDetail(workspaceSlug, projectId, taskId);
  const update = useUpdateTaskDetail(workspaceSlug, projectId, taskId);
  const createComment = useCreateComment(workspaceSlug, projectId, taskId);
  const deleteComment = useDeleteComment(workspaceSlug, projectId, taskId);
  const createSubtask = useCreateSubtask(workspaceSlug, projectId, taskId);
  const toggleSubtask = useToggleSubtask(workspaceSlug, projectId, taskId);
  const deleteSubtask = useDeleteSubtask(workspaceSlug, projectId, taskId);

  const [commentBody, setCommentBody] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  if (isLoading || !task) {
    return (
      <div className="w-[480px] border-l flex items-center justify-center bg-background">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const priority = PRIORITY_OPTIONS.find((p) => p.value === task.priority) || PRIORITY_OPTIONS[0];

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft !== task.title) update.mutate({ title: titleDraft.trim() });
    setEditingTitle(false);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createComment.mutate(commentBody.trim(), { onSuccess: () => setCommentBody("") });
  };

  const handleSubtaskAdd = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    createSubtask.mutate(newSubtask.trim(), { onSuccess: () => setNewSubtask("") });
  };

  return (
    <div className="w-[480px] flex-shrink-0 border-l flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Task Detail</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded p-0.5 hover:bg-accent">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 space-y-5">

          {/* Title */}
          <div>
            {editingTitle ? (
              <textarea
                ref={titleRef}
                className="w-full text-lg font-semibold resize-none bg-transparent border-b border-primary outline-none pb-1"
                value={titleDraft}
                rows={2}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTitleSave(); } }}
              />
            ) : (
              <h2
                className="text-lg font-semibold cursor-text hover:bg-accent/50 rounded px-1 -mx-1 py-0.5"
                onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Status */}
            <MetaField label="Status" icon={<ChevronDown className="w-3.5 h-3.5" />}>
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={task.status_detail?.id || ""}
                onChange={(e) => update.mutate({ status_id: e.target.value })}
              >
                {projectStatuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </MetaField>

            {/* Priority */}
            <MetaField label="Priority" icon={<Flag className={cn("w-3.5 h-3.5", priority.color)} />}>
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={task.priority}
                onChange={(e) => update.mutate({ priority: e.target.value })}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </MetaField>

            {/* Due date */}
            <MetaField label="Due Date" icon={<Calendar className="w-3.5 h-3.5" />}>
              <input
                type="date"
                className="w-full bg-transparent outline-none text-sm"
                value={task.due_date || ""}
                onChange={(e) => update.mutate({ due_date: e.target.value || null })}
              />
            </MetaField>

            {/* Created by */}
            <MetaField label="Created by" icon={<User className="w-3.5 h-3.5" />}>
              <span className="text-sm truncate">{task.created_by?.full_name || task.created_by?.email || "—"}</span>
            </MetaField>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
            <DescriptionEditor task={task} onSave={(desc) => update.mutate({ description: desc })} />
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Subtasks {task.subtasks?.length > 0 && `(${task.done_subtask_count}/${task.subtask_count})`}
              </p>
            </div>
            <div className="space-y-1.5 mb-2">
              {task.subtasks?.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleSubtask.mutate({ subtaskId: sub.id, is_done: !sub.is_done })}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                      sub.is_done ? "bg-primary border-primary" : "border-border hover:border-primary"
                    )}
                  >
                    {sub.is_done && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <span className={cn("text-sm flex-1", sub.is_done && "line-through text-muted-foreground")}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask.mutate(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubtaskAdd} className="flex gap-2">
              <input
                className="flex-1 text-sm border-b border-border bg-transparent outline-none py-0.5 placeholder:text-muted-foreground focus:border-primary"
                placeholder="Add subtask…"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
              />
              {newSubtask && (
                <button type="submit" className="text-primary text-xs font-medium">Add</button>
              )}
            </form>
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                Comments {task.comments?.length > 0 && `(${task.comments.length})`}
              </p>
            </div>
            <div className="space-y-3 mb-3">
              {task.comments?.map((c) => (
                <div key={c.id} className="flex gap-2.5 group">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.author?.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{c.author?.full_name || c.author?.email}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">{c.body}</p>
                  </div>
                  {c.author?.email === user?.email && (
                    <button
                      onClick={() => deleteComment.mutate(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleCommentSubmit} className="flex gap-2 items-end">
              <textarea
                className="flex-1 text-sm border rounded-md bg-transparent outline-none p-2 placeholder:text-muted-foreground focus:border-primary resize-none"
                placeholder="Write a comment…"
                rows={2}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(e); } }}
              />
              <Button type="submit" size="sm" disabled={!commentBody.trim() || createComment.isPending}>
                Send
              </Button>
            </form>
          </div>

          {/* Activity */}
          {task.activities?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Activity</p>
              </div>
              <div className="space-y-2">
                {task.activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      {a.actor?.full_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span>
                      <span className="font-medium text-foreground">{a.actor?.full_name || "Someone"}</span>
                      {" "}{a.verb.replace(/_/g, " ")}
                      {a.meta?.from && <> from <span className="font-medium text-foreground">{a.meta.from}</span></>}
                      {a.meta?.to   && <> to <span className="font-medium text-foreground">{a.meta.to}</span></>}
                      <span className="ml-1.5">{format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function MetaField({ label, icon, children }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        {children}
      </div>
    </div>
  );
}

function DescriptionEditor({ task, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.description || "");
  const ref = useRef(null);

  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const save = () => {
    if (draft !== task.description) onSave(draft);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        onClick={() => { setDraft(task.description || ""); setEditing(true); }}
        className="text-sm text-muted-foreground cursor-text hover:bg-accent/50 rounded px-1 -mx-1 py-1 min-h-[36px]"
      >
        {task.description || <span className="italic">Add a description…</span>}
      </div>
    );
  }

  return (
    <div>
      <textarea
        ref={ref}
        className="w-full text-sm border rounded-md p-2 bg-transparent outline-none focus:border-primary resize-none"
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
      />
    </div>
  );
}
