import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

/** Fetch a single workspace by ID. Shared across pages/layout. */
export function useWorkspace(workspaceId) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/`).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

/** List all workspaces the current user belongs to. */
export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () =>
      api.get("/api/workspaces/").then((r) => r.data.results || r.data),
    staleTime: 60_000,
  });
}

export const useUpdateWorkspace = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.patch(`/api/workspaces/${workspaceId}/`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      qc.setQueryData(["workspace", workspaceId], updated);
    },
  });
};

export const useDeleteWorkspace = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/api/workspaces/${workspaceId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
};
