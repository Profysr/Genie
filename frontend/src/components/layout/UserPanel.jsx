import { useState, useEffect, useRef } from "react";
import {
  LogOut,
  SlidersHorizontal,
  Keyboard,
  UserCircle,
  ChevronsUpDown,
  Sun,
  Moon,
  MoonStar,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/layout/NotificationBell";

const THEMES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "midnight", label: "Midnight", icon: MoonStar },
];

const DropdownItem = ({ icon: Icon, label, onClick, shortcut, variant = "default" }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left rounded-md",
      variant === "destructive" && "text-destructive hover:text-destructive",
    )}
  >
    <Icon
      className={cn("w-4 h-4", variant !== "destructive" && "text-muted-foreground")}
    />
    <span className="flex-1">{label}</span>
    {shortcut && (
      <kbd className="text-[10px] font-semibold bg-muted border border-border rounded px-1 py-0.5 leading-none">
        {shortcut}
      </kbd>
    )}
  </button>
);

function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  return (
    <div className="px-3 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 px-0.5">
        Theme
      </p>
      <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
        {THEMES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors",
              theme === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function UserPanel({
  user,
  onOpenSettings,
  onOpenShortcuts,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef(null);

  const name = user?.display_name || "User";

  // close the dropdown when clicking outside of it
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const action = (fn) => () => {
    fn();
    setOpen(false);
  };

  const menuItems = [
    {
      icon: UserCircle,
      label: "Account settings",
      onClick: () => onOpenSettings("me"),
    },
    {
      icon: SlidersHorizontal,
      label: "Preferences",
      onClick: () => onOpenSettings("preferences"),
    },
    {
      icon: Keyboard,
      label: "Keyboard shortcuts",
      onClick: onOpenShortcuts,
      shortcut: "?",
    },
  ];

  return (
    <div ref={ref} className="px-3 pb-3 pt-2 border-t border-border/60 relative">
      {/* Trigger row */}
      <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg hover:bg-accent transition-colors group">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
        >
          <div className="relative flex-shrink-0">
            <Avatar name={name} size="md" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[hsl(var(--sidebar-bg))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight text-foreground">
              {name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {user?.email}
            </p>
          </div>
        </button>

        <NotificationBell />
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Account menu"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-3 right-3 bottom-full mb-1 z-50 bg-popover border border-border rounded-md shadow-popover py-1 animate-scale-in origin-bottom">
          {/* Profile header card */}
          <div className="flex items-center gap-3 px-3 py-2.5 mx-1 mb-1 rounded-md bg-muted/40">
            <div className="relative flex-shrink-0">
              <Avatar name={name} size="lg" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-popover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {user?.email}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            </div>
          </div>

          <div className="px-1">
            {menuItems.map((item) => (
              <DropdownItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                onClick={action(item.onClick)}
                shortcut={item.shortcut ?? undefined}
              />
            ))}
          </div>

          <div className="border-t border-border my-1" />
          <ThemeSwitcher />
          <div className="border-t border-border my-1" />

          <div className="px-1">
            <DropdownItem
              icon={LogOut}
              label="Sign out"
              onClick={action(() => setConfirmLogout(true))}
              variant="destructive"
            />
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {confirmLogout && (
        <ConfirmModal
          title="Sign out?"
          message="Are you sure you want to log out? You'll be returned to the login screen."
          confirmLabel="Sign out"
          onConfirm={() => {
            setConfirmLogout(false);
            onLogout();
          }}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}
