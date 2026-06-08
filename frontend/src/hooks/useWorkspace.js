import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

/** Fetch a single workspace by slug. Shared across pages/layout. */
export function useWorkspace(workspaceSlug) {
  return useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceSlug}/`).then((r) => r.data),
    enabled: !!workspaceSlug,
  });
}

/** List all workspaces the current user belongs to. */
export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () =>
      api.get("/api/workspaces/").then((r) => r.data.results || r.data),
    staleTime: 60_000,
  });
}
