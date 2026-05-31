import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { FolderKanban, Plus, ArrowRight } from "lucide-react";

export default function ProjectsPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects(workspaceSlug);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{projects?.length ?? 0} projects in this workspace</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Project
        </Button>
      </div>

      {isLoading && <div className="text-muted-foreground text-sm">Loading...</div>}

      {!isLoading && projects?.length === 0 && (
        <div className="text-center py-20">
          <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a project to start tracking work.</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1.5" /> New Project</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <button
            key={project.id}
            onClick={() => navigate(`/w/${workspaceSlug}/projects/${project.id}`)}
            className="text-left rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {project.name[0].toUpperCase()}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-medium truncate">{project.name}</p>
            {project.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
            <p className="text-xs text-muted-foreground mt-3">{project.task_count} tasks</p>
          </button>
        ))}
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
