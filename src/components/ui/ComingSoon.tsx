import { Sparkles } from "lucide-react";
import { Card, PageHeader } from "./Card";

export function ComingSoon({ title, subtitle, stage, features }: { title: string; subtitle: string; stage: string; features: string[] }) {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent-soft">
            <Sparkles size={13} /> {stage}
          </span>
          <ul className="mt-5 flex flex-col gap-3">
            {features.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-white/85">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
