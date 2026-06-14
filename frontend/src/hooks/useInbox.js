import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const inboxKey = (workspaceId, tab, eventType, limit) =>
  ["inbox", workspaceId, tab, eventType, limit].filter(Boolean);

export function useInbox(
  workspaceId,
  { tab = "for_you", eventType, limit = 20, enabled = true } = {},
) {
  return useQuery({
    queryKey: inboxKey(workspaceId, tab, eventType, limit),
    queryFn: () =>
      api
        .get("/api/inbox/", {
          params: {
            workspace: workspaceId,
            tab,
            limit,
            ...(eventType ? { event_type: eventType } : {}),
          },
        })
        .then((r) => r.data),
    enabled: enabled && !!workspaceId,
    staleTime: 30_000,
  });
}

/**
 * Total unread count for the bell/nav badges.
 * Uses a dedicated lightweight endpoint so the full inbox list is NOT fetched
 * on load — that list loads lazily only when the notification panel opens.
 */
export function useInboxUnreadCount(workspaceId) {
  const { data } = useQuery({
    queryKey: ["inbox-unread-count", workspaceId],
    queryFn: () =>
      api
        .get("/api/inbox/unread-count/", {
          params: { workspace: workspaceId },
        })
        .then((r) => r.data.count),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
  return data ?? 0;
}

export function useUpdateInboxItem(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/api/inbox/${id}/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox", workspaceId] });
      qc.invalidateQueries({ queryKey: ["inbox-unread-count", workspaceId] });
    },
  });
}

export function useBulkUpdateInbox(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post("/api/inbox/bulk/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inbox", workspaceId] });
      qc.invalidateQueries({ queryKey: ["inbox-unread-count", workspaceId] });
    },
  });
}

/** Snooze presets → ISO strings relative to now. */
export function snoozeUntil(preset) {
  const d = new Date();
  if (preset === "1h") {
    d.setHours(d.getHours() + 1);
  }
  if (preset === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  }
  if (preset === "next_week") {
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}
