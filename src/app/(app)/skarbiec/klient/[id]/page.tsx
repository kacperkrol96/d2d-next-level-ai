import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink } from "lucide-react";
import { TrajectoryTimeline } from "@/components/trajectory/TrajectoryTimeline";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { formatPLN } from "@/lib/domain/money";
import { getClientTrajectory } from "@/lib/services/trajectory";

const stateLabel: Record<string, { text: string; tone: string }> = {
  green: { text: "Prowizja zarobiona", tone: "text-earned" },
  grey: { text: "Prowizja do dopięcia", tone: "text-muted" },
  clawback: { text: "Potrącenie w kolejnym rozliczeniu", tone: "text-danger" },
  cancelled: { text: "Status negatywny", tone: "text-danger" },
  unresolved: { text: "Do wyjaśnienia", tone: "text-gold" },
};

/** Trajektoria klienta: droga każdej jego umowy przez statusy CRM. */
export default async function KlientPage(props: PageProps<"/skarbiec/klient/[id]">) {
  const user = await requireRole(["auditor", "sales", "manager"]);
  const { id } = await props.params;
  const view = await getClientTrajectory(user, id);
  if (!view) notFound();

  const c = view.commission;
  const label = c ? stateLabel[c.state] : null;
  // Najpierw umowy, od których zależy prowizja tej osoby.
  const order = (scope: string | null) => (user.track === "auditor" ? (scope === "audit" ? 0 : 1) : scope === "audit" ? 1 : scope === "rek" ? 2 : 0);
  const trajectories = [...view.trajectories].sort((a, b) => order(a.scope) - order(b.scope));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/skarbiec" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> Skarbiec
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Trajektoria klienta</p>
          <h1 className="num mt-1 text-3xl font-semibold tracking-tight">{view.clientName}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            {view.city}
            <a href={view.crmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
              · CRM <ExternalLink size={12} />
            </a>
          </p>
        </div>
        {c && label && (
          <div className="text-right">
            <div className={`text-xs ${label.tone}`}>{label.text}</div>
            {c.state !== "unresolved" && (
              <div className={`num text-3xl font-semibold ${label.tone}`}>
                {c.amount < 0 ? "−" : ""}
                {formatPLN(Math.abs(c.amount))}
              </div>
            )}
          </div>
        )}
      </header>

      {view.issues.length > 0 && (
        <Card className="mb-4 border-gold/30">
          <div className="flex items-start gap-3 text-sm text-gold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <ul className="flex flex-col gap-1">
              {view.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {trajectories.map((t) => (
          <Card key={t.agreementId}>
            <TrajectoryTimeline t={t} scopeLabel={t.scopeLabel} role={user.track ?? "sales"} />
          </Card>
        ))}
      </div>
    </div>
  );
}
