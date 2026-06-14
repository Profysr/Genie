import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useBulkUpdateTasks(workspaceId, boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api
        .post(`/api/workspaces/${workspaceId}/boards/${boardId}/tasks/bulk/`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", workspaceId, boardId] });
    },
  });
}
