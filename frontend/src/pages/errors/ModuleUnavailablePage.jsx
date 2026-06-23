import { Lock, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { APP_DEFS } from "@/shared/lib/navLinks";

const TIER_BADGE = {
  Pro:        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export default function ModuleUnavailablePage({ moduleKey }) {
  const { workspaceId } = useParams();
  const def = APP_DEFS.find((a) => a.key === moduleKey);
  const locked = def?.locked ?? { tier: "Pro", description: "This module is not enabled for your workspace." };
  const Icon = def?.icon ?? Lock;
  const c = def?.colors ?? { bg: "bg-muted", text: "text-muted-foreground" };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-6 py-16 text-center">
      <div className={`w-16 h-16 rounded-2xl ${c.bg} flex items-center justify-center mb-6`}>
        <Icon className={`w-8 h-8 ${c.text}`} />
      </div>

      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${TIER_BADGE[locked.tier] ?? "bg-muted text-muted-foreground"}`}
      >
        <Lock className="w-3 h-3" />
        {locked.tier} plan required
      </span>

      <h1 className="text-2xl font-bold text-foreground mb-2">{def?.label ?? moduleKey}</h1>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-2">
        {locked.description}
      </p>
      {locked.requires && (
        <p className="text-xs text-muted-foreground/60 mt-1 mb-2">
          ⚠ {locked.requires}
        </p>
      )}

      <div className="flex items-center gap-3 mt-8">
        <Link
          to={`/w/${workspaceId}/settings`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Enable in Settings
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to={`/w/${workspaceId}/dashboards`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
