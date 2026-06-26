import { cn } from "@/shared/lib/utils";
import {
  useVelocity,
  useCycleTime,
  useLeadTime,
  useThroughput,
  useCFD,
  useBurnup,
  useWorkloadHeatmap,
} from "@/shared/hooks/useAnalyticsV2";
import VelocityChart       from "@/shared/components/charts/VelocityChart";
import ThroughputChart     from "@/shared/components/charts/ThroughputChart";
import BurnupChart         from "@/shared/components/charts/BurnupChart";
import CFDChart            from "@/shared/components/charts/CFDChart";
import CycleTimeChart      from "@/shared/components/charts/CycleTimeChart";
import LeadTimeChart       from "@/shared/components/charts/LeadTimeChart";
import WorkloadHeatmap     from "@/shared/components/charts/WorkloadHeatmap";
import CompletionRateChart from "@/shared/components/charts/CompletionRateChart";
import TaskHealthSection   from "./TaskHealthSection";

// ── Tab definitions ───────────────────────────────────────────────────────────

export const TABS = [
  { id: "overview",  label: "Task Health" },
  { id: "team",      label: "Team Workload" },
  { id: "velocity",  label: "Velocity & Throughput" },
  { id: "flow",      label: "Flow & Cycle Time" },
];

// ── Tab content panels ────────────────────────────────────────────────────────

function OverviewPanel({ workspaceId, boardId }) {
  return (
    <div className="space-y-4">
      <TaskHealthSection workspaceId={workspaceId} boardId={boardId} />
      <CompletionRateChart workspaceId={workspaceId} boardId={boardId} />
    </div>
  );
}

function TeamPanel({ workspaceId, boardId }) {
  const { data, isLoading } = useWorkloadHeatmap(workspaceId, { boardId, days: 14 });
  return <WorkloadHeatmap data={data} loading={isLoading} />;
}

function VelocityPanel({ workspaceId, boardId, days }) {
  const { data: vData, isLoading: vLoad } = useVelocity(workspaceId, { boardId });
  const { data: tData, isLoading: tLoad } = useThroughput(workspaceId, { boardId, period: "week", days });
  const { data: bData, isLoading: bLoad } = useBurnup(workspaceId, { boardId, days });
  return (
    <div className="space-y-4">
      <VelocityChart data={vData} avgSP={vData?.avg_story_points} loading={vLoad} />
      <ThroughputChart data={tData} period="week" loading={tLoad} />
      {boardId && <BurnupChart data={bData} loading={bLoad} />}
    </div>
  );
}

function FlowPanel({ workspaceId, boardId, days }) {
  const { data: cfdData, isLoading: cfdLoad } = useCFD(workspaceId, { boardId, days });
  const { data: ltData,  isLoading: ltLoad  } = useLeadTime(workspaceId, { boardId, days });
  const { data: ctData,  isLoading: ctLoad  } = useCycleTime(workspaceId, { boardId, days });
  return (
    <div className="space-y-4">
      <CFDChart data={cfdData} loading={cfdLoad} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CycleTimeChart data={ctData} loading={ctLoad} />
        <LeadTimeChart  data={ltData} loading={ltLoad} />
      </div>
    </div>
  );
}

// ── Tab bar + panel switcher ──────────────────────────────────────────────────

export default function TabPanel({ workspaceId, boardId, days }) {
  return null; // rendered externally — see AnalyticsPage
}

export function TabBar({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
            activeTab === tab.id
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ActiveTabPanel({ activeTab, workspaceId, boardId, days }) {
  const props = { workspaceId, boardId, days };
  if (activeTab === "overview")  return <OverviewPanel  {...props} />;
  if (activeTab === "team")      return <TeamPanel      {...props} />;
  if (activeTab === "velocity")  return <VelocityPanel  {...props} />;
  if (activeTab === "flow")      return <FlowPanel      {...props} />;
  return null;
}
