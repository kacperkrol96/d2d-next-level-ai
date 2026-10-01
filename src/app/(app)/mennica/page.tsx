import { AlertTriangle, CalendarClock } from "lucide-react";
import { SettlementLines } from "@/components/settlement/SettlementLines";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/users";
import { getDataSource } from "@/lib/data";
import { daysUntil, previousPeriod, settlementPeriodFor, type SettlementPeriod } from "@/lib/domain/settlement";
import { getOrbitData } from "@/lib/services/orbit";
import { allIssues, loadContext } from "@/lib/services/portfolio";

const shortDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "UTC" });
const d = (day: string) => shortDate.format(new Date(`${day}T12:00:00Z`));

const issueLabel: Record<string, string> = {
  missing_suffix: "Brak końcówki zakresu w numerze",
  unknown_suffix: "Nierozpoznana końcówka numeru",
  unknown_status: "Status spoza tabeli statusów",
  no_sales_person: "Brak handlowca",
  unknown_initials: "Nieznane inicjały w numerze",
  no_auditor: "Brak audytora na umowie /A",
};

function Countdown({ title, period, now, timeZone }: { title: string; period: SettlementPeriod; now: Date; timeZone: string }) {
  const settle = daysUntil(now, period.settleBy, timeZone);
  const payout = daysUntil(now, period.payoutOn, timeZone);
  const days = (n: number) => (n === 0 ? "dziś" : n < 0 ? `${-n} dni po terminie` : `za ${n} ${n === 1 ? "dzień" : "dni"}`);
  return (
    <Card>
      <div className="flex items-center gap-2 text-xs text-muted">
        <CalendarClock size={14} /> {title}
      </div>
      <div className="num mt-2 text-xl font-semibold">
        {d(period.startDay)} – {d(period.endDay)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card-2 p-3">
          <div className="text-xs text-muted">Rozliczenie / akceptacja do {d(period.settleBy)}</div>
          <div className={`num mt-1 text-lg font-semibold ${settle < 0 ? "text-danger" : settle <= 2 ? "text-gold" : ""}`}>{days(settle)}</div>
        </div>
        <div className="rounded-2xl bg-card-2 p-3">
          <div className="text-xs text-muted">Wypłata {d(period.payoutOn)}</div>
          <div className="num mt-1 text-lg font-semibold">{days(payout)}</div>
        </div>
      </div>
    </Card>
  );
}

export default async function MennicaPage() {
  await requireRole(["admin"]);
  const ctx = await loadContext();
  const { config, now } = ctx;
  const current = settlementPeriodFor(now, config.settlementPeriods, config.timeZone);
  const closing = previousPeriod(current, config.settlementPeriods, config.timeZone);
  const issues = allIssues(ctx);
  const people = (await getDataSource().listUsers()).filter((u) => u.track);
  const previews = await Promise.all(people.map(async (u) => ({ user: u, orbit: await getOrbitData(u, now, ctx) })));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Mennica" subtitle="Rozliczenia zarządu — dane testowe" />

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Countdown title="Okres do rozliczenia" period={closing} now={now} timeZone={config.timeZone} />
        <Countdown title="Bieżący okres" period={current} now={now} timeZone={config.timeZone} />
      </div>

      <Card className="mb-4 border-gold/30">
        <CardTitle hint={`${issues.length}`}>
          <span className="flex items-center gap-2 text-gold">
            <AlertTriangle size={16} /> Do wyjaśnienia
          </span>
        </CardTitle>
        <p className="mb-3 text-xs text-muted">
          Prowizje tych klientów nie są liczone, dopóki dane nie zostaną poprawione w CRM albo w tabelach przypisań (panel admina).
        </p>
        {issues.length === 0 ? (
          <p className="text-sm text-muted">Kolejka pusta.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {issues.map((i) => (
              <li key={`${i.clientId}-${i.agreementId}-${i.kind}`} className="rounded-2xl bg-card-2 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span>{issueLabel[i.kind]}</span>
                  <span className="text-xs text-muted">blokuje: {i.blocks.map((b) => (b === "sales" ? "handlowca" : "audytora")).join(", ")}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {i.clientName} · {i.message}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {previews.map(({ user, orbit }) =>
          orbit ? (
            <Card key={user.id}>
              <CardTitle hint={`${roleLabels[user.role]} · ${user.contract?.type ?? "—"}`}>{user.name}</CardTitle>
              <SettlementLines lines={orbit.settlement.lines} payable={orbit.settlement.payable} carryOver={orbit.settlement.carryOver} fleetMonths={orbit.settlement.fleetMonths} />
              {orbit.yellowCards.length > 0 && (
                <p className="mt-3 rounded-2xl bg-gold/[0.08] px-4 py-2 text-xs text-gold">Żółte kartki w historii: {orbit.yellowCards.length}</p>
              )}
            </Card>
          ) : null,
        )}
      </div>
      <p className="mt-4 text-xs text-muted">Akceptacje i korekty z powodem oraz historią zmian — w etapie Mennicy (na danych testowych).</p>
    </div>
  );
}
