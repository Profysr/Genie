import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const formBase = (ws, proj) => `/api/workspaces/${ws}/boards/${proj}/forms/`;

export function useForms(workspaceId, boardId) {
  return useQuery({
    queryKey: ["forms", workspaceId, boardId],
    queryFn: () => api.get(formBase(workspaceId, boardId)).then(r => r.data),
    enabled: !!boardId,
  });
}

export function useForm(workspaceId, boardId, formId) {
  return useQuery({
    queryKey: ["form", workspaceId, boardId, formId],
    queryFn: () => api.get(`${formBase(workspaceId, boardId)}${formId}/`).then(r => r.data),
    enabled: !!formId,
  });
}

export function useCreateForm(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(formBase(workspaceId, boardId), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", workspaceId, boardId] }),
  });
}

export function useUpdateForm(workspaceId, boardId, formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${formBase(workspaceId, boardId)}${formId}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form", workspaceId, boardId, formId] });
      qc.invalidateQueries({ queryKey: ["forms", workspaceId, boardId] });
    },
  });
}

export function useDeleteForm(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formId) => api.delete(`${formBase(workspaceId, boardId)}${formId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms", workspaceId, boardId] }),
  });
}

export function useUpdateFormFields(workspaceId, boardId, formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields) => api.put(`${formBase(workspaceId, boardId)}${formId}/fields/`, fields).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form", workspaceId, boardId, formId] }),
  });
}

export function useFormSubmissions(workspaceId, boardId, formId) {
  return useQuery({
    queryKey: ["form-submissions", workspaceId, boardId, formId],
    queryFn: () => api.get(`${formBase(workspaceId, boardId)}${formId}/submissions/`).then(r => r.data),
    enabled: !!formId,
  });
}

export function useUpdateSubmissionStatus(workspaceId, boardId, formId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${formBase(workspaceId, boardId)}${formId}/submissions/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-submissions", workspaceId, boardId, formId] }),
  });
}
