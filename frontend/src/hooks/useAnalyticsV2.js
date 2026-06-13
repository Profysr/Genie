import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const STALE = 60_000; // 1 min

function metric(workspaceSlug, name, params = {}) {
  return api
    .get(`/api/workspaces/${workspaceSlug}/analytics/${name}/`, { params })
    .then((r) => r.data);
}

export function useVelocity(workspaceSlug, { projectId, limit = 8 } = {}) {
  return useQuery({
    queryKey: ["analytics", "velocity", workspaceSlug, projectId, limit],
    queryFn: () => metric(workspaceSlug, "velocity", { project_id: projectId, limit }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useCycleTime(workspaceSlug, { projectId, days = 90 } = {}) {
  return useQuery({
    queryKey: ["analytics", "cycle-time", workspaceSlug, projectId, days],
    queryFn: () => metric(workspaceSlug, "cycle_time", { project_id: projectId, days }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useLeadTime(workspaceSlug, { projectId, days = 90 } = {}) {
  return useQuery({
    queryKey: ["analytics", "lead-time", workspaceSlug, projectId, days],
    queryFn: () => metric(workspaceSlug, "lead_time", { project_id: projectId, days }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useThroughput(workspaceSlug, { projectId, period = "week", days = 90 } = {}) {
  return useQuery({
    queryKey: ["analytics", "throughput", workspaceSlug, projectId, period, days],
    queryFn: () => metric(workspaceSlug, "throughput", { project_id: projectId, period, days }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useCFD(workspaceSlug, { projectId, days = 30 } = {}) {
  return useQuery({
    queryKey: ["analytics", "cfd", workspaceSlug, projectId, days],
    queryFn: () => metric(workspaceSlug, "cfd", { project_id: projectId, days }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useBurnup(workspaceSlug, { sprintId, projectId, days = 30 } = {}) {
  return useQuery({
    queryKey: ["analytics", "burnup", workspaceSlug, sprintId, projectId, days],
    queryFn: () =>
      metric(workspaceSlug, "burnup", { sprint_id: sprintId, project_id: projectId, days }),
    enabled: !!workspaceSlug && !!(sprintId || projectId),
    staleTime: STALE,
  });
}

export function useWorkloadHeatmap(workspaceSlug, { projectId, days = 14 } = {}) {
  return useQuery({
    queryKey: ["analytics", "workload-heatmap", workspaceSlug, projectId, days],
    queryFn: () => metric(workspaceSlug, "workload_heatmap", { project_id: projectId, days }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useTimeInStatus(workspaceSlug, { projectId, days = 30 } = {}) {
  return useQuery({
    queryKey: ["analytics", "time-in-status", workspaceSlug, projectId, days],
    queryFn: () => metric(workspaceSlug, "time_in_status", { project_id: projectId, days }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useOverdueAging(workspaceSlug, { projectId } = {}) {
  return useQuery({
    queryKey: ["analytics", "overdue-aging", workspaceSlug, projectId],
    queryFn: () => metric(workspaceSlug, "overdue_aging", { project_id: projectId }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useCompletionRate(workspaceSlug, { projectId, limit = 8 } = {}) {
  return useQuery({
    queryKey: ["analytics", "completion-rate", workspaceSlug, projectId, limit],
    queryFn: () => metric(workspaceSlug, "completion_rate", { project_id: projectId, limit }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}

export function useEstimationAccuracy(workspaceSlug, { projectId, limit = 8 } = {}) {
  return useQuery({
    queryKey: ["analytics", "estimation-accuracy", workspaceSlug, projectId, limit],
    queryFn: () =>
      metric(workspaceSlug, "estimation_accuracy", { project_id: projectId, limit }),
    enabled: !!workspaceSlug,
    staleTime: STALE,
  });
}
