import { cn } from "@/lib/utils";

/**
 * Reusable confirmation dialog — replaces all window.confirm() usage.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *
 *   // Trigger:
 *   setConfirmState({ message: "Delete this?", onConfirm: () => doDelete() });
 *
 *   // Render:
 *   {confirmState && (
 *     <ConfirmModal
 *       {...confirmState}
 *       onCancel={() => setConfirmState(null)}
 *       onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
 *     />
 *   )}
 */
export function ConfirmModal({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-card border border-border rounded-md shadow-2xl w-full max-w-sm p-6 z-10">
        <h2 className="font-semibold text-base">{title}</h2>
        {message && (
          <p className="text-sm text-muted-foreground mt-1.5">{message}</p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 text-sm rounded font-medium transition-colors",
              danger
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
