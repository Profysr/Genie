import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { APP_DEFS } from "@/shared/lib/navLinks";

export default function AppWelcomeScreen({ moduleKey, onGetStarted }) {
  const def = APP_DEFS.find((a) => a.key === moduleKey);
  const content = def?.welcome;

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
        <p className="text-muted-foreground">App ready. Click below to continue.</p>
        <Button className="mt-6" onClick={onGetStarted}>
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  const Icon = def.icon;
  const c = def.colors;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] h-full px-6 py-16">
      <div className="w-full max-w-lg">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center mb-6`}>
          <Icon className={`w-7 h-7 ${c.text}`} />
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-foreground">{def.label}</h1>
        <p className={`text-sm font-medium mt-1 mb-3 ${c.text}`}>
          {content.tagline}
        </p>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {content.description}
        </p>

        {/* Setup checklist */}
        <div className="rounded-xl border bg-card p-5 mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What to set up first
          </p>
          <ul className="space-y-2.5">
            {content.setupItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button className="gap-2 w-full sm:w-auto" onClick={onGetStarted}>
          {content.ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          This screen won't appear again. You can always return to these steps from the Settings page.
        </p>
      </div>
    </div>
  );
}
