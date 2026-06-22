import { QueryClient } from "@tanstack/react-query";

// Singleton — importable everywhere so authStore can call .clear() on login/register
// without needing React context.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // dictates how long fetched data remains "fresh" before it is considered "stale" (old)
    },
  },
});

/**
 * Spread into any query whose cache is already kept live by a WebSocket event
 * (see useWorkspaceSocket / useBoardSocket). The socket patches the cache the
 * moment data changes, so React Query's default "refetch on every window focus"
 * is pure redundant traffic — the same lever we applied to the inbox-unread
 * count. We deliberately:
 *   • disable refetchOnWindowFocus — the socket is the live channel, not focus
 *   • KEEP refetchOnReconnect (RQ default true) as the resync safety net for any
 *     events missed while the socket was disconnected
 *   • NOT raise staleTime — these payloads are dynamic; a fresh mount should
 *     still background-refresh once (never use staleTime: Infinity on task data)
 *
 * Use this for socket-backed queries only. Queries without a matching WS event
 * (subtasks, attachments, dependencies, custom fields) keep focus-refetch as
 * their only cross-tab sync.
 */
export const SOCKET_BACKED = {
  refetchOnWindowFocus: false,
};

/**
 * Scenario A: Within the 30-second window (Data is "Fresh")
    A user visits their Dashboard component. React Query fetches the data from the server and caches it.
    The user clicks away to the Settings page, and then clicks back to the Dashboard 10 seconds later.
    Because 10 seconds is less than your 30-second staleTime, React Query pulls the data instantly from the cache and does not make a network request.

 * Scenario B: After the 30-second window (Data is "Stale")
    The user stays on the Settings page for 40 seconds, then clicks back to the Dashboard.
    Because 40 seconds have passed, the data in the cache is now marked as stale.
    The magic of React Query happens here: It will immediately show the user the cached (old) data so the screen doesn't look blank, but simultaneously fire off a background network request to grab the latest data. If the server data is different, it seamlessly updates the screen.
 */