import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-indigo-500 text-white",
  "bg-violet-500 text-white",
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-pink-500 text-white",
  "bg-sky-500 text-white",
  "bg-teal-500 text-white",
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const sizeMap = {
  xxs:  { outer: "w-4 h-4",   text: "text-[8px]",  emoji: "text-[8px]" },
  xs:   { outer: "w-5 h-5",   text: "text-[9px]",  emoji: "text-[10px]" },
  sm:   { outer: "w-6 h-6",   text: "text-[10px]", emoji: "text-xs" },
  md:   { outer: "w-8 h-8",   text: "text-xs",     emoji: "text-sm" },
  lg:   { outer: "w-10 h-10", text: "text-sm",     emoji: "text-lg" },
  xl:   { outer: "w-12 h-12", text: "text-base",   emoji: "text-xl" },
  "2xl": { outer: "w-14 h-14", text: "text-2xl",   emoji: "text-2xl" },
};

/**
 * Renders a user avatar in one of three modes:
 *   1. Google / external image  — pass `src` or a user with avatar_type="google"
 *   2. Emoji icon               — pass `icon` or a user with avatar_type="icon"
 *   3. Initials fallback        — derives a letter + color from `name`
 *
 * Shortcut: pass the raw `user` object and the component resolves the mode
 * automatically using avatar_type, so existing call sites don't all need editing.
 */
export function Avatar({ name, src, icon, user, size = "md", className, ring = false }) {
  const { outer, text, emoji: emojiSize } = sizeMap[size] || sizeMap.md;

  // Resolve display values from a user object if provided.
  const resolvedSrc  = src  ?? (user?.avatar_type === "google" ? user.avatar : null);
  const resolvedIcon = icon ?? (user?.avatar_type === "icon"   ? user.avatar_icon : null);
  const resolvedName = name ?? user?.full_name ?? user?.email;

  const color   = getAvatarColor(resolvedName);
  const initial = resolvedName?.[0]?.toUpperCase() || "?";

  const base = cn(
    "rounded-full flex-shrink-0 select-none flex items-center justify-center font-semibold",
    outer,
    ring && "ring-2 ring-background",
    className
  );

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={resolvedName}
        title={resolvedName}
        className={cn(base, "object-cover")}
      />
    );
  }

  if (resolvedIcon) {
    return (
      <div className={cn(base, color)} title={resolvedName}>
        <span className={emojiSize} style={{ lineHeight: 1 }}>{resolvedIcon}</span>
      </div>
    );
  }

  return (
    <div className={cn(base, color)} title={resolvedName}>
      <span className={text}>{initial}</span>
    </div>
  );
}

export function AvatarGroup({ users = [], max = 3, size = "sm", className }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className={cn("flex -space-x-1.5", className)}>
      {visible.map((u, i) => (
        <Avatar
          key={u.id || i}
          user={u}
          name={u.full_name || u.email}
          size={size}
          ring
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold",
            "bg-muted text-muted-foreground ring-2 ring-background",
            sizeMap[size]?.outer || sizeMap.sm.outer,
            "text-[9px]"
          )}
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
