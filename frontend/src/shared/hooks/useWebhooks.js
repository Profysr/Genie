import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useWebhooks(workspaceId) {
  return useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/webhooks/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
  });
}

export function useCreateWebhook(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .post(`/api/workspaces/${workspaceId}/webhooks/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["webhooks", workspaceId] }),
  });
}

export function useUpdateWebhook(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hookId, ...data }) =>
      api
        .patch(`/api/workspaces/${workspaceId}/webhooks/${hookId}/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["webhooks", workspaceId] }),
  });
}

export function useDeleteWebhook(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hookId) =>
      api.delete(`/api/workspaces/${workspaceId}/webhooks/${hookId}/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["webhooks", workspaceId] }),
  });
}

export function useTestWebhook(workspaceId) {
  return useMutation({
    mutationFn: (hookId) =>
      api
        .post(`/api/workspaces/${workspaceId}/webhooks/${hookId}/test/`)
        .then((r) => r.data),
  });
}

export function useWebhookDeliveries(workspaceId, hookId) {
  return useQuery({
    queryKey: ["webhooks", workspaceId, hookId, "deliveries"],
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/webhooks/${hookId}/deliveries/`)
        .then((r) => r.data),
    enabled: !!(workspaceId && hookId),
    staleTime: Infinity,
  });
}
