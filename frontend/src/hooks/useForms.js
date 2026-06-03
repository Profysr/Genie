import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const formBase = (ws, proj) => `/api/workspaces/${ws}/projects/${proj}/forms/`;

export function useForms(workspaceSlug, projectId) {
  return useQuery({
    queryKey: ["forms", workspaceSlug, projectId],
    queryFn: () => api.get(formBase(workspaceSlug, projectId)).then(r => r.data),
    enabled: !!projectId,
  });
}

export function useForm(workspaceSlug, projectId, formId) {
  return useQuery({
    queryKey: ["form", workspaceSlug, projectId, formId],
    queryFn: () => api.get(`${formBase(workspaceSlug, projectId)}${formId}/`).then(r => r.data),
    enabled: !!formId,
  });
}

export function useCreateForm(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(formBase(workspaceSlug, projectId), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", workspaceSlug, projectId] }),
  });
}

export function useUpdateForm(workspaceSlug, projectId, formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${formBase(workspaceSlug, projectId)}${formId}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form", workspaceSlug, projectId, formId] });
      qc.invalidateQueries({ queryKey: ["forms", workspaceSlug, projectId] });
    },
  });
}

export function useDeleteForm(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId) => api.delete(`${formBase(workspaceSlug, projectId)}${formId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", workspaceSlug, projectId] }),
  });
}

export function useUpdateFormFields(workspaceSlug, projectId, formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields) => api.put(`${formBase(workspaceSlug, projectId)}${formId}/fields/`, fields).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form", workspaceSlug, projectId, formId] }),
  });
}

export function useFormSubmissions(workspaceSlug, projectId, formId) {
  return useQuery({
    queryKey: ["form-submissions", workspaceSlug, projectId, formId],
    queryFn: () => api.get(`${formBase(workspaceSlug, projectId)}${formId}/submissions/`).then(r => r.data),
    enabled: !!formId,
  });
}

export function useUpdateSubmissionStatus(workspaceSlug, projectId, formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${formBase(workspaceSlug, projectId)}${formId}/submissions/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-submissions", workspaceSlug, projectId, formId] }),
  });
}
