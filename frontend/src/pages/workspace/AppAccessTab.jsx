import { useState } from "react";
import {
  Check,
  Minus,
  CheckSquare,
  Square,
  UserCheck,
  Crown,
} from "lucide-react";
import { Avatar } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import Select from "@/shared/components/ui/Select";
import Modal from "@/shared/components/ui/Modal";
import { cn } from "@/shared/lib/utils";
import { useAssignRole, useBulkAssignRole } from "@/shared/hooks/useRoles";
import { getWorkspaceRoleConfig } from "@/shared/lib/constants";
import { APP_DEFS } from "@/shared/lib/navLinks";

const APP_ACCESS_DEFS = APP_DEFS.filter((a) => a.key !== "workspace").map(
  (a) => ({ ...a, label: a.shortLabel }),
);

function getMemberRole(member, roles) {
  return roles.find((r) => r.name === member.role) ?? null;
}

function memberHasAppAccess(member, appDef, roles, isWorkspaceOwner) {
  if (isWorkspaceOwner || member.role === "Admin") return true;
  const role = getMemberRole(member, roles);
  return role?.app_access?.[appDef.key] === true;
}

function AppAccessCell({ hasAccess, appDef, isInteractive, onToggle }) {
  const base =
    "w-6 h-6 rounded-full flex items-center justify-center transition-transform";
  const interactive = isInteractive
    ? "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-offset-1"
    : "";
  const ringColor = hasAccess
    ? "hover:ring-emerald-400"
    : "hover:ring-primary/40";

  return (
    <div className="flex items-center justify-center">
      <span
        className={cn(
          base,
          interactive,
          ringColor,
          hasAccess ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted",
        )}
        title={
          hasAccess
            ? `Has ${appDef.label} access${isInteractive ? " — click to change" : ""}`
            : `No ${appDef.label} access${isInteractive ? " — click to grant" : ""}`
        }
        onClick={isInteractive ? onToggle : undefined}
      >
        {hasAccess ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Minus className="w-3.5 h-3.5 text-muted-foreground/40" />
        )}
      </span>
    </div>
  );
}

