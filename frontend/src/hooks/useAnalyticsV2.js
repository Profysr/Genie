import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const STALE = 60_000; // 1 min

function metric(workspaceId, name, params = {}) {
  return api
    .get(`/api/workspaces/${workspaceId}/analytics/${name}/`, { params })
    .then((r) => r.data);
}

export function useWorkspaceOverview(workspaceId, { boardId } = {}) {
  return useQuery({
    queryKey: ["analytics", "overview", workspaceId, boardId],
    queryFn: () => metric(workspaceId, "overview", { project_id: boardId }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useVelocity(workspaceId, { boardId, limit = 8 } = {}) {
  return useQuery({
    queryKey: ["analytics", "velocity", workspaceId, boardId, limit],
    queryFn: () => metric(workspaceId, "velocity", { project_id: boardId, limit }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useCycleTime(workspaceId, { boardId, days = 90 } = {}) {
  return useQuery({
    queryKey: ["analytics", "cycle-time", workspaceId, boardId, days],
    queryFn: () => metric(workspaceId, "cycle_time", { project_id: boardId, days }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useLeadTime(workspaceId, { boardId, days = 90 } = {}) {
  return useQuery({
    queryKey: ["analytics", "lead-time", workspaceId, boardId, days],
    queryFn: () => metric(workspaceId, "lead_time", { project_id: boardId, days }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useThroughput(workspaceId, { boardId, period = "week", days = 90 } = {}) {
  return useQuery({
    queryKey: ["analytics", "throughput", workspaceId, boardId, period, days],
    queryFn: () => metric(workspaceId, "throughput", { project_id: boardId, period, days }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useCFD(workspaceId, { boardId, days = 30 } = {}) {
  return useQuery({
    queryKey: ["analytics", "cfd", workspaceId, boardId, days],
    queryFn: () => metric(workspaceId, "cfd", { project_id: boardId, days }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useBurnup(workspaceId, { sprintId, boardId, days = 30 } = {}) {
  return useQuery({
    queryKey: ["analytics", "burnup", workspaceId, sprintId, boardId, days],
    queryFn: () =>
      metric(workspaceId, "burnup", { sprint_id: sprintId, project_id: boardId, days }),
    enabled: !!workspaceId && !!(sprintId || boardId),
    staleTime: STALE,
  });
}

export function useWorkloadHeatmap(workspaceId, { boardId, days = 14 } = {}) {
  return useQuery({
    queryKey: ["analytics", "workload-heatmap", workspaceId, boardId, days],
    queryFn: () => metric(workspaceId, "workload_heatmap", { project_id: boardId, days }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useTimeInStatus(workspaceId, { boardId, days = 30 } = {}) {
  return useQuery({
    queryKey: ["analytics", "time-in-status", workspaceId, boardId, days],
    queryFn: () => metric(workspaceId, "time_in_status", { project_id: boardId, days }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useOverdueAging(workspaceId, { boardId } = {}) {
  return useQuery({
    queryKey: ["analytics", "overdue-aging", workspaceId, boardId],
    queryFn: () => metric(workspaceId, "overdue_aging", { project_id: boardId }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useCompletionRate(workspaceId, { boardId, limit = 8 } = {}) {
  return useQuery({
    queryKey: ["analytics", "completion-rate", workspaceId, boardId, limit],
    queryFn: () => metric(workspaceId, "completion_rate", { project_id: boardId, limit }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}

export function useEstimationAccuracy(workspaceId, { boardId, limit = 8 } = {}) {
  return useQuery({
    queryKey: ["analytics", "estimation-accuracy", workspaceId, boardId, limit],
    queryFn: () =>
      metric(workspaceId, "estimation_accuracy", { project_id: boardId, limit }),
    enabled: !!workspaceId,
    staleTime: STALE,
  });
}
