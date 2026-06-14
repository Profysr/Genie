import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const detailKey = (ws, proj, taskId) => ["task-detail", ws, proj, taskId];

export const useTaskDetail = (workspaceId, boardId, taskId) =>
  useQuery({
    queryKey: detailKey(workspaceId, boardId, taskId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/`).then((r) => r.data),
    enabled: !!taskId,
  });

export const useUpdateTaskDetail = (workspaceId, boardId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.patch(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(detailKey(workspaceId, boardId, taskId), (old) => ({ ...old, ...updated }));
      qc.invalidateQueries({ queryKey: ["tasks", workspaceId, boardId] });
    },
  });
};

export const useCreateComment = (workspaceId, boardId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      api.post(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/comments/`, { body }).then((r) => r.data),
    onSuccess: (comment) => {
      qc.setQueryData(detailKey(workspaceId, boardId, taskId), (old) =>
        old ? { ...old, comments: [...(old.comments || []), comment], comment_count: (old.comment_count || 0) + 1 } : old
      );
    },
  });
};

export const useDeleteComment = (workspaceId, boardId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId) =>
      api.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/comments/${commentId}/`),
    onSuccess: (_, commentId) => {
      qc.setQueryData(detailKey(workspaceId, boardId, taskId), (old) =>
        old ? { ...old, comments: old.comments.filter((c) => c.id !== commentId), comment_count: Math.max(0, (old.comment_count || 1) - 1) } : old
      );
    },
  });
};

export const useCreateSubtask = (workspaceId, boardId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title) =>
      api.post(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/subtasks/`, { title }).then((r) => r.data),
    onSuccess: (subtask) => {
      qc.setQueryData(detailKey(workspaceId, boardId, taskId), (old) =>
        old ? { ...old, subtasks: [...(old.subtasks || []), subtask], subtask_count: (old.subtask_count || 0) + 1 } : old
      );
      qc.invalidateQueries({ queryKey: ["tasks", workspaceId, boardId] });
    },
  });
};

export const useToggleSubtask = (workspaceId, boardId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subtaskId, is_done }) =>
      api.patch(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}/`, { is_done }).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(detailKey(workspaceId, boardId, taskId), (old) => {
        if (!old) return old;
        const subtasks = old.subtasks.map((s) => (s.id === updated.id ? updated : s));
        const done_subtask_count = subtasks.filter((s) => s.is_done).length;
        return { ...old, subtasks, done_subtask_count };
      });
      qc.invalidateQueries({ queryKey: ["tasks", workspaceId, boardId] });
    },
  });
};

export const useDeleteSubtask = (workspaceId, boardId, taskId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId) =>
      api.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/subtasks/${subtaskId}/`),
    onSuccess: (_, subtaskId) => {
      qc.setQueryData(detailKey(workspaceId, boardId, taskId), (old) =>
        old ? { ...old, subtasks: old.subtasks.filter((s) => s.id !== subtaskId), subtask_count: Math.max(0, (old.subtask_count || 1) - 1) } : old
      );
      qc.invalidateQueries({ queryKey: ["tasks", workspaceId, boardId] });
    },
  });
};
