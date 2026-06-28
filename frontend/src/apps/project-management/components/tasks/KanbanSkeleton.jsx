import { motion } from "framer-motion";

const SHIMMER = {
  animate: { x: ["−100%", "100%"] },
  transition: { duration: 1.4, repeat: Infinity, ease: "linear", repeatDelay: 0.1 },
};

function ShimmerSweep() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
        x: "-100%",
      }}
      animate={{ x: "100%" }}
      transition={SHIMMER.transition}
    />
  );
}

function SkeletonCard({ wide = true }) {
  return (
    <div className="relative overflow-hidden rounded-md bg-accent/40 border border-border/60 p-3 flex flex-col gap-2.5">
      <ShimmerSweep />
      <div className={`h-3 rounded-sm bg-muted-foreground/15 ${wide ? "w-full" : "w-5/6"}`} />
      <div className="h-3 rounded-sm bg-muted-foreground/10 w-3/4" />
      <div className="flex items-center gap-2 mt-0.5">
        <div className="h-4 w-10 rounded-full bg-muted-foreground/10" />
        <div className="h-4 w-14 rounded-full bg-muted-foreground/10" />
        <div className="ml-auto h-5 w-5 rounded-full bg-muted-foreground/10" />
      </div>
    </div>
  );
}

function SkeletonColumn({ cardCount, colorClass }) {
  return (
    <div className="w-[272px] flex-shrink-0 rounded-lg bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden px-3 py-2.5 border-b border-border/60 flex items-center gap-2">
        <ShimmerSweep />
        <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
        <div className="h-3 w-28 rounded-sm bg-muted-foreground/20" />
        <div className="ml-auto h-4 w-5 rounded bg-muted-foreground/15" />
      </div>
      {/* Cards */}
      <div className="p-2 flex flex-col gap-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} wide={i % 2 === 0} />
        ))}
      </div>
    </div>
  );
}

const COLUMNS = [
  { cardCount: 3, colorClass: "bg-slate-400/40" },
  { cardCount: 4, colorClass: "bg-blue-400/40" },
  { cardCount: 2, colorClass: "bg-amber-400/40" },
  { cardCount: 3, colorClass: "bg-green-400/40" },
];

export default function KanbanSkeleton() {
  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-2 h-full items-start">
        {COLUMNS.map((col, i) => (
          <SkeletonColumn key={i} {...col} />
        ))}
      </div>
    </div>
  );
}
