import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { SettlementLines } from "@/components/settlement/SettlementLines";
import { OfficeMovesList } from "@/components/trajectory/OfficeMovesList";
import { SkarbiecTabs } from "@/components/trajectory/SkarbiecTabs";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { formatPLN } from "@/lib/domain/money";
import { getOrbitData, type CommissionEntry } from "@/lib/services/orbit";
import { loadContext } from "@/lib/services/portfolio";
import { getOfficeMoves } from "@/lib/services/trajectory";

const shortDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "UTC" });
const d = (day: string) => shortDate.format(new Date(`${day}T12:00:00Z`));

type Tone = "green" | "grey" | "cancelled" | "clawback" | "unresolved";

const toneClass: Record<Tone, string> = {
  green: "text-earned",
  grey: "text-muted",
  cancelled: "text-danger/70 line-through",
  clawback: "text-danger",
  unresolved: "text-gold",
};

function steps(n: number | null) {
  if (n === null || n === 0) return null;
  return `${n} ${n === 1 ? "krok" : n < 5 ? "kroki" : "kroków"} do zielonej`;
}

function EntryList({ entries, tone }: { entries: CommissionEntry[]; tone: Tone }) {
  if (entries.length === 0) return <p className="text-sm text-muted">Brak pozycji.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li key={`${e.clientId}-${e.kind}-${e.state}`}>
          <Link
            href={`/skarbiec/klient/${e.clientId}`}
            className="flex items-center justify-between gap-4 rounded-2xl bg-card-2 px-4 py-3 transition hover:bg-white/[0.06]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                {e.clientName} <span className="text-xs text-muted">· {e.city}</span>
                {e.kind === "duoTopUp" && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">Dopłata do Duetu</span>}
              </div>
              <div className="truncate text-xs text-muted">
                {tone === "grey" && steps(e.stepsToGreen) ? <span className="text-white/80">{steps(e.stepsToGreen)} · </span> : null}
                {tone === "unresolved" ? e.detail : `${e.status} · ${e.detail}`}
              </div>
              {e.warning && <div className="text-[11px] text-gold/80">{e.warning}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {tone !== "unresolved" && <span className={`num text-lg font-semibold ${toneClass[tone]}`}>{e.amount < 0 ? "−" : ""}{formatPLN(Math.abs(e.amount))}</span>}
              <ChevronRight size={16} className="text-muted" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function SkarbiecPage() {
  const user = await requireRole(["auditor", "sales", "manager"]);
  const ctx = await loadContext();
  const [orbit, moves] = await Promise.all([getOrbitData(user, ctx.now, ctx), getOfficeMoves(user, 7, ctx)]);
  const earnings = orbit?.earnings;
  if (!orbit || !earnings) return <PageHeader title="Skarbiec" subtitle="Brak danych prowizji." />;

  const by = (state: CommissionEntry["state"]) => earnings.entries.filter((e) => e.state === state);
  const green = by("green").sort((a, b) => (b.greenAt ?? "").localeCompare(a.greenAt ?? ""));
  const grey = by("grey").sort((a, b) => (a.stepsToGreen ?? 99) - (b.stepsToGreen ?? 99));
  const clawbacks = by("clawback");
  const unresolved = by("unresolved");
  const cancelled = by("cancelled");
  const p = earnings.period;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Skarbiec" subtitle="Prowizje za klienta — kliknij klienta, by zobaczyć drogę jego umów" />
      <SkarbiecTabs active="prowizje" />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card>
          <div className="text-xs text-muted">Zarobione</div>
          <div className="num mt-2 text-3xl font-semibold text-earned">{formatPLN(earnings.greenTotal)}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted">Do dopięcia</div>
          <div className="num mt-2 text-3xl font-semibold text-muted">{formatPLN(earnings.greyTotal)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle hint={`rozliczenie do ${d(p.settleBy)} · wypłata ${d(p.payoutOn)}`}>
            Okres {d(p.startDay)} – {d(p.endDay)}
          </CardTitle>
          <SettlementLines lines={orbit.settlement.lines} payable={orbit.settlement.payable} carryOver={orbit.settlement.carryOver} fleetMonths={orbit.settlement.fleetMonths} />
        </Card>
        <Card>
          <CardTitle hint="ostatnie 7 dni">Ruchy biura</CardTitle>
          <OfficeMovesList moves={moves} />
        </Card>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {unresolved.length > 0 && (
          <Card className="border-gold/30">
            <CardTitle hint={`${unresolved.length}`}>
              <span className="flex items-center gap-2 text-gold">
                <AlertTriangle size={16} /> Do wyjaśnienia
              </span>
            </CardTitle>
            <p className="mb-3 text-xs text-muted">Nie liczymy prowizji na zgadywanych danych — biuro wyjaśnia te umowy w Mennicy.</p>
            <EntryList entries={unresolved} tone="unresolved" />
          </Card>
        )}
        <Card>
          <CardTitle hint={`${grey.length}`}>Do dopięcia</CardTitle>
          <EntryList entries={grey} tone="grey" />
        </Card>
        <Card>
          <CardTitle hint={`${green.length}`}>Zarobione</CardTitle>
          <EntryList entries={green} tone="green" />
        </Card>
        {clawbacks.length > 0 && (
          <Card>
            <CardTitle hint="w kolejnym rozliczeniu">Potrącenia</CardTitle>
            <EntryList entries={clawbacks} tone="clawback" />
          </Card>
        )}
        {cancelled.length > 0 && (
          <Card>
            <CardTitle hint={`${cancelled.length}`}>Statusy negatywne</CardTitle>
            <EntryList entries={cancelled} tone="cancelled" />
          </Card>
        )}
      </div>
    </div>
  );
}
