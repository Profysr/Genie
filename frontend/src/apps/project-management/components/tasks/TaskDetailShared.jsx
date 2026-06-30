import { useState, useRef, useEffect } from "react";
import { Plus, Check } from "lucide-react";
import { PRIORITIES, LABEL_COLORS } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";

export const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({
  value: p.value,
  label: p.label,
  color: p.textCls,
  icon: p.icon,
}));

export const QUICK_EMOJIS = ["👍", "❤️", "😄", "🎉", "🚀", "👀"];

export const REVIEWER_STATUS_CONFIG = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  approved: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-600" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
  changes_requested: {
    label: "Changes requested",
    cls: "bg-amber-500/10 text-amber-700",
  },
};

export function DetailRow({ label, children }) {
  return (
    <div className="flex items-center gap-3 py-1.5 group -mx-1 px-1 rounded-lg hover:bg-accent/20 transition-colors">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 w-20 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  );
}

export function LabelPicker({
  currentLabels,
  taskLabels,
  onToggle,
  onCreateLabel,
  openSignal = 0,
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Opened programmatically by the ⇧L shortcut.
  useEffect(() => {
    if (openSignal > 0) setOpen(true);
  }, [openSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIds = new Set(currentLabels.map((l) => l.id));

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateLabel?.(
      { name: newName.trim(), color: newColor },
      { onSuccess: () => setNewName("") },
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground border border-dashed rounded px-2 py-0.5 hover:text-foreground hover:border-foreground/50 transition-colors"
      >
        <Plus className="w-3 h-3" /> Add label
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-50 w-56 bg-popover border rounded-md shadow-popover p-2">
          {taskLabels.length > 0 && (
            <>
              <div className="space-y-0.5 mb-2">
                {taskLabels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onToggle(l)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-xs transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded flex-shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1 text-left">{l.name}</span>
                    {currentIds.has(l.id) && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t mb-2" />
            </>
          )}
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              className="w-full text-xs border rounded px-2 py-1.5 bg-background outline-none focus:ring-1 focus:ring-ring"
              placeholder="New label name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-1.5 flex-wrap">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-transform",
                    newColor === c &&
                      "ring-2 ring-offset-1 ring-ring scale-110",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {newName.trim() && (
              <button
                type="submit"
                className="w-full text-xs bg-primary text-primary-foreground rounded py-1.5 font-medium hover:bg-primary/90 transition-colors"
              >
                Create &quot;{newName.trim()}&quot;
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
