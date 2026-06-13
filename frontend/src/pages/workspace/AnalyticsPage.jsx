import { useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart2, Activity, Users, Layers } from "lucide-react";
import { Bar as ChartBar } from "react-chartjs-2";
import "@/components/charts/chartSetup";
import { chartColors } from "@/components/charts/chartTheme";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  useVelocity,
  useCycleTime,
  useLeadTime,
  useThroughput,
  useCFD,
  useBurnup,
  useWorkloadHeatmap,
  useTimeInStatus,
  useOverdueAging,
  useCompletionRate,
  useEstimationAccuracy,
} from "@/hooks/useAnalyticsV2";
import { useProjects } from "@/hooks/useProjects";
import { PRIORITIES } from "@/lib/constants";
import VelocityChart from "@/components/charts/VelocityChart";
import CFDChart from "@/components/charts/CFDChart";
import CycleTimeChart from "@/components/charts/CycleTimeChart";
import LeadTimeChart from "@/components/charts/LeadTimeChart";
import ThroughputChart from "@/components/charts/ThroughputChart";
import BurnupChart from "@/components/charts/BurnupChart";
import WorkloadHeatmap from "@/components/charts/WorkloadHeatmap";

// ── Shared primitives ─────────────────────────────────────────────────────────

const PRI_COLOR = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, { label: p.label, color: p.hex }]),
);

const PRIORITY_BADGE = {
  urgent:      "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  high:        "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  medium:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  low:         "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  no_priority: "bg-muted text-muted-foreground",
};


