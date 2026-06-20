import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

// ── Status (all platforms) ────────────────────────────────────────────────────

export function useIntegrationStatus(workspaceId) {
  return useQuery({
    queryKey: ["integrations", workspaceId],
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/integrations/`)
        .then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
    retry: false,
  });
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export function useSaveTeams(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .put(`/api/workspaces/${workspaceId}/integrations/teams/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["integrations", workspaceId] }),
  });
}

export function useDisconnectTeams(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete(`/api/workspaces/${workspaceId}/integrations/teams/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["integrations", workspaceId] }),
  });
}

export function useTestTeams(workspaceId) {
  return useMutation({
    mutationFn: () =>
      api
        .post(`/api/workspaces/${workspaceId}/integrations/teams/test/`)
        .then((r) => r.data),
  });
}

// ── Google Chat ───────────────────────────────────────────────────────────────
export function useSaveGoogleChat(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .put(`/api/workspaces/${workspaceId}/integrations/google-chat/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["integrations", workspaceId] }),
  });
}

export function useDisconnectGoogleChat(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete(`/api/workspaces/${workspaceId}/integrations/google-chat/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["integrations", workspaceId] }),
  });
}

export function useTestGoogleChat(workspaceId) {
  return useMutation({
    mutationFn: () =>
      api
        .post(`/api/workspaces/${workspaceId}/integrations/google-chat/test/`)
        .then((r) => r.data),
  });
}

// ── Channel mappings ──────────────────────────────────────────────────────────
export function useChannelMappings(workspaceId, { platform } = {}) {
  return useQuery({
    queryKey: ["integrations", workspaceId, "mappings", platform],
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/integrations/mappings/`, {
          params: platform ? { platform } : {},
        })
        .then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
  });
}

export function useCreateChannelMapping(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .post(`/api/workspaces/${workspaceId}/integrations/mappings/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["integrations", workspaceId, "mappings"],
      }),
  });
}

export function useUpdateChannelMapping(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mappingId, ...data }) =>
      api
        .patch(
          `/api/workspaces/${workspaceId}/integrations/mappings/${mappingId}/`,
          data,
        )
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["integrations", workspaceId, "mappings"],
      }),
  });
}

export function useDeleteChannelMapping(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mappingId) =>
      api.delete(
        `/api/workspaces/${workspaceId}/integrations/mappings/${mappingId}/`,
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["integrations", workspaceId, "mappings"],
      }),
  });
}
