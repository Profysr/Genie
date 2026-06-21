import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Network, Users } from "lucide-react";
import { Loader } from "@/shared/components/ui/Loader";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Avatar } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import { useOrgChart } from "@/apps/org-structure/hooks/useOrg";

export default function OrgChartPage() {
  const { workspaceId } = useParams();
  const { data, isLoading } = useOrgChart(workspaceId);
  const nodes = data?.nodes ?? [];

  // Group members by department name
  const grouped = useMemo(() => {
    const map = {};
    const ungrouped = [];
    nodes.forEach((node) => {
      if (node.departments.length === 0) {
        ungrouped.push(node);
      } else {
        node.departments.forEach((dept) => {
          if (!map[dept.id]) map[dept.id] = { dept, members: [] };
          map[dept.id].members.push(node);
        });
      }
    });
    return { groups: Object.values(map), ungrouped };
  }, [nodes]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Org Chart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {nodes.length} {nodes.length === 1 ? "person" : "people"} in this workspace
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/60 border border-border text-xs text-muted-foreground">
          <Network className="w-3.5 h-3.5 flex-shrink-0" />
          Interactive org chart coming in vB.2
        </div>
      </div>

      {isLoading && <Loader className="h-48" />}

      {!isLoading && nodes.length === 0 && (
        <EmptyState
          illustration="members"
          title="No people yet"
          description="Invite members and assign them to departments to see them here."
        />
      )}

      {!isLoading && nodes.length > 0 && (
        <div className="space-y-6">
          {/* Grouped by department */}
          {grouped.groups.map(({ dept, members }) => (
            <section key={dept.id}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: dept.color ?? "#6366f1" }}
                />
                {dept.name}
                <span className="font-normal text-muted-foreground/60">
                  ({members.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {members.map((node) => (
                  <PersonCard key={node.id} node={node} />
                ))}
              </div>
            </section>
          ))}

          {/* Ungrouped */}
          {grouped.ungrouped.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                No Department
                <span className="font-normal text-muted-foreground/60">
                  ({grouped.ungrouped.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {grouped.ungrouped.map((node) => (
                  <PersonCard key={node.id} node={node} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PersonCard({ node }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 flex flex-col items-center text-center gap-2 hover:border-primary/30 hover:shadow-card transition-all duration-150">
      <Avatar
        name={node.name || node.email}
        size="lg"
      />
      <div className="w-full min-w-0">
        <p className="text-sm font-medium truncate">{node.name || node.email}</p>
        {node.job_title && (
          <p className="text-xs text-muted-foreground truncate">{node.job_title}</p>
        )}
        {node.teams.length > 0 && (
          <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
            {node.teams.map((t) => t.name).join(", ")}
          </p>
        )}
      </div>
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize",
          node.role === "admin"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {node.role}
      </span>
    </div>
  );
}
