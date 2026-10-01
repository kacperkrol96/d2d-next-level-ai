import Link from "next/link";
import { AlertTriangle, ChevronRight, Radar as RadarIcon } from "lucide-react";
import { StartDayButton } from "@/components/kokpit/StartDayButton";
import { Avatar } from "@/components/orbit/Avatar";
import { Card, CardTitle } from "@/components/ui/Card";
import { DailyGoalCard } from "@/components/kokpit/DailyGoalCard";
import { requireUser } from "@/lib/auth/session";
import { getDataSource } from "@/lib/data";
import { dailyGoals, upcomingBriefings } from "@/lib/domain/rhythm";
import { formatPLN } from "@/lib/domain/money";
import { getOrbitData } from "@/lib/services/orbit";
import { loadContext, offersWaiting } from "@/lib/services/portfolio";
import { getOfficeMoves } from "@/lib/services/trajectory";
import { OfficeMovesList } from "@/components/trajectory/OfficeMovesList";

const dayFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long" });

/** „YYYY-MM-DD HH:MM” w czasie polskim. */
function localNow(date: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return p.slice(0, 16);
}

export default async function KokpitPage() {
  const user = await requireUser();
  const ctx = await loadContext();
  const [orbit, moves] = await Promise.all([getOrbitData(user, ctx.now, ctx), getOfficeMoves(user, 7, ctx)]);
  const firstName = user.name.split(" ")[0];
  const offers = user.track === "sales" && user.crmEmployeeId ? offersWaiting(user.crmEmployeeId, ctx) : [];

  const { config, now } = ctx;
  const log = user.crmEmployeeId ? await getDataSource().workLog(user.crmEmployeeId) : null;
  const goal = user.track ? dailyGoals(user.track, now, config.rhythm, config.timeZone) : null;
  const done: Record<string, number> = log ? { "Umówione leady": log.today.leads, "Odbyte spotkania": log.today.meetings } : {};
  const briefing = upcomingBriefings(now, 3, config.rhythm, config.timeZone).find((b) => `${b.day} ${b.time}` >= localNow(now, config.timeZone));

  const alerts: string[] = [];
  if (orbit?.discipline.red.red) alerts.push("Czerwona kartka — umów rozmowę z managerem (szczegóły w Orbicie).");
  if (orbit?.kpi.belowMinimum) alerts.push("Wynik KPI poniżej minimum — mnożnik 75%, manager dostał alert, żółta kartka zapisana w historii.");
  if (orbit && !orbit.recordings.ok) alerts.push(`Nagrania: ${Math.round(orbit.recordings.share * 100)}% spotkań — minimum ${Math.round(orbit.recordings.min * 100)}%.`);
  const weakKpi = orbit?.kpi.items.filter((k) => k.value !== null && k.level <= 1) ?? [];
  for (const k of weakKpi) alerts.push(`KPI „${k.label}” na poziomie ${k.level === 0 ? "poniżej I" : "I"} — zobacz Orbitę.`);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted">{dayFmt.format(new Date())}</p>
          <h1 className="num mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Cześć, {firstName}</h1>
        </div>
        {orbit && (
          <Link href="/orbita" className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-4">
            <Avatar level={orbit.level} size={40} />
            <span className="num text-sm text-gold">Lvl {orbit.level}</span>
          </Link>
        )}
      </header>

      <StartDayButton />

      {goal && (
        <DailyGoalCard goal={goal} done={done} week={user.track === "auditor" ? config.rhythm.auditor.week : undefined} />
      )}
      {briefing && (
        <p className="-mt-1 px-1 text-xs text-muted">
          Najbliższa odprawa: <span className="text-white">{briefing.title}</span> · {briefing.day === localNow(now, config.timeZone).slice(0, 10) ? "dziś" : briefing.day} {briefing.time} ·{" "}
          {briefing.place} · „Zamknij dzień” do {config.rhythm.closeDayDeadline}
        </p>
      )}

      {orbit && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <div className="text-xs text-muted">Zarobione w okresie</div>
            <div className="num mt-2 text-2xl font-semibold text-earned">{formatPLN(orbit.payout.commission)}</div>
          </Card>
          <Card>
            <div className="text-xs text-muted">Do dopięcia</div>
            <div className="num mt-2 text-2xl font-semibold text-muted">{formatPLN(orbit.earnings.greyTotal)}</div>
          </Card>
          <Card>
            <div className="text-xs text-muted">Mnożnik KPI</div>
            <div className="num mt-2 text-2xl font-semibold text-gold">{Math.round(orbit.kpi.multiplier * 100)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-muted">Do awansu</div>
            <div className="num mt-2 text-2xl font-semibold">{orbit.nextLevel ? `${orbit.clientsMissing} kl.` : "MAX"}</div>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle hint={`${offers.length}`}>
            <span className="flex items-center gap-2">
              <RadarIcon size={16} className="text-accent-soft" /> Oferty
            </span>
          </CardTitle>
          {offers.length === 0 ? (
            <p className="text-sm text-muted">Brak ofert czekających na podpis.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {offers.map((o) => (
                <li key={o.clientId}>
                  <Link href={`/skarbiec/klient/${o.clientId}`} className="flex items-center justify-between rounded-2xl bg-card-2 px-4 py-3">
                    <span>
                      <span className="block text-sm">{o.clientName}</span>
                      <span className="block text-xs text-muted">{o.city}</span>
                    </span>
                    <ChevronRight size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-gold" /> Alerty
            </span>
          </CardTitle>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted">Wszystko w porządku.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {alerts.map((a) => (
                <li key={a} className="rounded-2xl bg-gold/[0.07] px-4 py-3 text-white/90">
                  {a}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {user.track && (
        <Card>
          <CardTitle hint="ostatnie 7 dni">Ruchy biura</CardTitle>
          <OfficeMovesList moves={moves} limit={4} />
        </Card>
      )}
    </div>
  );
}
