import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick }) {
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-medium">{column.name}</span>
          <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable task list */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 min-h-[120px] rounded-lg p-1 transition-colors ${
              snapshot.isDraggingOver ? "bg-primary/5" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onClick={onTaskClick} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
