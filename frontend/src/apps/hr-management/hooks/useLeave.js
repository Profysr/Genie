import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

// ── Key factories ─────────────────────────────────────────────────────────────
const policiesKey  = (ws)        => ["hr-leave-policies",  ws];
const requestsKey  = (ws, s)     => ["hr-leave-requests",  ws, s ?? "all"];
const balancesKey  = (ws)        => ["hr-leave-balances",  ws];
const whosOffKey   = (ws)        => ["hr-whos-off",        ws];

// ── Leave Policies ────────────────────────────────────────────────────────────
export const useLeavePolicies = (workspaceId) =>
  useQuery({
    queryKey: policiesKey(workspaceId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/hr/leave-policies/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

export const useCreateLeavePolicy = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/workspaces/${workspaceId}/hr/leave-policies/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: policiesKey(workspaceId) }),
  });
};

export const useUpdateLeavePolicy = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, ...data }) =>
      api.patch(`/api/workspaces/${workspaceId}/hr/leave-policies/${policyId}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: policiesKey(workspaceId) }),
  });
};

export const useDeleteLeavePolicy = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyId) =>
      api.delete(`/api/workspaces/${workspaceId}/hr/leave-policies/${policyId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: policiesKey(workspaceId) }),
  });
};

// ── Leave Requests ────────────────────────────────────────────────────────────
export const useLeaveRequests = (workspaceId, statusFilter) =>
  useQuery({
    queryKey: requestsKey(workspaceId, statusFilter),
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      return api.get(`/api/workspaces/${workspaceId}/hr/leave-requests/${params}`).then((r) => r.data);
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

export const useCreateLeaveRequest = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/workspaces/${workspaceId}/hr/leave-requests/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKey(workspaceId) });
      qc.invalidateQueries({ queryKey: balancesKey(workspaceId) });
    },
  });
};

export const useReviewLeaveRequest = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, status, comment }) =>
      api
        .post(`/api/workspaces/${workspaceId}/hr/leave-requests/${requestId}/review/`, { status, comment })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestsKey(workspaceId) });
      qc.invalidateQueries({ queryKey: balancesKey(workspaceId) });
    },
  });
};

// ── Leave Balances ────────────────────────────────────────────────────────────
export const useLeaveBalances = (workspaceId) =>
  useQuery({
    queryKey: balancesKey(workspaceId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/hr/leave-balances/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });

// ── Who's Off ─────────────────────────────────────────────────────────────────
export const useWhosOff = (workspaceId) =>
  useQuery({
    queryKey: whosOffKey(workspaceId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/hr/whos-off/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
