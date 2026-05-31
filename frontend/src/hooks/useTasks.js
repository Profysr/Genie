import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const tasksKey = (workspaceSlug, projectId) => ["tasks", workspaceSlug, projectId];

export const useTasks = (workspaceSlug, projectId) =>
  useQuery({
    queryKey: tasksKey(workspaceSlug, projectId),
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/`).then((r) => r.data),
    enabled: !!workspaceSlug && !!projectId,
  });

export const useTask = (workspaceSlug, projectId, taskId) =>
  useQuery({
    queryKey: ["task", workspaceSlug, projectId, taskId],
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/${taskId}/`).then((r) => r.data),
    enabled: !!taskId,
  });

export const useCreateTask = (workspaceSlug, projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(workspaceSlug, projectId) }),
  });
};

export const useUpdateTask = (workspaceSlug, projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...data }) =>
      api.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/${taskId}/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(workspaceSlug, projectId) }),
  });
};

export const useMoveTask = (workspaceSlug, projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status_id, order }) =>
      api.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/${taskId}/move/`, { status_id, order }).then((r) => r.data),
    // Optimistic update — update cache immediately, reconcile on settle
    onMutate: async ({ taskId, status_id, order }) => {
      await qc.cancelQueries({ queryKey: tasksKey(workspaceSlug, projectId) });
      const prev = qc.getQueryData(tasksKey(workspaceSlug, projectId));
      qc.setQueryData(tasksKey(workspaceSlug, projectId), (old) =>
        old?.map((t) =>
          t.id === taskId
            ? { ...t, status_id, order, status_detail: { ...t.status_detail, id: status_id } }
            : t
        )
      );
      return { prev };
    },
    onError: (_, __, ctx) => qc.setQueryData(tasksKey(workspaceSlug, projectId), ctx.prev),
    // No onSettled invalidation — WebSocket broadcast updates the cache with real server data
  });
};

export const useDeleteTask = (workspaceSlug, projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => api.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/${taskId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: tasksKey(workspaceSlug, projectId) }),
  });
};
