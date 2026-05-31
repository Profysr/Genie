import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useProjects } from "@/hooks/useProjects";
import api from "@/lib/api";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: projects = [] } = useProjects(workspaceSlug);
  const { data: members = [] } = useQuery({
    queryKey: ["workspace-members", workspaceSlug],
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/members/`).then((r) => r.data.results || r.data),
  });

  const totalTasks = projects.reduce((sum, p) => sum + (p.task_count || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Good to see you, {user?.display_name}</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard label="Members" value={members.length} />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first project to get started.</p>
          <Button onClick={() => navigate(`/w/${workspaceSlug}/projects`)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Project
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.slice(0, 6).map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/w/${workspaceSlug}/projects/${project.id}`)}
                className="text-left rounded-xl border bg-card p-4 hover:border-primary/50 transition-all"
              >
                <p className="font-medium truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{project.task_count} tasks</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
}
