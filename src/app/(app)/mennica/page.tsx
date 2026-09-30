import { Sparkles } from "lucide-react";
import { SettlementLines } from "@/components/settlement/SettlementLines";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { demoUsers, roleLabels } from "@/lib/auth/users";
import { getOrbitData } from "@/lib/services/orbit";

export default async function MennicaPage() {
  await requireRole(["admin"]);
  const people = demoUsers.filter((u) => u.track);
  const previews = await Promise.all(people.map(async (u) => ({ user: u, orbit: await getOrbitData(u) })));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Mennica" subtitle="Rozliczenia zarządu — podgląd bieżącego okresu (dane testowe)" />
      <Card className="mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent-soft">
          <Sparkles size={13} /> Etap 3
        </span>
        <p className="mt-3 text-sm text-white/85">
          Akceptacja i korekty z powodem, historia zmian, dane do faktury (B2B) i rachunek PDF (umowa zlecenia) dojdą w Etapie 3. Poniżej podgląd
          rozliczeń — koszt auta widoczny jako osobna pozycja „Flota”.
        </p>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {previews.map(({ user, orbit }) =>
          orbit ? (
            <Card key={user.id}>
              <CardTitle hint={`${roleLabels[user.role]} · ${user.contract?.type ?? "—"}`}>{user.name}</CardTitle>
              <SettlementLines
                lines={orbit.settlement.lines}
                payable={orbit.settlement.payable}
                carryOver={orbit.settlement.carryOver}
                fleetMonths={orbit.settlement.fleetMonths}
              />
              {orbit.yellowCards.length > 0 && (
                <p className="mt-3 rounded-2xl bg-gold/[0.08] px-4 py-2 text-xs text-gold">Żółte kartki w historii: {orbit.yellowCards.length}</p>
              )}
            </Card>
          ) : null,
        )}
      </div>
    </div>
  );
}
