import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Hourglass, PlayCircle } from "lucide-react";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/users";
import { formById } from "@/lib/academy/forms";
import { getTeamAcademy } from "@/lib/services/academy";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

export default async function ZespolAkademiaPage(props: PageProps<"/akademia/zespol">) {
  const user = await requireRole(["manager", "admin"]);
  const team = await getTeamAcademy(user);
  const { ok } = await props.searchParams;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/akademia" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={14} /> Akademia
      </Link>
      <PageHeader title="Akademia — zespół" subtitle="Oceny egzaminów, karty obserwacji i rejestr obejrzanych filmów" />
      {typeof ok === "string" && <p className="mb-4 rounded-2xl bg-earned/10 px-4 py-3 text-sm text-earned">{ok}</p>}
      {team.length === 0 && <Card>Brak osób w zespole.</Card>}

      <div className="flex flex-col gap-4">
        {team.map((m) => {
          const watched = m.videos.filter((v) => v.watched >= m.threshold).length;
          return (
            <Card key={m.person.id}>
              <CardTitle hint={`${roleLabels[m.person.role]} · ${Math.round(m.progress * 100)}% ścieżki`}>
                {m.person.name} {m.current && <span className="ml-2 text-sm text-muted">· etap {m.current.stage.code}</span>}
              </CardTitle>

              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-accent-soft" style={{ width: `${Math.round(m.progress * 100)}%` }} />
              </div>

              {(m.pendingReviews.length > 0 || m.formsToFill.length > 0) && (
                <div className="mb-3 flex flex-col gap-2">
                  {m.pendingReviews.map((a) => (
                    <Link
                      key={a.id}
                      href={`/akademia/zespol/${m.person.id}/ocena/${a.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Hourglass size={15} className="text-gold" /> Oceń egzamin {a.examId.toUpperCase()} · wysłany {dateFmt.format(new Date(a.at))}
                      </span>
                      <span className="text-xs text-gold">Oceń →</span>
                    </Link>
                  ))}
                  {m.formsToFill.map((f) => (
                    <Link
                      key={f.formId}
                      href={`/akademia/zespol/${m.person.id}/karta/${f.formId}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/[0.08] px-4 py-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <ClipboardCheck size={15} className="text-accent-soft" /> {f.label}
                        {f.state === "needs_more" && <span className="text-xs text-muted">(powtórka)</span>}
                      </span>
                      <span className="text-xs text-accent-soft">Wypełnij →</span>
                    </Link>
                  ))}
                </div>
              )}

              <details className="rounded-2xl bg-card-2 px-4 py-3">
                <summary className="flex cursor-pointer items-center gap-2 text-sm">
                  <PlayCircle size={15} className="text-accent-soft" /> Filmy: {watched}/{m.videos.length} obejrzanych (≥ {Math.round(m.threshold * 100)}%)
                </summary>
                <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {m.videos.map((v) => (
                    <li key={v.lessonId} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-white/80">{v.title}</span>
                      <span className={`num shrink-0 ${v.watched >= m.threshold ? "text-earned" : v.watched > 0 ? "text-gold" : "text-muted"}`}>{Math.round(v.watched * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {m.statuses.map((s) => (
                  <span
                    key={s.stage.id}
                    className={`rounded-full px-3 py-1 ${s.state === "passed" ? "bg-earned/15 text-earned" : s.state === "available" ? "bg-accent/15 text-accent-soft" : "bg-white/[0.05] text-muted"}`}
                  >
                    {s.stage.code} {s.state === "passed" ? "✓" : ""}
                  </span>
                ))}
                {m.current?.gates
                  .filter((g) => g.gate.kind === "form" && g.lastForm)
                  .map((g) => (
                    <span key={g.gate.kind === "form" ? g.gate.formId : ""} className="rounded-full bg-white/[0.05] px-3 py-1 text-muted">
                      {g.gate.kind === "form" ? formById(g.gate.formId)?.title : ""}: {g.lastForm?.decision ?? "wypełniona"}
                    </span>
                  ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
