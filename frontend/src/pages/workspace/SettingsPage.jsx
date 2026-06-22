import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
  useWorkspace,
} from "@/shared/hooks/useWorkspace";
import { useModulesQuery, useToggleModule } from "@/shared/hooks/useModules";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import {
  AlertTriangle,
  Plug,
  ChevronRight,
  Key,
  Webhook,
  Upload,
  LayoutGrid,
  Building2,
  UsersRound,
  BarChart2,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

// ── Module icon map ───────────────────────────────────────────────────────────
const MODULE_ICONS = {
  projects:          LayoutGrid,
  org_structure:     Building2,
  hr_management:     UsersRound,
  analytics_advanced: BarChart2,
};

const TIER_STYLES = {
  free:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pro:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ── Module Card ───────────────────────────────────────────────────────────────
function ModuleCard({ mod, allModules, workspaceId, isAdmin }) {
  const toggle = useToggleModule(workspaceId);
  const [optimistic, setOptimistic] = useState(null);
  const [error, setError] = useState("");

  const isEnabled = optimistic !== null ? optimistic : mod.is_enabled;

  // Find human-readable names for dependencies
  const depNames = mod.depends_on.map((depKey) => {
    const dep = allModules.find((m) => m.key === depKey);
    return dep?.name ?? depKey;
  });

  // Disable toggle if a dependency is not enabled
  const unmetDeps = mod.depends_on.filter((depKey) => {
    const dep = allModules.find((m) => m.key === depKey);
    return dep && !dep.is_enabled;
  });
  const canToggle = isAdmin && !mod.always_on && unmetDeps.length === 0;

  const Icon = MODULE_ICONS[mod.key] ?? LayoutGrid;

  const handleToggle = async (next) => {
    setError("");
    setOptimistic(next);
    try {
      await toggle.mutateAsync({ moduleKey: mod.key, isEnabled: next });
    } catch (err) {
      setOptimistic(null);
      const msg = err?.response?.data?.detail;
      setError(msg ?? "Failed to update module.");
    }
  };

  return (
    <div className={cn(
      "flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors",
      isEnabled && "border-primary/30",
    )}>
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{mod.name}</span>
          <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full", TIER_STYLES[mod.tier])}>
            {mod.tier}
          </span>
          {mod.always_on && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              always on
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>

        {depNames.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3 shrink-0" />
            Requires: {depNames.join(", ")}
            {unmetDeps.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">(not enabled)</span>
            )}
          </p>
        )}

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      <Toggle
        checked={isEnabled}
        onChange={handleToggle}
        disabled={!canToggle || toggle.isPending}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const updateWorkspace = useUpdateWorkspace(workspaceId);
  const deleteWorkspace = useDeleteWorkspace(workspaceId);
  const { data: modules = [] } = useModulesQuery(workspaceId);

  const [form, setForm] = useState({ name: "", description: "" });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (workspace)
      setForm({
        name: workspace.name || "",
        description: workspace.description || "",
      });
  }, [workspace]);

  const isOwner = workspace?.owner?.email === user?.email;
  const isAdmin = workspace?.my_role === "admin" || isOwner;

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(false);
    updateWorkspace.mutate(form, {
      onSuccess: () => setSaveSuccess(true),
    });
  };

  const handleDelete = () => {
    if (deleteConfirm !== workspace?.name) return;
    deleteWorkspace.mutate(undefined, {
      onSuccess: () => navigate("/"),
    });
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  const OtherPages = [
    {
      to: "integrations",
      icon: Plug,
      label: "Integrations",
      desc: "Teams, Google Chat webhooks",
    },
    {
      to: "api",
      icon: Key,
      label: "API Keys",
      desc: "Programmatic access",
    },
    {
      to: "webhooks",
      icon: Webhook,
      label: "Webhooks",
      desc: "Outbound event webhooks",
    },
    {
      to: "import",
      icon: Upload,
      label: "Import",
      desc: "Migrate from Jira, Trello…",
    },
  ];

  return (
    <div className="max-w-7xl p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Workspace Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your workspace configuration
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {/* General settings */}
        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-medium mb-5">General</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <textarea
                id="ws-desc"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                rows={3}
                placeholder="What is this workspace for?"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={updateWorkspace.isPending}>
                {updateWorkspace.isPending ? "Saving…" : "Save changes"}
              </Button>
              {saveSuccess && (
                <span className="text-sm text-green-600">Saved!</span>
              )}
              {updateWorkspace.isError && (
                <span className="text-sm text-destructive">
                  Failed to save.
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Modules */}
        <section className="rounded-md border bg-card p-4">
          <div className="mb-4">
            <h2 className="text-base font-medium">Modules</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enable or disable product areas for this workspace. Admin only.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.key}
                mod={mod}
                allModules={modules}
                workspaceId={workspaceId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </section>

        {/* Developer & integration quick-links */}
        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-medium mb-1">
            Developer & Integrations
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect third-party tools, build on the JCN API, and migrate your
            data.
          </p>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {OtherPages.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={`/w/${workspace?.id}/settings/${item.to}`}
                  className="flex items-center gap-3 px-4 py-3 bg-muted hover:bg-accent rounded-md text-sm transition-colors group"
                >
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Danger zone — owner only */}
      {isOwner && (
        <section className="rounded-md border border-destructive/40 bg-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-base font-medium text-destructive">
              Danger Zone
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Deleting the workspace is permanent. All projects, tasks, and
            members will be removed immediately.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">
                Type{" "}
                <span className="font-semibold text-foreground">
                  {workspace?.name}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="delete-confirm"
                placeholder={workspace?.name}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              disabled={
                deleteConfirm !== workspace?.name || deleteWorkspace.isPending
              }
              onClick={handleDelete}
            >
              {deleteWorkspace.isPending
                ? "Deleting…"
                : "Delete this workspace"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
