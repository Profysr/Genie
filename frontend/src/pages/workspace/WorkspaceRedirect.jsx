import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function WorkspaceRedirect() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/api/workspaces/").then((r) => r.data.results || r.data),
  });

  useEffect(() => {
    if (isError) {
      navigate("/login", { replace: true });
      return;
    }
    if (!data) return;
    if (data.length > 0) {
      navigate(`/w/${data[0].slug}`, { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  }, [data, isError, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    </div>
  );
}
