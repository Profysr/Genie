import { useState, useRef, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { PRIORITIES, LABEL_COLORS as LABEL_COLOR_PALETTE, } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const LABEL_COLORS = LABEL_COLOR_PALETTE;

export const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({
  value: p.value,
  label: p.label,
  color: p.textCls,
  icon: p.icon,
}));

export const QUICK_EMOJIS = ["👍", "❤️", "😄", "🎉", "🚀", "👀"];

export const REVIEWER_STATUS_CONFIG = {
  pending:           { label: "Pending",           cls: "bg-muted text-muted-foreground"     },
  approved:          { label: "Approved",          cls: "bg-emerald-500/10 text-emerald-600" },
  rejected:          { label: "Rejected",          cls: "bg-destructive/10 text-destructive" },
  changes_requested: { label: "Changes requested", cls: "bg-amber-500/10 text-amber-700"    },
};

export function Dropdown({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select…",
  renderTrigger,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between gap-2 text-sm transition-colors rounded-lg w-full text-left",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <span className="flex-1 truncate">
          {renderTrigger
            ? renderTrigger(selected)
            : selected?.label || <span className="text-muted-foreground">{placeholder}</span>}
        </span>
        {/* inline chevron to avoid lucide import in shared — using CSS border trick */}
        <svg
          className={cn("w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200", open && "rotate-180")}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className={cn(
          "absolute right-0 z-[60] min-w-52 bg-popover border border-border rounded shadow-xl overflow-hidden transition-all duration-200 origin-top",
          open
            ? "opacity-100 scale-y-100 translate-y-0.5"
            : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none",
        )}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
              opt.value === value && "bg-accent/70 font-semibold",
            )}
          >
            {renderOption ? renderOption(opt) : opt.label}
            {opt.value === value && <Check className="w-3.5 h-3.5 ml-auto text-primary flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailRow({ label, children }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0 group hover:bg-accent/20 -mx-2 px-2 rounded transition-colors">
      <span className="text-xs font-medium text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  );
}

export function LabelPicker({ currentLabels, taskLabels, onToggle, onCreateLabel }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentIds = new Set(currentLabels.map((l) => l.id));

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateLabel?.({ name: newName.trim(), color: newColor }, { onSuccess: () => setNewName("") });
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
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="flex-1 text-left">{l.name}</span>
                    {currentIds.has(l.id) && <Check className="w-3.5 h-3.5 text-primary" />}
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
                  className={cn("w-5 h-5 rounded-full transition-transform", newColor === c && "ring-2 ring-offset-1 ring-ring scale-110")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {newName.trim() && (
              <button
                type="submit"
                className="w-full text-xs bg-primary text-primary-foreground rounded py-1.5 font-medium hover:bg-primary/90 transition-colors"
              >
                Create "{newName.trim()}"
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
