import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const HEARTBEAT_MS = 90_000;

export function presenceKey(workspaceId, resourceType, resourceId) {
  return ["presence", workspaceId, resourceType, resourceId];
}

/** Fetch who is viewing a specific resource right now. */
export function usePresence(workspaceId, resourceType, resourceId) {
  return useQuery({
    queryKey: presenceKey(workspaceId, resourceType, resourceId),
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/presence/`, {
          params: { resource_type: resourceType, resource_id: resourceId },
        })
        .then((r) => r.data),
    enabled: !!workspaceId && !!resourceType && !!resourceId,
    refetchInterval: HEARTBEAT_MS,
    staleTime: Infinity,
  });
}

/** Fetch all users online in a workspace (any resource, active in last 90s). */
export function useWorkspaceOnlineUsers(workspaceId) {
  return useQuery({
    queryKey: ["presence", workspaceId, "all"],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/presence/`).then((r) => r.data),
    enabled: !!workspaceId,
    refetchInterval: HEARTBEAT_MS,
    staleTime: Infinity,
  });
}

/**
 * Announce the current user's presence for a resource.
 * Sends heartbeat every 90s; sends leave on unmount.
 */
export function useAnnouncePresence(workspaceId, resourceType, resourceId) {
  const timerRef = useRef(null);
  const qc = useQueryClient();

  // Create an entry onto backend saying that I'm Online
  const announce = useCallback(() => {
    if (!workspaceId || !resourceType || !resourceId) return;
    api
      .post(`/api/workspaces/${workspaceId}/presence/`, {
        resource_type: resourceType,
        resource_id: resourceId,
      })
      .then(() => {
        qc.invalidateQueries({
          queryKey: presenceKey(workspaceId, resourceType, resourceId),
        });
      })
      .catch(() => {});
  }, [workspaceId, resourceType, resourceId, qc]);

  // Delete the presence record from the backend so the system will identify, ok the user has left
  const leave = useCallback(() => {
    if (!workspaceId || !resourceType || !resourceId) return;
    api
      .delete(`/api/workspaces/${workspaceId}/presence/`, {
        data: { resource_type: resourceType, resource_id: resourceId },
      })
      .catch(() => {});
    qc.invalidateQueries({
      queryKey: presenceKey(workspaceId, resourceType, resourceId),
    });
  }, [workspaceId, resourceType, resourceId, qc]);

  // Main effect that keeps updating user presence
  useEffect(() => {
    announce();
    timerRef.current = setInterval(announce, HEARTBEAT_MS);

    return () => {
      clearInterval(timerRef.current);
      leave();
    };
  }, [announce, leave, workspaceId, resourceType, resourceId, qc]);
}
