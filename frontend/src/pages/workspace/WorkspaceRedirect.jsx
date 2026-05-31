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
    if (!data) return;
    if (data.length > 0) {
      navigate(`/w/${data[0].slug}`, { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  }, [data, navigate]);

  if (isError) navigate("/login", { replace: true });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading...</div>
    </div>
  );
}
