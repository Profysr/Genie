import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import OnboardingPage from "@/pages/onboarding/OnboardingPage";
import WorkspaceRedirect from "@/pages/workspace/WorkspaceRedirect";
import DashboardPage from "@/pages/dashboard/DashboardPage";

export default function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 2. All Protected Routes (Grouped Together) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<WorkspaceRedirect />} />

        {/* Workspace Shell Nested Layout */}
        <Route path="/w/:workspaceSlug" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="projects"
            element={
              <div className="p-8 text-muted-foreground">
                Projects — coming in Week 2
              </div>
            }
          />
          <Route
            path="members"
            element={
              <div className="p-8 text-muted-foreground">
                Members — coming soon
              </div>
            }
          />
          <Route
            path="settings"
            element={
              <div className="p-8 text-muted-foreground">
                Settings — coming soon
              </div>
            }
          />
        </Route>
      </Route>

      {/* 3. Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
