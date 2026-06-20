import { cn } from "@/shared/lib/utils";

const SIZES = {
  xs: "w-3.5 h-3.5 border-[1.5px]",
  sm: "w-4 h-4 border-[1.5px]",
  md: "w-5 h-5 border-2",
  lg: "w-6 h-6 border-2",
  xl: "w-8 h-8 border-2",
};

/**
 * Centered loading spinner.
 * `className` controls the outer container (size, padding, bg, positioning).
 * `size` controls the spinner itself: xs | sm | md (default) | lg | xl
 *
 * Examples:
 *   <Loader />                                    – inline center
 *   <Loader className="flex-1" />                 – fills available flex space
 *   <Loader className="h-32" />                   – 128 px tall section
 *   <Loader className="min-h-screen bg-background" size="lg" />  – full page
 */
export function Loader({ size = "md", className }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full border-primary border-t-transparent animate-spin",
          SIZES[size],
        )}
      />
    </div>
  );
}
