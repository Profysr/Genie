import { useState } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import { useProject } from "@/hooks/useProjects";
import { useTasks, useMoveTask } from "@/hooks/useTasks";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";
import KanbanColumn from "@/components/tasks/KanbanColumn";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KanbanPage() {
  const { workspaceSlug, projectId } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProject(workspaceSlug, projectId);
  const { data: tasks = [] } = useTasks(workspaceSlug, projectId);
  const moveTask = useMoveTask(workspaceSlug, projectId);
  const [createModal, setCreateModal] = useState({ open: false, statusId: null });

  // Subscribe to real-time updates
  useWorkspaceSocket(workspaceSlug);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    moveTask.mutate({
      taskId: draggableId,
      status_id: destination.droppableId,
      order: destination.index,
    });
  };

  const tasksByStatus = (statusId) =>
    tasks
      .filter((t) => t.status_detail?.id === statusId)
      .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/w/${workspaceSlug}/projects`)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-semibold">{project?.name}</h1>
            {project?.description && <p className="text-xs text-muted-foreground">{project.description}</p>}
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateModal({ open: true, statusId: project?.statuses?.[0]?.id })}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Task
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-5 h-full">
            {project?.statuses?.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByStatus(col.id)}
                onAddTask={(statusId) => setCreateModal({ open: true, statusId })}
                onTaskClick={(task) => {}}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      <CreateTaskModal
        open={createModal.open}
        onClose={() => setCreateModal({ open: false, statusId: null })}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        defaultStatusId={createModal.statusId}
      />
    </div>
  );
}
