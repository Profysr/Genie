import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Timeline = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} {...props}>
    {/* Spine — centered inside the w-9 separator column */}
    <div
      className="absolute left-0 top-3 bottom-3 w-9 flex justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="w-px bg-border h-full" />
    </div>
    <div className="space-y-0">{children}</div>
  </div>
));

const TimelineItem = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-start relative py-2", className)} {...props} />
));

const TimelineSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-shrink-0 w-9 flex items-center justify-center z-10", className)}
    {...props}
  />
));

const TimelineDot = React.forwardRef(
  ({ className, dotClassName, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-4 h-4 rounded-full flex items-center justify-center ring-[3px] ring-background",
        className,
      )}
      {...props}
    >
      <span className={cn("w-2.5 h-2.5 rounded-full", dotClassName)} />
    </div>
  ),
);

const TimelineContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 min-w-0", className)} {...props} />
));

export { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent };
