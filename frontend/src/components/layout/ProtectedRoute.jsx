import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute() {
  const { user, accessToken, fetchMe } = useAuthStore();
  const location = useLocation();

  // No token at all → send to login
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token exists but user not hydrated yet → fetch it
  if (!user) {
    return <FetchUser fetchMe={fetchMe} />;
  }

  return <Outlet />;
}

function FetchUser({ fetchMe }) {
  useEffect(() => {
    fetchMe().catch(() => {});
  }, [fetchMe]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
