import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const tasksKey = (workspaceId, boardId) => ["tasks", workspaceId, boardId];

export const useTasks = (workspaceId, boardId) =>
  useQuery({
    queryKey: tasksKey(workspaceId, boardId),
    queryFn: () => api.get(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/`).then((r) => r.data),
    enabled: !!workspaceId && !!boardId,
  });

export const useTask = (workspaceId, boardId, taskId) =>
  useQuery({
    queryKey: ["task", workspaceId, boardId, taskId],
    queryFn: () => api.get(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/`).then((r) => r.data),
    enabled: !!taskId,
  });

export const useCreateTask = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(workspaceId, boardId) }),
  });
};

export const useUpdateTask = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }) =>
      api.patch(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: tasksKey(workspaceId, boardId) });
      qc.invalidateQueries({ queryKey: ["children", workspaceId, boardId] });
    },
  });
};

export const useMoveTask = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status_id, order }) =>
      api.patch(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/move/`, { status_id, order }).then((r) => r.data),
    // Synchronous optimistic update — no await so @hello-pangea/dnd never sees the
    // original position again and the one-frame "snap back" flicker is eliminated.
    onMutate: ({ taskId, status_id, order }) => {
      qc.cancelQueries({ queryKey: tasksKey(workspaceId, boardId) });
      const prev = qc.getQueryData(tasksKey(workspaceId, boardId));
      qc.setQueryData(tasksKey(workspaceId, boardId), (old) =>
        old?.map((t) =>
          t.id === taskId
            ? { ...t, status_id, order, status_detail: { ...t.status_detail, id: status_id } }
            : t
        )
      );

      // Mirror the same optimistic patch into every open children cache so the
      // TaskDetailPanel status dot + label updates at the same instant as the card.
      qc.setQueriesData(
        { queryKey: ["children", workspaceId, boardId], exact: false },
        (old) =>
          Array.isArray(old)
            ? old.map((c) =>
                c.id === taskId
                  ? { ...c, status_detail: { ...c.status_detail, id: status_id } }
                  : c
              )
            : old
      );

      return { prev };
    },
    onError: (_err, _, ctx) => {
      qc.setQueryData(tasksKey(workspaceId, boardId), ctx.prev);
      qc.invalidateQueries({ queryKey: ["children", workspaceId, boardId] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children", workspaceId, boardId] });
    },
  });
};

export const useDeleteTask = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => api.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(workspaceId, boardId) }),
  });
};
