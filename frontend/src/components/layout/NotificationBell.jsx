import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bell,
  ArrowRight,
  CheckCheck,
  UserPlus,
  MessageSquare,
  AtSign,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useInbox,
  useUpdateInboxItem,
  useBulkUpdateInbox,
  useInboxUnreadCount,
} from "@/hooks/useInbox";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Loader } from "../ui/Loader";

// Self-contained verb metadata — the bell does not depend on the Inbox page,
// so it keeps working if/when Inbox is replaced.
const VERB_META = {
  task_assigned: { label: "assigned you to", icon: UserPlus, tone: "text-indigo-500" },
  task_commented: { label: "commented on", icon: MessageSquare, tone: "text-sky-500" },
  task_mentioned: { label: "mentioned you in", icon: AtSign, tone: "text-violet-500" },
  approval_requested: { label: "requested approval on", icon: ShieldCheck, tone: "text-amber-500" },
};

const fallbackMeta = (verb) => ({
  label: (verb || "updated").replace(/_/g, " "),
  icon: Activity,
  tone: "text-muted-foreground",
});

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export default function NotificationBell() {
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const ref = useRef(null);

  const { data: items = [], isLoading } = useInbox(workspaceSlug, {
    tab: "for_you",
    enabled: open, // only fetch the full list when the panel is open
  });
  const unreadCount = useInboxUnreadCount(workspaceSlug);
  const updateItem = useUpdateInboxItem(workspaceSlug);
  const bulkUpdate = useBulkUpdateInbox(workspaceSlug);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = useMemo(
    () =>
      filter === "unread"
        ? items.filter((i) => i.status === "unread")
        : items,
    [items, filter],
  );

  // Group by project_name
  const grouped = useMemo(
    () =>
      visible.reduce((acc, item) => {
        const key = item.project_name || "General";
        (acc[key] ||= []).push(item);
        return acc;
      }, {}),
    [visible],
  );

  const handleItemClick = (item) => {
    if (item.status === "unread") {
      updateItem.mutate({ id: item.id, status: "read" });
    }
    navigate(
      `/w/${item.meta?.workspace_slug || workspaceSlug}/projects/${item.meta?.project_id}?task=${item.meta?.task_id}`,
    );
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    const ids = items.filter((i) => i.status === "unread").map((i) => i.id);
    if (ids.length) bulkUpdate.mutate({ ids, action: "read" });
  };

  const handleViewAll = () => {
    navigate(`/w/${workspaceSlug}/inbox`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative p-1.5 rounded-md transition-colors",
          open
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none ring-2 ring-[hsl(var(--sidebar-bg))]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-[360px] bg-popover border border-border rounded-md shadow-popover overflow-hidden animate-scale-in origin-bottom-left">
          {/* Header */}
          <div className="px-4 pt-3 pb-2.5 border-b border-border">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || bulkUpdate.isPending}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1">
              {FILTERS.map((f) => {
                const count =
                  f.key === "unread" ? unreadCount : items.length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-md transition-colors",
                      filter === f.key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className="ml-1 text-[10px] opacity-70">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <Loader className={"h-full w-full flex items-center justify-center"} />
            ) : visible.length === 0 ? (
              <EmptyState
                illustration="notifications"
                title={
                  filter === "unread"
                    ? "No unread notifications"
                    : "You're all caught up"
                }
                description={
                  filter === "unread"
                    ? "You're all read up here."
                    : "Nothing for you here right now."
                }
                className="py-10"
              />
            ) : (
              Object.entries(grouped).map(([projectName, projectItems]) => (
                <div key={projectName}>
                  {/* Project group header */}
                  <div className="flex items-center justify-between px-4 py-1.5 bg-muted/40 sticky top-0 backdrop-blur-sm z-10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                      {projectName}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                      {projectItems.filter((i) => i.status === "unread").length}{" "}
                      unread
                    </span>
                  </div>

                  {projectItems.slice(0, 4).map((item) => {
                    const meta = VERB_META[item.verb] || fallbackMeta(item.verb);
                    const VerbIcon = meta.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-accent text-left transition-colors",
                          item.status === "unread" && "bg-primary/[0.04]",
                        )}
                      >
                        <div className="relative flex-shrink-0 mt-0.5">
                          <Avatar name={item.actor_name || "?"} size="sm" />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-popover flex items-center justify-center">
                            <VerbIcon className={cn("w-3 h-3", meta.tone)} />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug break-words">
                            <span className="font-semibold">
                              {item.actor_name}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {meta.label}
                            </span>{" "}
                            <span className="font-medium">
                              "{item.resource_name}"
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {item.status === "unread" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </button>
                    );
                  })}

                  {projectItems.length > 4 && (
                    <button
                      onClick={handleViewAll}
                      className="w-full text-xs text-muted-foreground hover:text-foreground px-4 py-1.5 text-left transition-colors"
                    >
                      +{projectItems.length - 4} more in {projectName}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <button
            onClick={handleViewAll}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent border-t border-border transition-colors"
          >
            View all notifications <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
