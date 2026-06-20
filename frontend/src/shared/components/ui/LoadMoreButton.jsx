import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * Shared "load more" trigger used across infinite-scroll surfaces.
 *
 * variant="row"    — full-width with a top border; fits inside popovers / list panels
 * variant="inline" — dashed border + rounded; fits inside scrollable content areas
 */
export default function LoadMoreButton({
  onClick,
  isLoading = false,
  label = "Load more",
  variant = "inline",
  className,
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50",
        variant === "row"
          ? "px-4 py-2.5 hover:bg-accent border-t border-border"
          : "py-1.5 border border-dashed border-border rounded-md hover:bg-accent/30",
        className,
      )}
    >
      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : label}
    </button>
  );
}
