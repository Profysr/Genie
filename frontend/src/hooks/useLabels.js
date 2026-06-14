import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const labelsKey = (workspaceId, boardId) => ["labels", workspaceId, boardId];

export const useLabels = (workspaceId, boardId) =>
  useQuery({
    queryKey: labelsKey(workspaceId, boardId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/boards/${boardId}/labels/`).then((r) => r.data),
    enabled: !!workspaceId && !!boardId,
  });

export const useCreateLabel = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/workspaces/${workspaceId}/boards/${boardId}/labels/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(workspaceId, boardId) }),
  });
};

export const useDeleteLabel = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId) =>
      api.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/labels/${labelId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(workspaceId, boardId) }),
  });
};
