import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWorkspaceSocket(workspaceSlug) {
  const qc = useQueryClient();
  const wsRef = useRef(null);

  useEffect(() => {
    if (!workspaceSlug) return;

    const token = localStorage.getItem("access_token");
    const ws = new WebSocket(
      `ws://localhost:8000/ws/workspaces/${workspaceSlug}/?token=${token}`
    );
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const { type, payload } = JSON.parse(e.data);

      if (type === "task.created" || type === "task.updated" || type === "task.moved") {
        qc.setQueryData(["tasks", workspaceSlug, payload.project_id], (old) => {
          if (!old) return old;
          const exists = old.find((t) => t.id === payload.id);
          return exists ? old.map((t) => (t.id === payload.id ? payload : t)) : [...old, payload];
        });
      }

      if (type === "task.deleted") {
        qc.setQueryData(["tasks", workspaceSlug, payload.project_id], (old) =>
          old?.filter((t) => t.id !== payload.id)
        );
      }
    };

    ws.onerror = () => console.warn("WebSocket error — realtime updates unavailable");

    return () => ws.close();
  }, [workspaceSlug, qc]);

  return wsRef;
}
