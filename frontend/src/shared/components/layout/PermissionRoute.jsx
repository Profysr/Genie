import { Outlet, Navigate } from "react-router-dom";
import { usePermission } from "@/contexts/PermissionsContext";
import { Loader } from "@/shared/components/ui/Loader";
import { APP_DEFS } from "@/shared/lib/navLinks";

// Apps gated by hasAppAccess() — all APP_DEFS entries except "workspace",
// which uses granular permissions instead of app-level access.
const APP_ACCESS_GATED = new Set(
  APP_DEFS.filter((a) => a.key !== "workspace").map((a) => a.key)
);

/**
 * Layout route that enforces access control for a route group.
 *
 * Usage in App.jsx:
 *   <Route element={<AppGuard app="hr" />}>          // app-level access
 *   <Route element={<AppGuard permission="settings.manage" />}>  // permission
 *   <Route element={<AppGuard app="projects" permission="some.perm" />}>  // both
 *
 * Redirects to /not-found if the user lacks access.
 * Routes rendered without this wrapper are always accessible.
 */
export default function AppGuard({ app, permission }) {
  const { can, hasAppAccess, isLoading } = usePermission();

  if (isLoading) {
    return <Loader size="xl" className="min-h-screen bg-background" />;
  }

  const denied =
    (app && APP_ACCESS_GATED.has(app) && !hasAppAccess(app)) ||
    (permission && !can(permission));

  if (denied) {
    return <Navigate to="/not-found" replace />;
  }

  return <Outlet />;
}
