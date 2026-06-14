import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useToggleReaction(workspaceId, boardId, taskId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, emoji }) =>
      api
        .post(
          `/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/comments/${commentId}/reactions/`,
          { emoji }
        )
        .then((r) => r.data),

    onSuccess: (data, { commentId }) => {
      qc.setQueryData(
        ["task-detail", workspaceId, boardId, taskId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            comments: old.comments?.map((c) =>
              c.id === commentId ? { ...c, reactions: data.reactions } : c
            ) || [],
          };
        }
      );
    },
  });
}
