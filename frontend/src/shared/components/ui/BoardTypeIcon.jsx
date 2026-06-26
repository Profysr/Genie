import { cn } from "@/shared/lib/utils";
import { getBoardIcon } from "@/shared/lib/boardTypes";

const sizeMap = {
  xs: { outer: "w-5 h-5 rounded", icon: "w-3 h-3" },
  sm: { outer: "w-7 h-7 rounded-md", icon: "w-3.5 h-3.5" },
  md: { outer: "w-9 h-9 rounded-lg", icon: "w-4 h-4" },
  lg: { outer: "w-10 h-10 rounded-lg", icon: "w-5 h-5" },
  xl: { outer: "w-12 h-12 rounded-xl", icon: "w-6 h-6" },
  "2xl": { outer: "w-16 h-16 rounded-2xl", icon: "w-8 h-8" },
};

/**
 * Renders a board's type icon inside a primary-tinted container.
 *
 * @param {Object} props
 * @param {string} props.board_type - board.board_type value (e.g. "software")
 * @param {"xs"|"sm"|"md"|"lg"|"xl"|"2xl"} [props.size="sm"] - container size
 * @param {"plain"|"circular"} [props.variant="plain"] - shape style variation
 * @param {string} [props.className] - extra classes on the outer container
 */
export default function BoardTypeIcon({
  board_type,
  size = "sm",
  variant = "plain",
  className,
}) {
  const Icon = getBoardIcon(board_type);
  const s = sizeMap[size] ?? sizeMap.sm;

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20",
        s.outer,
        variant === "circular" && "rounded-full",
        className,
      )}
    >
      {Icon && <Icon className={cn("text-primary", s.icon)} />}
    </div>
  );
}
