import { createContext, useContext } from "react";
import { cn } from "@/shared/lib/utils";

const TabsCtx = createContext(null);

export function Tabs({ value, onChange, children, className }) {
  return (
    <TabsCtx.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }) {
  return (
    <div className={cn("flex items-center border border-border rounded", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className, icon: Icon, badge }) {
  const ctx = useContext(TabsCtx);
  const isActive = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.onChange(value)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 text-xs rounded border transition-colors font-medium",
        isActive
          ? "border-primary/40 bg-primary/8 text-primary"
          : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border",
        className,
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {children}
      {badge != null && badge > 0 && (
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center",
            isActive
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const ctx = useContext(TabsCtx);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}

// Underline variant — same API but different visual style (used in page-level nav)
export function TabsUnderlineList({ children, className }) {
  return (
    <div className={cn("flex gap-0.5 border-b", className)}>
      {children}
    </div>
  );
}

export function TabsUnderlineTrigger({ value, children, className, icon: Icon }) {
  const ctx = useContext(TabsCtx);
  const isActive = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.onChange(value)}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {children}
    </button>
  );
}
