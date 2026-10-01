import Link from "next/link";
import { Rocket } from "lucide-react";
import { ConstellationView, type StarData } from "@/components/constellation/ConstellationView";
import { MoneyCounter } from "@/components/motion/MoneyCounter";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { formatPLN } from "@/lib/domain/money";
import { getConstellation } from "@/lib/services/structure";

const monthFmt = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" });
const roleLabel = { sales: "Handlowiec", auditor: "Audytor" } as const;
const kindLabel = { base: "prowizja", duoTopUp: "dopłata do Duetu", surchargeTopUp: "dopłata nadmarży" } as const;

export default async function KonstelacjaPage(props: PageProps<"/konstelacja">) {
  const user = await requireRole(["sales", "manager", "admin"]);
  const { osoba } = await props.searchParams;
  const data = await getConstellation(user, typeof osoba === "string" ? osoba : null);

  if (!data) {
    return (
      <>
        <PageHeader title="Konstelacja" />
        <Card>Brak struktury dla tego konta.</Card>
      </>
    );
  }

  const stars: StarData[] = [data.center, ...data.nodes].map((n) => ({
    id: n.employee.id,
    name: n.employee.name,
    roleLabel: roleLabel[n.employee.role === "auditor" ? "auditor" : "sales"],
    parentId: n.parentId,
    depth: n.depth,
    level: n.level,
    levelTitle: n.levelTitle,
    clients: n.clients,
    activity: n.activity,
    alert: n.alert,
    kpiScore: n.kpiScore,
    earnedForManager: n.earnedForManager,
    entries: n.monthEntries.map((e) => ({ clientName: e.clientName, amount: e.amount, label: kindLabel[e.kind] })),
  }));
  const [y, m] = data.month.split("-").map(Number);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Konstelacja" subtitle={`Struktura: ${data.center.employee.name}`} />

      <Card className="relative mb-4 overflow-hidden text-center">
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-gold">
            {user.role === "admin" ? `Zarobek ze struktury — ${data.center.employee.name}` : "Twój zarobek ze struktury"} · {monthFmt.format(new Date(Date.UTC(y, m - 1, 15)))}
          </div>
          <MoneyCounter value={data.total} className="num mt-2 block text-5xl font-semibold text-earned sm:text-6xl" />
          <div className="mt-2 text-sm text-muted">
            dyferencja {formatPLN(data.differential)} + opieka nad zespołem {formatPLN(data.teamCare)}
            {data.teamCareMissing && <span className="text-gold"> (kwota opieki do uzupełnienia przez Zarząd)</span>}
          </div>
          <div className="mt-1 text-xs text-muted">
            {monthFmt.format(new Date(`${data.previousMonth}-15T12:00:00Z`))}: <span className="num text-white">{formatPLN(data.previousTotal)}</span>
          </div>
        </div>
      </Card>

      {data.nodes.length === 0 ? (
        <Card>Nie masz jeszcze nikogo w strukturze — pierwsza osoba w zespole zapali tu pierwszą gwiazdę.</Card>
      ) : (
        <ConstellationView stars={stars} managerName={data.center.employee.name} />
      )}

      {data.squadrons.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {data.squadrons.map((s) => (
            <Card key={s.squadron.id} className={s.active ? "border-accent/30" : "opacity-70"}>
              <CardTitle hint={s.active ? "aktywna" : "wyłączona — historia zostaje"}>
                <span className="flex items-center gap-2">
                  <Rocket size={16} className="text-accent-soft" /> {s.squadron.name} · lider {s.squadron.leaderName}
                </span>
              </CardTitle>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-card-2 p-3">
                  <div className="text-xs text-muted">Klienci z zieloną prowizją w tym miesiącu</div>
                  <div className="num mt-1 text-2xl font-semibold">{s.month.clients}</div>
                </div>
                <div className="rounded-2xl bg-card-2 p-3">
                  <div className="text-xs text-muted">Dla lidera wg pakietu zasad</div>
                  <div className="num mt-1 text-2xl font-semibold text-earned">{formatPLN(s.month.amount)}</div>
                </div>
              </div>
              <p className="mb-2 text-xs text-muted">
                Prefiks „{s.squadron.prefix}” · {formatPLN(s.squadron.rules.perClient)} za klienta · {s.squadron.rules.note}
              </p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {s.clients.map((c) => (
                  <li key={c.id}>
                    <Link href={`/skarbiec/klient/${c.id}`} className="flex justify-between rounded-xl bg-card-2 px-3 py-2">
                      <span>
                        {c.name} <span className="text-xs text-muted">· {c.city}</span>
                      </span>
                      <span className={`text-xs ${c.greenAt ? "text-earned" : "text-muted"}`}>{c.greenAt ? "zielona" : "w toku"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <p className="text-xs text-muted">Eskadry włącza i wyłącza Zarząd w Mennicy → Ustawienia.</p>
        </div>
      )}
    </div>
  );
}
