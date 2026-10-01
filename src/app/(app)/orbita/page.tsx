import { Award, Car, FileSignature } from "lucide-react";
import { AvatarRing } from "@/components/orbit/AvatarRing";
import { KpiPanel } from "@/components/orbit/KpiPanel";
import { LevelPath } from "@/components/orbit/LevelPath";
import { PeriodEarnings } from "@/components/orbit/PeriodEarnings";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { formatPLN } from "@/lib/domain/money";
import { getOrbitData } from "@/lib/services/orbit";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

export default async function OrbitaPage() {
  const user = await requireRole(["auditor", "sales", "manager"]);
  const data = await getOrbitData(user);

  if (!data) {
    return (
      <>
        <PageHeader title="Orbita" />
        <Card>Brak karty rozwoju dla tego konta.</Card>
      </>
    );
  }

  const periodLabel = `${shortDate.format(new Date(`${data.earnings.period.startDay}T12:00:00Z`))} – ${shortDate.format(new Date(`${data.earnings.period.endDay}T12:00:00Z`))}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Orbita" subtitle="Twoja karta rozwoju — dane testowe" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Poziom i awans */}
        <Card className="relative overflow-hidden lg:col-span-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <AvatarRing level={data.level} progress={data.progress} size={220} />
            <div className="text-center sm:text-left">
              <div className="num text-sm uppercase tracking-[0.25em] text-gold">Poziom {data.level}</div>
              <div className="num mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{data.title}</div>
              <div className="mt-4 text-sm text-muted">
                {data.nextLevel ? (
                  <>
                    Do awansu na <span className="text-white">{data.nextTitle}</span> brakuje:
                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <span className="num rounded-full bg-gold/15 px-3 py-1 text-gold">
                        {data.clientsMissing} {plural(data.clientsMissing, "klient", "klientów", "klientów")}
                      </span>
                      {data.peopleMissing > 0 && (
                        <span className="num rounded-full bg-gold/15 px-3 py-1 text-gold">
                          {data.peopleMissing} {plural(data.peopleMissing, "aktywna osoba", "aktywne osoby", "aktywnych osób")}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  "Najwyższy poziom osiągnięty."
                )}
              </div>
              <div className="mt-3 text-xs text-muted">
                Klienci na koncie: <span className="num text-white">{data.clientsCount}</span> · poziom zdobyty raz zostaje na zawsze
              </div>
            </div>
          </div>
        </Card>

        {/* Zarobki okresu */}
        <Card className="lg:col-span-5">
          <PeriodEarnings
            commission={data.payout.commission}
            multiplier={data.payout.multiplier}
            payout={data.payout.payout}
            greyTotal={data.earnings.greyTotal}
            periodLabel={periodLabel}
          />
        </Card>

        {/* KPI */}
        <Card className="lg:col-span-7 lg:row-span-2">
          <CardTitle hint="przeliczane na żywo">KPI</CardTitle>
          <KpiPanel
            items={data.kpi.items}
            units={data.kpi.units}
            score={data.kpi.score}
            multiplier={data.kpi.multiplier}
            bandLabel={data.kpi.band.label}
            belowMinimum={data.kpi.belowMinimum}
          />
        </Card>

        {/* Stawki */}
        <Card className="lg:col-span-5">
          <CardTitle hint={data.nextLevel ? `teraz → poziom ${data.nextLevel}` : "teraz"}>Stawki</CardTitle>
          <ul className="flex flex-col divide-y divide-line">
            {data.rates.map((r) => (
              <li key={r.label} className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted">{r.label}</span>
                <span className="num flex items-center gap-2">
                  <span>{r.current}</span>
                  {r.next && (
                    <>
                      <span className="text-muted">→</span>
                      <span className="text-gold">{r.next}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Umowa i flota */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <FileSignature size={16} className="text-accent-soft" /> Umowa ze spółką
              </span>
            </CardTitle>
            {user.contract ? (
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Rodzaj</dt>
                  <dd className="mt-1">{user.contract.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Do</dt>
                  <dd className="mt-1">{dateFmt.format(new Date(user.contract.endDate))}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Wariant</dt>
                  <dd className="mt-1">{user.contract.variant}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted">Brak danych umowy — uzupełni admin.</p>
            )}
          </Card>

          {data.fleet && (
            <Card>
              <CardTitle hint="ten miesiąc">
                <span className="flex items-center gap-2">
                  <Car size={16} className="text-accent-soft" /> Flota
                </span>
              </CardTitle>
              <div className="flex items-end justify-between">
                <div className="num text-3xl font-semibold">
                  {Math.min(data.fleet.clients, data.fleet.freeFrom)}
                  <span className="text-lg text-muted">/{data.fleet.freeFrom}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Koszt auta</div>
                  <div className={`num text-xl font-semibold ${data.fleet.cost === 0 ? "text-earned" : ""}`}>{formatPLN(data.fleet.cost)}</div>
                </div>
              </div>
              <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${data.fleet.freeFrom}, 1fr)` }}>
                {Array.from({ length: data.fleet.freeFrom }, (_, i) => (
                  <div key={i} className={`h-2 rounded-full ${i < data.fleet!.clients ? "bg-earned" : "bg-white/[0.06]"}`} />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Koszt potrącany automatycznie w najbliższym rozliczeniu (pozycja „Flota” w Skarbcu).</p>
              {data.fleet.nextBandCost !== null && (
                <p className="mt-3 text-xs text-muted">
                  Jeszcze {data.fleet.clientsToNextBand} → koszt spada do {formatPLN(data.fleet.nextBandCost)}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Ścieżka poziomów */}
        <Card className="lg:col-span-12">
          <CardTitle hint="10 poziomów">Ścieżka</CardTitle>
          <LevelPath steps={data.path} />
        </Card>

        {/* Odznaki */}
        <Card className="lg:col-span-12">
          <CardTitle>Odznaki</CardTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {data.badges.map((b) => (
              <div key={b.key} className={`rounded-2xl border p-4 text-center ${b.earned ? "border-gold/40 bg-gold/[0.06]" : "border-line opacity-40"}`}>
                <Award size={26} className={`mx-auto ${b.earned ? "text-gold" : "text-muted"}`} />
                <div className="mt-2 text-sm">{b.label}</div>
                <div className="mt-1 text-[11px] text-muted">{b.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
