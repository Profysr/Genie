import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

const BASE = (ws, boardId, task) =>
  `/api/workspaces/${ws}/boards/${boardId}/tasks/${task}/attachments/`;

export function useAttachments(workspaceId, boardId, taskId) {
  return useQuery({
    queryKey: ["attachments", workspaceId, boardId, taskId],
    queryFn: () =>
      api.get(BASE(workspaceId, boardId, taskId)).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(workspaceId, boardId, taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("file", file);
      return api
        .post(BASE(workspaceId, boardId, taskId), form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["attachments", workspaceId, boardId, taskId],
      });
    },
  });
}

export function useDeleteAttachment(workspaceId, boardId, taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId) =>
      api.delete(`${BASE(workspaceId, boardId, taskId)}${attachmentId}/`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["attachments", workspaceId, boardId, taskId],
      });
    },
  });
}
