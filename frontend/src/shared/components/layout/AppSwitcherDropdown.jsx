import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { LayoutGrid } from "lucide-react";
import { APP_DEFS, APP_LANDING, workspaceUrl } from "@/shared/lib/navLinks";
import { useModules } from "@/shared/hooks/useModules";
import { useActiveApp } from "@/shared/hooks/useActiveApp";
import { Tooltip } from "@/shared/components/ui/tooltip";

const APP_COLORS = {
  projects:      { bg: "bg-violet-500/15",  text: "text-violet-500",  dot: "bg-violet-500" },
  org_structure: { bg: "bg-blue-500/15",    text: "text-blue-500",    dot: "bg-blue-500" },
  hr_management: { bg: "bg-emerald-500/15", text: "text-emerald-500", dot: "bg-emerald-500" },
  workspace:     { bg: "bg-slate-500/15",   text: "text-slate-400",   dot: "bg-slate-400" },
};

function AppList({ workspaceId, activeApp, visibleApps, onNavigate }) {
  return (
    <div className="py-1">
      <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
        Apps
      </p>
      {visibleApps.map((app) => {
        const Icon = app.icon;
        const isActive = activeApp === app.key;
        const c = APP_COLORS[app.key] ?? APP_COLORS.projects;
        return (
          <button
            key={app.key}
            onClick={() => onNavigate(app)}
            className={cn(
              "flex items-center gap-2.5 w-full px-2 mx-1 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            style={{ width: "calc(100% - 8px)" }}
          >
            <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0", c.bg)}>
              <Icon className={cn("w-3.5 h-3.5", c.text)} />
            </div>
            <span className={cn("flex-1 text-left text-sm", isActive && "font-medium")}>
              {app.label}
            </span>
            {isActive && (
              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function AppSwitcherDropdown({ workspaceId, collapsed }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const activeApp = useActiveApp();
  const { isEnabled, isLoading: modulesLoading } = useModules();

  const visibleApps = APP_DEFS.filter(
    (app) =>
      app.key !== "workspace" &&
      (!app.moduleKey || modulesLoading || isEnabled(app.moduleKey)),
  );

  const currentApp = APP_DEFS.find((a) => a.key === activeApp);
  const colors = APP_COLORS[currentApp?.key] ?? APP_COLORS.projects;
  const CurrentIcon = currentApp?.icon ?? LayoutGrid;

  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const handleNavigate = (app) => {
    navigate(workspaceUrl(workspaceId, APP_LANDING[app.key]));
    setOpen(false);
  };

  // ── Collapsed: colored icon button, flyout to the right ───────────────────
  if (collapsed) {
    return (
      <div
        ref={ref}
        className="border-t border-border/60 py-2 flex justify-center relative"
      >
        <Tooltip content="Switch app" side="right" delayDuration={100}>
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              colors.bg,
            )}
          >
            <CurrentIcon className={cn("w-4 h-4", colors.text)} />
          </button>
        </Tooltip>

        {open && (
          <div className="absolute left-full bottom-0 ml-2 z-50 w-56 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in origin-bottom-left">
            <AppList
              workspaceId={workspaceId}
              activeApp={activeApp}
              visibleApps={visibleApps}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Expanded: full trigger row, dropdown opens upward ─────────────────────
  return (
    <div
      ref={ref}
      className="px-3 pb-2 pt-1.5 border-t border-border/60 relative"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors group"
      >
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors", colors.bg)}>
          <CurrentIcon className={cn("w-4 h-4", colors.text)} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-foreground truncate leading-tight">
            {currentApp?.label ?? "Apps"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Switch app
          </p>
        </div>
        <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 transition-colors" />
      </button>

      {open && (
        <div className="absolute left-3 right-3 bottom-full mb-1 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-scale-in origin-bottom">
          <AppList
            workspaceId={workspaceId}
            activeApp={activeApp}
            visibleApps={visibleApps}
            onNavigate={handleNavigate}
          />
        </div>
      )}
    </div>
  );
}
