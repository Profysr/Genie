import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function DashboardPage() {
  const { workspaceSlug } = useParams();
  const { user } = useAuthStore();

  const { data: members } = useQuery({
    queryKey: ["workspace-members", workspaceSlug],
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/members/`).then((r) => r.data.results || r.data),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Good to see you, {user?.display_name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Projects" value="—" />
        <StatCard label="Open Tasks" value="—" />
        <StatCard label="Members" value={members?.length ?? "—"} />
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No projects yet</p>
        <p className="text-sm mt-1">Create your first project to get started.</p>
      </div>
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
