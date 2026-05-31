import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from "@/hooks/useMembers";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Shield, User, Eye, Trash2, Crown, Link, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = ["admin", "member", "viewer"];
const ROLE_CONFIG = {
  admin:  { label: "Admin",  icon: Shield, className: "text-primary bg-primary/10" },
  member: { label: "Member", icon: User,   className: "text-foreground bg-muted" },
  viewer: { label: "Viewer", icon: Eye,    className: "text-muted-foreground bg-muted" },
};

export default function MembersPage() {
  const { workspaceSlug } = useParams();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useMembers(workspaceSlug);
  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/`).then((r) => r.data),
  });
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["workspace-invites", workspaceSlug],
    queryFn: () => api.get(`/api/workspaces/${workspaceSlug}/invites/pending/`).then((r) => r.data),
    enabled: !!workspaceSlug,
  });

  const inviteMember = useInviteMember(workspaceSlug);
  const updateRole   = useUpdateMemberRole(workspaceSlug);
  const removeMember = useRemoveMember(workspaceSlug);

  const cancelInvite = useMutation({
    mutationFn: (token) => api.delete(`/api/workspaces/${workspaceSlug}/invites/${token}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-invites", workspaceSlug] }),
  });

  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [inviteError, setInviteError]     = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [copiedToken, setCopiedToken]     = useState(null);

  const currentMember = members.find((m) => m.user?.email === user?.email);
  const isAdmin = currentMember?.role === "admin";

  const handleInvite = (e) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    inviteMember.mutate(inviteForm, {
      onSuccess: (invite) => {
        setInviteSuccess(`Invite created for ${inviteForm.email}`);
        setInviteForm({ email: "", role: "member" });
        qc.invalidateQueries({ queryKey: ["workspace-invites", workspaceSlug] });
      },
      onError: (err) => {
        setInviteError(
          err.response?.data?.email?.[0] ||
          err.response?.data?.non_field_errors?.[0] ||
          "Failed to create invite."
        );
      },
    });
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/invites/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
        </p>
      </div>

      {/* Invite form */}
      {isAdmin && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Invite a member
          </h2>
          <form onSubmit={handleInvite} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Email address</label>
              <Input
                type="email"
                placeholder="teammate@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </form>
          {inviteError   && <p className="text-sm text-destructive mt-2">{inviteError}</p>}
          {inviteSuccess && <p className="text-sm text-green-600 mt-2">{inviteSuccess}</p>}
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> Pending invites ({pendingInvites.length})
          </h2>
          <div className="rounded-xl border bg-card divide-y">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invited as <span className="capitalize">{invite.role}</span>
                    {invite.invited_by && ` · by ${invite.invited_by.full_name || invite.invited_by.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyInviteLink(invite.token)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-md px-2.5 py-1.5 hover:bg-accent transition-colors"
                    title="Copy invite link"
                  >
                    <Link className="w-3 h-3" />
                    {copiedToken === invite.token ? "Copied!" : "Copy link"}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => cancelInvite.mutate(invite.token)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      title="Cancel invite"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Link className="w-3 h-3" />
            Copy the invite link and share it directly — the recipient clicks it to join.
          </p>
        </div>
      )}

      {/* Active members */}
      <div>
        <h2 className="text-sm font-medium mb-3 text-muted-foreground">Active members</h2>
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="divide-y">
              {members.map((member) => {
                const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                const RoleIcon = roleConf.icon;
                const isSelf = member.user?.email === user?.email;
                const isWorkspaceOwner = workspace?.owner?.email === member.user?.email;

                return (
                  <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {member.user?.full_name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{member.user?.full_name || member.user?.email}</p>
                          {isWorkspaceOwner && <Crown className="w-3.5 h-3.5 text-yellow-500" title="Workspace owner" />}
                          {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAdmin && !isSelf && !isWorkspaceOwner ? (
                        <select
                          className="text-xs border rounded-md px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
                          value={member.role}
                          onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value })}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                        </select>
                      ) : (
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", roleConf.className)}>
                          <RoleIcon className="w-3 h-3" />{roleConf.label}
                        </span>
                      )}
                      {isAdmin && !isSelf && !isWorkspaceOwner && (
                        <button
                          onClick={() => { if (confirm(`Remove ${member.user?.full_name || member.user?.email}?`)) removeMember.mutate(member.id); }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
