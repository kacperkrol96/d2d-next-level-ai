import { Mic, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import type { CardReason } from "@/lib/config/types";
import { formatPLN } from "@/lib/domain/money";
import type { OrbitData } from "@/lib/services/orbit";

const stamp = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

/** Audytor: aktywny system (Safety / Next Level), pasek do progu Safety, podgląd drugiego systemu. */
export function PlanCard({ plan }: { plan: NonNullable<OrbitData["plan"]> }) {
  const safety = plan.active === "safety";
  const tierTop = plan.nextTier ? plan.measurements + plan.nextTier.missing : plan.measurements;
  const tierFrom = plan.safety.tier.minMeasurements;
  const progress = plan.nextTier ? (plan.measurements - tierFrom) / Math.max(1, tierTop - tierFrom) : 1;
  return (
    <Card className="border-accent/30">
      <CardTitle hint={`ten miesiąc · ${plan.measurements} pomiarów`}>
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-accent-soft" /> System: {safety ? "Safety" : "Next Level"}
        </span>
      </CardTitle>
      {safety ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs text-muted">Safety w tym miesiącu</div>
              <div className="num text-3xl font-semibold text-earned">{formatPLN(plan.safety.total)}</div>
            </div>
            {plan.safety.hourlyMinimum > 0 && plan.safety.hourlyMinimum >= plan.safety.tierPay && (
              <div className="text-right text-[11px] text-muted">minimum godzinowe umowy zlecenia</div>
            )}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm">
            {plan.nextTier ? (
              <>
                Jeszcze <span className="num text-gold">{plan.nextTier.missing}</span> {plan.nextTier.missing === 1 ? "pomiar" : plan.nextTier.missing < 5 ? "pomiary" : "pomiarów"} do{" "}
                <span className="num text-gold">{formatPLN(plan.nextTier.base)}</span>
              </>
            ) : (
              "Najwyższy próg Safety — każdy kolejny pomiar to dodatkowa stawka."
            )}
          </p>
          <p className="mt-3 rounded-2xl bg-card-2 px-4 py-3 text-xs text-muted">
            Na Next Level zarobiłbyś w tym miesiącu ok. <span className="num text-white">{formatPLN(plan.nextLevelPreview)}</span>. Zmianę na Next Level
            zatwierdza manager.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">
          Płacimy wg tabeli poziomów. Na Safety w tym miesiącu byłoby <span className="num text-white">{formatPLN(plan.safety.total)}</span>.
        </p>
      )}
    </Card>
  );
}

export function RecordingsCard({ rec }: { rec: OrbitData["recordings"] }) {
  return (
    <Card>
      <CardTitle hint={`minimum ${Math.round(rec.min * 100)}%`}>
        <span className="flex items-center gap-2">
          <Mic size={16} className="text-accent-soft" /> Nagrania spotkań
        </span>
      </CardTitle>
      <div className="flex items-end justify-between">
        <div className="num text-3xl font-semibold">
          {rec.recorded}
          <span className="text-lg text-muted">/{rec.held}</span>
        </div>
        <div className={`num text-xl font-semibold ${rec.ok ? "text-earned" : "text-gold"}`}>{Math.round(rec.share * 100)}%</div>
      </div>
      <p className="mt-2 text-xs text-muted">
        {rec.ok ? "Minimum spełnione w tym miesiącu." : `Nagraj jeszcze ${rec.missing} ${rec.missing === 1 ? "spotkanie" : "spotkania"}, żeby dobić do minimum.`}
      </p>
    </Card>
  );
}

export function DisciplineCard({ discipline, labels }: { discipline: OrbitData["discipline"]; labels: Record<CardReason, string> }) {
  const { events, red } = discipline;
  return (
    <Card className={red.red ? "border-danger/40" : events.length ? "border-gold/30" : ""}>
      <CardTitle hint={`${red.counts.yellowCards} żółte · ${red.counts.lateness} spóźn. · ${red.counts.absences} nieob.`}>
        <span className="flex items-center gap-2">
          <TriangleAlert size={16} className={red.red ? "text-danger" : "text-gold"} /> Kartki
        </span>
      </CardTitle>
      {red.red && <p className="mb-3 rounded-2xl bg-danger/10 px-4 py-2 text-sm text-danger">Czerwona kartka — rozmowa z managerem.</p>}
      {events.length === 0 ? (
        <p className="text-sm text-muted">Czysto. Tak trzymaj.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li key={`${e.kind}-${e.at}`} className="flex items-start gap-3 rounded-2xl bg-card-2 px-4 py-2.5 text-sm">
              <span className={`mt-1 h-3 w-2.5 shrink-0 rounded-[2px] ${e.kind === "yellow" ? "bg-gold" : e.kind === "red" ? "bg-danger" : "bg-white/20"}`} />
              <div className="min-w-0">
                <div>
                  {e.kind === "yellow" ? labels[e.reason] : e.kind === "late" ? "Spóźnienie" : e.kind === "absence" ? "Nieobecność" : "Czerwona kartka"}
                  {e.kind === "yellow" && e.automatic && <span className="ml-2 text-[10px] text-muted">automatycznie</span>}
                </div>
                {e.kind === "yellow" && e.note && <div className="text-xs text-muted">{e.note}</div>}
              </div>
              <span className="ml-auto shrink-0 text-xs text-muted">{stamp.format(new Date(e.at))}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
