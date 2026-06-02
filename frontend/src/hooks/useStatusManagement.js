import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const BASE = (ws, proj) =>
  `/api/workspaces/${ws}/projects/${proj}/statuses/`;

export function useCreateStatus(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BASE(workspaceSlug, projectId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", workspaceSlug, projectId] }),
  });
}

export function useUpdateStatus(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ statusId, ...data }) =>
      api.patch(`${BASE(workspaceSlug, projectId)}${statusId}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", workspaceSlug, projectId] }),
  });
}

export function useDeleteStatus(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statusId) =>
      api.delete(`${BASE(workspaceSlug, projectId)}${statusId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", workspaceSlug, projectId] }),
  });
}
