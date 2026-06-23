import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { useInvalidatingMutation } from "@/shared/hooks/useInvalidatingMutation";

const webhooksKey = (workspaceId) => ["webhooks", workspaceId];

export function useWebhooks(workspaceId) {
  return useQuery({
    queryKey: webhooksKey(workspaceId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/webhooks/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
  });
}

export function useCreateWebhook(workspaceId) {
  return useInvalidatingMutation(
    (data) =>
      api
        .post(`/api/workspaces/${workspaceId}/webhooks/`, data)
        .then((r) => r.data),
    webhooksKey(workspaceId),
  );
}

export function useUpdateWebhook(workspaceId) {
  return useInvalidatingMutation(
    ({ hookId, ...data }) =>
      api
        .patch(`/api/workspaces/${workspaceId}/webhooks/${hookId}/`, data)
        .then((r) => r.data),
    webhooksKey(workspaceId),
  );
}

export function useDeleteWebhook(workspaceId) {
  return useInvalidatingMutation(
    (hookId) => api.delete(`/api/workspaces/${workspaceId}/webhooks/${hookId}/`),
    webhooksKey(workspaceId),
  );
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