export default function AppAccessTab({
  workspaceId,
  members,
  roles,
  isAdmin,
  user,
  workspace,
  onSwitchToRoles,
}) {
  const assignRole = useAssignRole(workspaceId);
  const bulkAssignRole = useBulkAssignRole(workspaceId);

  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkRoleId, setBulkRoleId] = useState("");
  const [cellModal, setCellModal] = useState(null); // { memberId, appKey, hasAccess }

  const visibleApps = APP_ACCESS_DEFS;

  const toggleCheck = (id) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearChecked = () => {
    setCheckedIds(new Set());
    setBulkRoleId("");
  };

  const handleBulkAssign = () => {
    if (!bulkRoleId || checkedIds.size === 0) return;
    bulkAssignRole.mutate(
      { roleId: bulkRoleId, memberIds: [...checkedIds] },
      { onSuccess: clearChecked },
    );
  };

  const openCellModal = (_e, member, appDef, hasAccess) => {
    if (!isAdmin) return;
    const isSelf = member.user?.email === user?.email;
    const isOwner = workspace?.owner?.email === member.user?.email;
    if (isSelf || isOwner) return;
    setCellModal({ memberId: member.id, appKey: appDef.key, hasAccess });
  };

  const modalApp = cellModal
    ? APP_ACCESS_DEFS.find((a) => a.key === cellModal.appKey)
    : null;
  const rolesWithAccess = modalApp
    ? roles.filter((r) => r.app_access?.[modalApp.key] === true)
    : [];
  const rolesWithoutAccess = modalApp
    ? roles.filter((r) => !r.app_access?.[modalApp.key])
    : [];
  const suggestedRoles = cellModal?.hasAccess ? rolesWithoutAccess : rolesWithAccess;

  const appMemberCounts = Object.fromEntries(
    visibleApps.map((app) => [
      app.key,
      members.filter((m) =>
        memberHasAppAccess(m, app, roles, workspace?.owner?.email === m.user?.email),
      ).length,
    ]),
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {visibleApps.map((app) => {
          const Icon = app.icon;
          return (
            <div
              key={app.key}
              className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className={cn("w-4 h-4", app.colors?.text)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{app.label}</p>
                <p className="text-lg font-semibold leading-tight">
                  {appMemberCounts[app.key]}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    / {members.length}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk toolbar */}
      {isAdmin && checkedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-primary/5 border-primary/20">
          <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-primary">
            {checkedIds.size} selected
          </span>
          <Select
            size="sm"
            className="ml-2 w-44"
            placeholder="Assign role…"
            value={bulkRoleId}
            onChange={setBulkRoleId}
            options={roles.map((r) => ({
              value: r.id,
              label: `${r.name}${r.is_system ? " 🔒" : ""}`,
            }))}
          />
          <Button
            size="sm"
            disabled={!bulkRoleId || bulkAssignRole.isPending}
            onClick={handleBulkAssign}
          >
            {bulkAssignRole.isPending ? "Assigning…" : "Apply"}
          </Button>
          <button
            onClick={clearChecked}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Access table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Table header */}
        <div
          className="grid bg-muted/30 border-b"
          style={{
            gridTemplateColumns: `1fr 160px ${visibleApps.map(() => "80px").join(" ")}`,
          }}
        >
          <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Member
          </div>
          <div className="px-2 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Role
          </div>
          {visibleApps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.key}
                className="flex flex-col items-center justify-center py-2.5 gap-1"
              >
                <Icon className={cn("w-3.5 h-3.5", app.colors?.text)} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {app.label === "Org Structure" ? "Org" : app.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Table rows */}
        <div className="divide-y">
          {members.map((member) => {
            const isSelf = member.user?.email === user?.email;
            const isWorkspaceOwner = workspace?.owner?.email === member.user?.email;
            const checkable = isAdmin && !isSelf && !isWorkspaceOwner;
            const isChecked = checkedIds.has(member.id);
            const roleConf = getWorkspaceRoleConfig(member.role);
            const RoleIcon = roleConf.icon;
            const memberRole = getMemberRole(member, roles);

            return (
              <div
                key={member.id}
                className={cn(
                  "grid items-center transition-colors",
                  isChecked ? "bg-primary/5" : "hover:bg-accent/30",
                )}
                style={{
                  gridTemplateColumns: `1fr 160px ${visibleApps.map(() => "80px").join(" ")}`,
                }}
              >
                {/* Member info */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {checkable && (
                    <button
                      type="button"
                      onClick={() => toggleCheck(member.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <Avatar user={member.user} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">
                        {member.user?.full_name || "—"}
                      </p>
                      {isWorkspaceOwner && (
                        <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                      {isSelf && (
                        <span className="text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                {/* Role — admin can change it inline */}
                <div className="px-2 py-3">
                  {isAdmin && !isSelf && !isWorkspaceOwner ? (
                    <Select
                      size="sm"
                      placeholder="Select…"
                      value={memberRole?.id ?? ""}
                      onChange={(v) =>
                        assignRole.mutate({ memberId: member.id, roleId: v })
                      }
                      options={roles.map((r) => ({
                        value: r.id,
                        label: `${r.name}${r.is_system ? " 🔒" : ""}`,
                      }))}
                    />
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium",
                        roleConf.className,
                      )}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleConf.label}
                    </span>
                  )}
                </div>

                {/* App access cells */}
                {visibleApps.map((app) => {
                  const hasAccess = memberHasAppAccess(member, app, roles, isWorkspaceOwner);
                  const interactive = isAdmin && !isSelf && !isWorkspaceOwner;
                  return (
                    <div key={app.key} className="px-2 py-3">
                      <AppAccessCell
                        hasAccess={hasAccess}
                        appDef={app}
                        isInteractive={interactive}
                        onToggle={(e) => openCellModal(e, member, app, hasAccess)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Role picker modal */}
      <Modal
        isOpen={!!(cellModal && modalApp)}
        onClose={() => setCellModal(null)}
        title={
          cellModal?.hasAccess
            ? `Revoke ${modalApp?.label} access`
            : `Grant ${modalApp?.label} access`
        }
        description={
          cellModal?.hasAccess
            ? `Choose a role without ${modalApp?.label} access`
            : `Choose a role with ${modalApp?.label} access`
        }
        showFooter={false}
        maxWidth="320px"
      >
        {suggestedRoles.length === 0 ? (
          <div className="px-1 py-2 text-xs text-muted-foreground">
            No matching roles.{" "}
            <button
              className="text-primary underline"
              onClick={() => {
                setCellModal(null);
                onSwitchToRoles?.();
              }}
            >
              Create one in Roles & Permissions
            </button>
          </div>
        ) : (
          <div className="flex flex-col -mx-5 -mb-4">
            {suggestedRoles.map((r) => (
              <button
                key={r.id}
                className="flex items-center gap-2 px-5 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => {
                  assignRole.mutate({ memberId: cellModal.memberId, roleId: r.id });
                  setCellModal(null);
                }}
              >
                <span className="flex-1 truncate">{r.name}</span>
                {r.is_system && (
                  <span className="text-[10px] text-muted-foreground/50">🔒</span>
                )}
              </button>
            ))}
          </div>
        )}
      </Modal>

      <p className="text-xs text-muted-foreground">
        Access is controlled by each member's role. Click a{" "}
        <Check className="w-3 h-3 inline text-emerald-500" /> or{" "}
        <Minus className="w-3 h-3 inline text-muted-foreground/40" /> to pick a
        different role, or use the role dropdown to change their role directly.
        Manage roles in the{" "}
        <button
          className="text-primary underline"
          onClick={() => onSwitchToRoles?.()}
        >
          Roles & Permissions
        </button>{" "}
        tab.
      </p>
    </div>
  );
}
