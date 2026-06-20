import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

const BASE = (ws, proj, task) =>
  `/api/workspaces/${ws}/boards/${proj}/tasks/${task}/dependencies/`;

export function useDependencies(workspaceId, boardId, taskId) {
  return useQuery({
    queryKey: ["dependencies", workspaceId, boardId, taskId],
    queryFn: () =>
      api.get(BASE(workspaceId, boardId, taskId)).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useAddDependency(workspaceId, boardId, taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(BASE(workspaceId, boardId, taskId), payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dependencies", workspaceId, boardId, taskId],
      });
    },
  });
}

export function useRemoveDependency(workspaceId, boardId, taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (depId) =>
      api.delete(`${BASE(workspaceId, boardId, taskId)}${depId}/`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dependencies", workspaceId, boardId, taskId],
      });
    },
  });
}
