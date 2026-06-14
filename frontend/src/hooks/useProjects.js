import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useBoards = (workspaceId) =>
  useQuery({
    queryKey: ["boards", workspaceId],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/boards/`).then((r) => r.data),
    enabled: !!workspaceId,
  });

// Keep legacy alias so any remaining consumers don't break
export const useProjects = useBoards;

export const useBoard = (workspaceId, boardId) =>
  useQuery({
    queryKey: ["board", workspaceId, boardId],
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/boards/${boardId}/`)
        .then((r) => r.data),
    enabled: !!workspaceId && !!boardId,
  });

// Keep legacy alias
export const useProject = useBoard;

export const useCreateBoard = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .post(`/api/workspaces/${workspaceId}/boards/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] }),
  });
};

// Keep legacy alias
export const useCreateProject = useCreateBoard;

export const useUpdateBoard = (workspaceId, boardId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .patch(`/api/workspaces/${workspaceId}/boards/${boardId}/`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] });
      qc.invalidateQueries({ queryKey: ["board", workspaceId, boardId] });
    },
  });
};

// Keep legacy alias
export const useUpdateProject = useUpdateBoard;

export const useDeleteBoard = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId) =>
      api.delete(`/api/workspaces/${workspaceId}/boards/${boardId}/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["boards", workspaceId] }),
  });
};

// Keep legacy alias
export const useDeleteProject = useDeleteBoard;
