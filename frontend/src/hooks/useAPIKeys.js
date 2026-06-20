import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useAPIKeys(workspaceId) {
  return useQuery({
    queryKey: ["api-keys", workspaceId],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/api-keys/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
  });
}

export function useCreateAPIKey(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/workspaces/${workspaceId}/api-keys/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] }),
  });
}

export function useRevokeAPIKey(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId) =>
      api.delete(`/api/workspaces/${workspaceId}/api-keys/${keyId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys", workspaceId] }),
  });
}
