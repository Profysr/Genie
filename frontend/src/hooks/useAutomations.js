import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const base = (ws, proj) => `/api/workspaces/${ws}/boards/${proj}/automations/`;

export function useAutomations(workspaceId, boardId) {
  return useQuery({
    queryKey: ["automations", workspaceId, boardId],
    queryFn: () => api.get(base(workspaceId, boardId)).then(r => r.data),
    enabled: !!boardId,
  });
}

export function useCreateAutomation(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(base(workspaceId, boardId), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", workspaceId, boardId] }),
  });
}

export function useUpdateAutomation(workspaceId, boardId, ruleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${base(workspaceId, boardId)}${ruleId}/`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", workspaceId, boardId] }),
  });
}

export function useDeleteAutomation(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId) => api.delete(`${base(workspaceId, boardId)}${ruleId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", workspaceId, boardId] }),
  });
}
