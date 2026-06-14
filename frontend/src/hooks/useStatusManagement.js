import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const BASE = (ws, proj) =>
  `/api/workspaces/${ws}/boards/${proj}/statuses/`;

export function useCreateStatus(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BASE(workspaceId, boardId), data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", workspaceId, boardId] }),
  });
}

export function useUpdateStatus(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ statusId, ...data }) =>
      api.patch(`${BASE(workspaceId, boardId)}${statusId}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", workspaceId, boardId] }),
  });
}

export function useDeleteStatus(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statusId) =>
      api.delete(`${BASE(workspaceId, boardId)}${statusId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", workspaceId, boardId] }),
  });
}
