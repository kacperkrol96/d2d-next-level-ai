import { ExternalLink } from "lucide-react";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { formatPLN } from "@/lib/domain/money";
import { getEarnings, type CommissionEntry } from "@/lib/services/orbit";

function EntryList({ entries, tone }: { entries: CommissionEntry[]; tone: "green" | "grey" | "cancelled" }) {
  if (entries.length === 0) return <p className="text-sm text-muted">Brak pozycji.</p>;
  const color = tone === "green" ? "text-earned" : tone === "grey" ? "text-muted" : "text-danger/70 line-through";
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li key={e.clientId} className="flex items-center justify-between gap-4 rounded-2xl bg-card-2 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              {e.clientName} <span className="text-xs text-muted">· {e.city}</span>
              <a href={e.crmUrl} target="_blank" rel="noreferrer" className="text-muted hover:text-white" aria-label="Otwórz w CRM">
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="truncate text-xs text-muted">
              {e.status} · {e.detail}
            </div>
          </div>
          <div className={`num shrink-0 text-lg font-semibold ${color}`}>{formatPLN(e.amount)}</div>
        </li>
      ))}
    </ul>
  );
}

export default async function SkarbiecPage() {
  const user = await requireRole(["auditor", "sales", "manager"]);
  const earnings = await getEarnings(user);
  if (!earnings) return <PageHeader title="Skarbiec" subtitle="Brak danych prowizji." />;

  const green = earnings.entries.filter((e) => e.state === "green");
  const grey = earnings.entries.filter((e) => e.state === "grey");
  const cancelled = earnings.entries.filter((e) => e.state === "cancelled");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Skarbiec" subtitle="Prowizje za klienta — zielone zarobione, szare do dopięcia" />
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
      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle hint={`${green.length}`}>Zarobione</CardTitle>
          <EntryList entries={green} tone="green" />
        </Card>
        <Card>
          <CardTitle hint={`${grey.length}`}>Do dopięcia</CardTitle>
          <EntryList entries={grey} tone="grey" />
        </Card>
        {cancelled.length > 0 && (
          <Card>
            <CardTitle hint={`${cancelled.length}`}>Rezygnacje</CardTitle>
            <EntryList entries={cancelled} tone="cancelled" />
          </Card>
        )}
        <Card>
          <CardTitle>Rozliczenia do akceptacji</CardTitle>
          <p className="text-sm text-muted">Rozliczenia co 2 tygodnie pojawią się tutaj w Etapie 3 (po akceptacji zarządu w Mennicy).</p>
        </Card>
      </div>
    </div>
  );
}
