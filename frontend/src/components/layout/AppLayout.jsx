import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderKanban, Users, Settings, LogOut, ChevronDown,
  Plus, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout() {
  const { workspaceSlug } = useParams();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/`).then((r) => r.data),
    enabled: !!workspaceSlug,
  });

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/api/workspaces/").then((r) => r.data.results || r.data),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { to: `/w/${workspaceSlug}`, icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: `/w/${workspaceSlug}/projects`, icon: FolderKanban, label: "Projects" },
    { to: `/w/${workspaceSlug}/members`, icon: Users, label: "Members" },
    { to: `/w/${workspaceSlug}/settings`, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r flex flex-col bg-card">
        {/* Workspace switcher */}
        <div className="p-3 border-b">
          <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent text-sm font-medium">
            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {workspace?.name?.[0]?.toUpperCase() || "W"}
            </div>
            <span className="flex-1 text-left truncate">{workspace?.name || "Loading..."}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-2 border-t">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.display_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.display_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-1 rounded">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
