import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

export function useToggleReaction(workspaceId, boardId, taskId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, emoji }) =>
      api
        .post(
          `/api/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/comments/${commentId}/reactions/`,
          { emoji },
        )
        .then((r) => r.data),

    onSuccess: (data, { commentId }) => {
      qc.setQueryData(["comments", workspaceId, boardId, taskId], (old) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          results: page.results.map((c) => {
            if (c.id === commentId) return { ...c, reactions: data.reactions };
            // also patch reactions on replies
            if (c.replies?.some((r) => r.id === commentId)) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, reactions: data.reactions } : r,
                ),
              };
            }
            return c;
          }),
        }));
        return { ...old, pages };
      });
    },
  });
}
