import { useBoard } from "./useProjects";

/**
 * Derives the current user's effective role from the board's `my_role` field.
 * No extra request — piggybacks on the board detail already in the cache.
 */
export function useBoardPermissions(workspaceId, boardId) {
  const { data: project, isLoading } = useBoard(workspaceId, boardId);

  const role = project?.my_role ?? null;

  return {
    role,
    isLoading,
    isLoaded:   !isLoading && !!project,
    canView:    role !== null,
    canEdit:    role === "admin" || role === "editor",
    canDelete:  role === "admin" || role === "editor",
    canAdmin:   role === "admin",
    isGuest:    role === "guest",
    isViewer:   role === "viewer",
  };
}
