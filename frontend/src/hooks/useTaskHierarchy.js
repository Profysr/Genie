import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const taskBase = (ws, proj, task) =>
  `/api/workspaces/${ws}/projects/${proj}/tasks/${task}`;

// ── Child tasks ───────────────────────────────────────────────────────────────

export function useChildTasks(workspaceSlug, projectId, taskId) {
  return useQuery({
    queryKey: ["children", workspaceSlug, projectId, taskId],
    queryFn: () => api.get(`${taskBase(workspaceSlug, projectId, taskId)}/children/`).then(r => r.data),
    enabled: !!taskId,
  });
}

export function useCreateChildTask(workspaceSlug, projectId, taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`${taskBase(workspaceSlug, projectId, taskId)}/children/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children", workspaceSlug, projectId, taskId] });
      // Refresh both the parent task detail (updates child_count) and the board card list
      qc.invalidateQueries({ queryKey: ["task-detail", workspaceSlug, projectId, taskId] });
      qc.invalidateQueries({ queryKey: ["tasks", workspaceSlug, projectId] });
    },
  });
}

export function useAttachChildTask(workspaceSlug, projectId, parentTaskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childTaskId) =>
      api.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/tasks/${childTaskId}/`, { parent_id: parentTaskId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children", workspaceSlug, projectId, parentTaskId] });
      qc.invalidateQueries({ queryKey: ["task-detail", workspaceSlug, projectId, parentTaskId] });
      qc.invalidateQueries({ queryKey: ["tasks", workspaceSlug, projectId] });
    },
  });
}

// ── Clone ─────────────────────────────────────────────────────────────────────

export function useCloneTask(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId) =>
      api.post(`${taskBase(workspaceSlug, projectId, taskId)}/clone/`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", workspaceSlug, projectId] });
    },
  });
}

// ── Templates ─────────────────────────────────────────────────────────────────

const templateBase = (ws, proj) =>
  `/api/workspaces/${ws}/projects/${proj}/task-templates/`;

export function useTaskTemplates(workspaceSlug, projectId) {
  return useQuery({
    queryKey: ["task-templates", workspaceSlug, projectId],
    queryFn: () => api.get(templateBase(workspaceSlug, projectId)).then(r => r.data),
    enabled: !!projectId,
  });
}

export function useCreateTaskTemplate(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(templateBase(workspaceSlug, projectId), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-templates", workspaceSlug, projectId] }),
  });
}

export function useDeleteTaskTemplate(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId) => api.delete(`${templateBase(workspaceSlug, projectId)}${templateId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-templates", workspaceSlug, projectId] }),
  });
}

export function useApplyTemplate(workspaceSlug, projectId, taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId) =>
      api.post(`${taskBase(workspaceSlug, projectId, taskId)}/apply-template/`, { template_id: templateId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task", workspaceSlug, projectId, taskId] });
    },
  });
}
