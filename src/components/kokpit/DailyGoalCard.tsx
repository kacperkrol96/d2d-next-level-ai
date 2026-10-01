import { CalendarCheck } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import type { DailyGoal } from "@/lib/domain/rhythm";

/** Cel dnia wg rytmu pracy (audytor: dzień umawiania / dzień spotkań). */
export function DailyGoalCard({ goal, done, week }: { goal: DailyGoal; done: Record<string, number>; week?: { booked: number; held: number } }) {
  return (
    <Card className="border-accent/30">
      <CardTitle hint={week ? `tydzień: ${week.booked} umówionych / ${week.held} odbytych` : undefined}>
        <span className="flex items-center gap-2">
          <CalendarCheck size={16} className="text-accent-soft" /> {goal.title}
        </span>
      </CardTitle>
      {goal.goals.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {goal.goals.map((g) => {
            const have = done[g.label] ?? 0;
            const ratio = Math.min(1, have / Math.max(1, g.target));
            return (
              <div key={g.label} className="rounded-2xl bg-card-2 p-3">
                <div className="text-xs text-muted">{g.label}</div>
                <div className="num mt-1 text-2xl font-semibold">
                  <span className={ratio >= 1 ? "text-earned" : ""}>{have}</span>
                  <span className="text-base text-muted">/{g.target}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={`h-full rounded-full ${ratio >= 1 ? "bg-earned" : "bg-accent"}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">{goal.hint}</p>
    </Card>
  );
}
