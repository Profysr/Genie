import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowUp, ArrowDown, Minus, Calendar, MessageSquare, CheckSquare } from "lucide-react";

const PRIORITY_CONFIG = {
  urgent:      { label: "Urgent",      icon: AlertCircle, className: "text-red-500" },
  high:        { label: "High",        icon: ArrowUp,     className: "text-orange-500" },
  medium:      { label: "Medium",      icon: Minus,       className: "text-yellow-500" },
  low:         { label: "Low",         icon: ArrowDown,   className: "text-blue-400" },
  no_priority: { label: "No priority", icon: Minus,       className: "text-muted-foreground" },
};

export default function TaskCard({ task, index, onClick }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.no_priority;
  const PriorityIcon = priority.icon;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(task)}
          className={cn(
            "bg-card border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-all select-none",
            snapshot.isDragging && "shadow-lg rotate-1 border-primary/50"
          )}
        >
          <p className="text-sm font-medium leading-snug mb-2">{task.title}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PriorityIcon className={cn("w-3.5 h-3.5", priority.className)} />
              {task.due_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              {task.subtask_count > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <CheckSquare className="w-3 h-3" />
                  {task.done_subtask_count}/{task.subtask_count}
                </span>
              )}
              {task.comment_count > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <MessageSquare className="w-3 h-3" />
                  {task.comment_count}
                </span>
              )}
              {task.assignee && (
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {task.assignee.display_name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
