import { useQuery } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { useInvalidatingMutation } from "@/shared/hooks/useInvalidatingMutation";

const key = (ws, proj) => ["saved-views", ws, proj];

export const useSavedViews = (workspaceId, boardId) =>
  useQuery({
    queryKey: key(workspaceId, boardId),
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/boards/${boardId}/saved-views/`)
        .then((r) => r.data),
    enabled: !!workspaceId && !!boardId,
    staleTime: Infinity, // only changes via create/delete — both already invalidate this key
  });

export const useCreateSavedView = (workspaceId, boardId) =>
  useInvalidatingMutation(
    (data) =>
      api
        .post(
          `/api/workspaces/${workspaceId}/boards/${boardId}/saved-views/`,
          data,
        )
        .then((r) => r.data),
    key(workspaceId, boardId),
  );

export const useDeleteSavedView = (workspaceId, boardId) =>
  useInvalidatingMutation(
    (viewId) =>
      api.delete(
        `/api/workspaces/${workspaceId}/boards/${boardId}/saved-views/${viewId}/`,
      ),
    key(workspaceId, boardId),
  );