function StatCard({ label, value, color = "bg-primary/10 text-primary", icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-md p-4 shadow-card flex items-start gap-3">
      {Icon && (
        <div className={cn("w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0", color)}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function HBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 truncate flex-shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color || "hsl(var(--primary))" }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

function Card({ title, subtitle, children, className }) {
  return (
    <div className={cn("bg-card border border-border rounded-md p-5 shadow-card", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <p className="text-sm font-semibold">{title}</p>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Empty({ msg = "No data yet" }) {
  return <p className="text-xs text-muted-foreground py-8 text-center">{msg}</p>;
}

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
        {label}
      </p>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function CompletionSparkline({ data }) {
  if (!data || data.length < 2) return <Empty msg="Not enough data yet" />;
  const counts = data.map((d) => d.count);
  const max    = Math.max(...counts, 1);
  const W = 400, H = 80;
  const step   = W / (data.length - 1);
  const points = data
    .map((d, i) => `${i * step},${H - (d.count / max) * (H - 10)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={H - (d.count / max) * (H - 10)}
          r="3"
          fill="hsl(var(--primary))"
        />
      ))}
    </svg>
  );
}

// ── Existing sections ─────────────────────────────────────────────────────────

function KpiSection({ workspaceSlug }) {
  const { data } = useAnalytics(workspaceSlug);
  const ov = data?.overview || {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Projects"   value={ov.projects}   icon={Layers}   color="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300" />
      <StatCard label="Total Tasks" value={ov.tasks}     icon={BarChart2} color="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300" />
      <StatCard label="Members"    value={ov.members}    icon={Users}    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" />
      <StatCard label="Open Tasks" value={ov.open_tasks} icon={Activity} color="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300" />
    </div>
  );
}

function TaskBreakdownSection({ workspaceSlug }) {
  const { data } = useAnalytics(workspaceSlug);
  const maxS = Math.max(1, ...(data?.tasks_by_status   || []).map((s) => s.count));
  const maxP = Math.max(1, ...(data?.tasks_by_priority || []).map((p) => p.count));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Tasks by Status">
        {!(data?.tasks_by_status?.length) ? <Empty /> : (
          <div className="space-y-2.5">
            {data.tasks_by_status.map((s) => (
              <HBar key={s.status__name} label={s.status__name || "None"} value={s.count} max={maxS} color={s.status__color} />
            ))}
          </div>
        )}
      </Card>
      <Card title="Tasks by Priority">
        {!(data?.tasks_by_priority?.length) ? <Empty /> : (
          <div className="space-y-2.5">
            {data.tasks_by_priority.map((p) => {
              const cfg = PRI_COLOR[p.priority] || PRI_COLOR.no_priority;
              return <HBar key={p.priority} label={cfg?.label || p.priority} value={p.count} max={maxP} color={cfg?.color} />;
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function ActivitySection({ workspaceSlug }) {
  const { data } = useAnalytics(workspaceSlug);
  return (
    <Card title="Activity — Last 30 Days">
      <CompletionSparkline data={data?.completion_trend} />
    </Card>
  );
}

function WorkloadSection({ workspaceSlug }) {
  const { data } = useAnalytics(workspaceSlug);
  const active = (data?.workload || []).filter((w) => w.assigned > 0);
  const maxW   = Math.max(1, ...active.map((w) => w.assigned));
  return (
    <Card title="Workload by Member">
      {!active.length ? <Empty msg="No assigned tasks yet" /> : (
        <div className="space-y-2.5">
          {active.map((w) => (
            <HBar key={w.email} label={w.name || w.email} value={w.assigned} max={maxW} />
          ))}
        </div>
      )}
    </Card>
  );
}

function VelocitySection({ workspaceSlug, projectId, days }) {
  const { data: vData, isLoading: vLoad } = useVelocity(workspaceSlug, { projectId });
  const { data: tData, isLoading: tLoad } = useThroughput(workspaceSlug, { projectId, period: "week", days });
  const { data: bData, isLoading: bLoad } = useBurnup(workspaceSlug, { projectId, days });
  return (
    <div className="space-y-4">
      <VelocityChart data={vData} avgSP={vData?.avg_story_points} loading={vLoad} />
      <ThroughputChart data={tData} period="week" loading={tLoad} />
      {projectId && <BurnupChart data={bData} loading={bLoad} />}
    </div>
  );
}

function FlowSection({ workspaceSlug, projectId, days }) {
  const { data: cfdData, isLoading: cfdLoad } = useCFD(workspaceSlug, { projectId, days });
  const { data: ltData,  isLoading: ltLoad  } = useLeadTime(workspaceSlug, { projectId, days });
  const { data: ctData,  isLoading: ctLoad  } = useCycleTime(workspaceSlug, { projectId, days });
  return (
    <div className="space-y-4">
      <CFDChart data={cfdData} loading={cfdLoad} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadTimeChart  data={ltData} loading={ltLoad} />
        <CycleTimeChart data={ctData} loading={ctLoad} />
      </div>
    </div>
  );
}

function TeamSection({ workspaceSlug, projectId, days }) {
  const { data: hmData, isLoading: hmLoad } = useWorkloadHeatmap(workspaceSlug, { projectId, days });
  return <WorkloadHeatmap data={hmData} loading={hmLoad} />;
}

// ── New differentiating sections ──────────────────────────────────────────────

function TimeInStatusSection({ workspaceSlug, projectId, days }) {
  const { data = [] } = useTimeInStatus(workspaceSlug, { projectId, days });
  const max = Math.max(1, ...data.map((d) => d.avg_days));
  return (
    <Card
      title="Time Spent in Each Status"
      subtitle="Historical avg — where work slowed down before moving forward"
    >
      {!data.length ? <Empty /> : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.status} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 truncate flex-shrink-0 text-right">
                {d.status}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(d.avg_days / max) * 100}%`, backgroundColor: "hsl(var(--primary))" }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums w-14 text-right text-muted-foreground">
                {d.avg_days}d avg
              </span>
              <span className="text-[10px] text-muted-foreground/60 w-16 text-right">
                {d.sample_count} tasks
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function OverdueAgingSection({ workspaceSlug, projectId }) {
  const { data } = useOverdueAging(workspaceSlug, { projectId });
  const buckets  = data?.buckets || [];
  const tasks    = data?.tasks   || [];
  const total    = data?.total   ?? 0;
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card
        title={`Overdue Tasks — ${total} open`}
        subtitle="Tasks past their due date, still not done"
      >
        {!buckets.some((b) => b.count > 0) ? (
          <Empty msg="No overdue tasks — great work!" />
        ) : (
          <div className="space-y-2.5">
            {buckets.map((b) => (
              <HBar
                key={b.label}
                label={b.label}
                value={b.count}
                max={maxCount}
                color="#ef4444"
              />
            ))}
          </div>
        )}
      </Card>

      <Card title="Most Overdue" subtitle="Sorted by days past due date">
        {!tasks.length ? (
          <Empty msg="Nothing overdue" />
        ) : (
          <div className="divide-y divide-border">
            {tasks.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-start gap-2 py-2.5 text-xs">
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 mt-0.5",
                    PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.no_priority,
                  )}
                >
                  {PRI_COLOR[t.priority]?.label || t.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-muted-foreground mt-0.5 truncate">
                    {t.project} · {t.assignee}
                  </p>
                </div>
                <span className="text-destructive font-bold flex-shrink-0">
                  {t.days_overdue}d
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CompletionRateSection({ workspaceSlug, projectId }) {
  const { data = [] } = useCompletionRate(workspaceSlug, { projectId });
  if (!data.length) return null;

  const c = chartColors();
  const chartData = {
    labels: data.map((d) => d.sprint_name),
    datasets: [{
      data: data.map((d) => d.rate),
      backgroundColor: data.map((d) =>
        d.rate >= 80 ? "#22c55e" : d.rate >= 50 ? "#f59e0b" : "#ef4444"
      ),
      borderRadius: 4,
      maxBarThickness: 56,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.popover,
        borderColor: c.border,
        borderWidth: 1,
        titleColor: c.foreground,
        bodyColor: c.mutedForeground,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const d = data[ctx.dataIndex];
            return ` ${ctx.raw}% (${d.done}/${d.total} tasks)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: c.mutedForeground, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        max: 100,
        grid: { color: c.border },
        ticks: {
          color: c.mutedForeground,
          font: { size: 10 },
          callback: (v) => `${v}%`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <Card
      title="Sprint Completion Rate"
      subtitle="% of planned tasks actually finished each sprint"
    >
      <div style={{ height: 200, position: "relative" }}>
        <ChartBar data={chartData} options={options} />
      </div>
    </Card>
  );
}

function EstimationAccuracySection({ workspaceSlug, projectId }) {
  const { data = [] } = useEstimationAccuracy(workspaceSlug, { projectId });
  if (!data.length) return null;

  return (
    <Card
      title="Estimation Accuracy"
      subtitle="Story points estimated vs actual avg cycle time per sprint"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Sprint</th>
              <th className="text-right py-2 px-4 font-semibold text-muted-foreground">Story Points</th>
              <th className="text-right py-2 pl-4 font-semibold text-muted-foreground">Avg Cycle Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.sprint_name} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="py-2.5 pr-4 font-medium">{row.sprint_name}</td>
                <td className="py-2.5 px-4 text-right tabular-nums">
                  {row.estimated_sp > 0 ? `${row.estimated_sp} SP` : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="py-2.5 pl-4 text-right tabular-nums">
                  {row.avg_cycle_days != null
                    ? <span className={row.avg_cycle_days > 7 ? "text-destructive font-semibold" : ""}>{row.avg_cycle_days}d</span>
                    : <span className="text-muted-foreground">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Section registry ──────────────────────────────────────────────────────────
// To add a new section: write a Component above, then add one entry here.
// Each Component receives: workspaceSlug, projectId, days
const SECTIONS = [
  { id: "kpis",       Component: KpiSection },
  { id: "tasks",      label: "Task Breakdown",          Component: TaskBreakdownSection },
  { id: "activity",   Component: ActivitySection },
  { id: "workload",   Component: WorkloadSection },
  { id: "overdue",    label: "Risk & Health",            Component: OverdueAgingSection },
  { id: "time-in-status", Component: TimeInStatusSection },
  { id: "completion", label: "Sprint Performance",       Component: CompletionRateSection },
  { id: "estimation", Component: EstimationAccuracySection },
  { id: "velocity",   label: "Velocity & Throughput",    Component: VelocitySection },
  { id: "flow",       label: "Flow Metrics",             Component: FlowSection },
  { id: "team",       label: "Team Heatmap",             Component: TeamSection },
];

const DATE_OPTIONS = [
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { workspaceSlug } = useParams();
  const [projectId, setProjectId] = useState(undefined);
  const [days, setDays]           = useState(30);

  const { data: projects = [] } = useProjects(workspaceSlug);
  const sharedProps = { workspaceSlug, projectId, days };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Insights across your workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={projectId || ""}
              onChange={(e) => setProjectId(e.target.value || undefined)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={String(days)}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* All sections */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {SECTIONS.map(({ id, label, Component }) => (
          <div key={id} className="space-y-3">
            {label && <SectionDivider label={label} />}
            <Component {...sharedProps} />
          </div>
        ))}
      </div>
    </div>
  );
}
