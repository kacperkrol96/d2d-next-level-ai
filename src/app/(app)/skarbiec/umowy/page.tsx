import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StepsToGreen } from "@/components/trajectory/TrajectoryTimeline";
import { SkarbiecTabs } from "@/components/trajectory/SkarbiecTabs";
import { Card, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { getMyTrajectories } from "@/lib/services/trajectory";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

/** „Moje umowy” — każdy klient z postępem jego umów przez statusy. */
export default async function MojeUmowyPage() {
  const user = await requireRole(["auditor", "sales", "manager"]);
  const views = await getMyTrajectories(user);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Skarbiec" subtitle="Moje umowy — droga każdego klienta przez statusy, na żywo z CRM" />
      <SkarbiecTabs active="umowy" />
      {views.length === 0 && <Card>Brak umów.</Card>}
      <ul className="flex flex-col gap-3">
        {views.map((v) => (
          <li key={v.clientId}>
            <Link href={`/skarbiec/klient/${v.clientId}`} className="card block p-4 transition hover:border-white/15 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{v.clientName}</div>
                  <div className="text-xs text-muted">
                    {v.city}
                    {v.lastChangeAt && <> · ostatnia zmiana {dateFmt.format(new Date(v.lastChangeAt))}</>}
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </div>
              <div className="flex flex-col gap-3">
                {v.trajectories.map((t) => {
                  const total = t.steps.length;
                  const doneCount = t.steps.filter((s) => s.state === "done" || s.state === "skipped" || s.state === "current").length;
                  const greenAt = t.steps.findIndex((s) => s.marker === "green");
                  return (
                    <div key={t.agreementId}>
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate">
                          <span className="text-white/85">{t.scopeLabel ?? "?"}</span> <span className="text-muted">· {t.currentStatus ?? "—"}</span>
                        </span>
                        <StepsToGreen t={t} role={user.track ?? "sales"} />
                      </div>
                      <div className="relative flex h-1.5 gap-0.5">
                        {t.steps.map((s, i) => (
                          <span
                            key={s.status}
                            className={`h-full flex-1 rounded-full ${
                              t.negative && i < doneCount ? "bg-danger/60" : i < doneCount ? (i === doneCount - 1 ? "bg-accent-soft" : "bg-accent-soft/50") : "bg-white/[0.07]"
                            } ${i === greenAt ? "outline outline-1 outline-offset-1 outline-earned/70" : ""}`}
                          />
                        ))}
                        <span className="sr-only">
                          {doneCount} z {total} etapów
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
