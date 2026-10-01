import Link from "next/link";
import { Check, ChevronRight, Lock, Trophy, Users } from "lucide-react";
import { ProgressCircle } from "@/components/academy/ProgressCircle";
import { Card, PageHeader } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import type { StageStatus } from "@/lib/domain/academy";
import { getAcademy, trackLabels } from "@/lib/services/academy";

function stageNote(s: StageStatus): { text: string; tone: string } {
  if (s.state === "passed") return { text: "Zaliczony", tone: "text-earned" };
  if (s.state === "locked") return { text: "Zablokowany", tone: "text-muted" };
  if (s.gates.some((g) => g.state === "review")) return { text: "Czeka na ocenę", tone: "text-gold" };
  if (s.lessonsDone === s.lessonsTotal && s.gates.some((g) => g.state === "waiting")) return { text: "Czeka na managera", tone: "text-gold" };
  return { text: "W toku", tone: "text-accent-soft" };
}

export default async function AkademiaPage(props: PageProps<"/akademia">) {
  const user = await requireUser();
  const { track: requested } = await props.searchParams;
  const academy = await getAcademy(user, typeof requested === "string" ? requested : null);
  const coach = user.role === "manager" || user.role === "admin";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Akademia" subtitle={`${trackLabels[academy.track]} — kolejny etap otwiera się po zaliczeniu poprzedniego`} />
        {coach && (
          <Link href="/akademia/zespol" className="mt-1 flex shrink-0 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm">
            <Users size={15} /> Zespół
          </Link>
        )}
      </div>

      {academy.tracks.length > 1 && (
        <div className="mb-6 flex max-w-md gap-1 rounded-full border border-line bg-card p-1">
          {academy.tracks.map((t) => (
            <Link
              key={t}
              href={`/akademia?track=${t}`}
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm ${academy.track === t ? "bg-card-2 text-white" : "text-muted"}`}
            >
              {t === "field" ? "Teren D1–D4" : "Manager"}
            </Link>
          ))}
        </div>
      )}

      <Card className="relative mb-6 overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row">
          <ProgressCircle value={academy.progress} />
          <div className="flex-1 text-center sm:text-left">
            {academy.next ? (
              <>
                <div className="text-xs uppercase tracking-[0.25em] text-gold">Następny krok</div>
                <div className="num mt-1 text-2xl font-semibold">{academy.next.label}</div>
                <div className="mt-1 text-sm text-muted">{academy.next.stageTitle}</div>
                {academy.next.href && (
                  <Link
                    href={academy.next.href}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-soft px-6 py-3 text-sm font-medium shadow-[0_10px_30px_-10px_rgba(142,17,191,0.8)]"
                  >
                    Kontynuuj <ChevronRight size={16} />
                  </Link>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-gold sm:justify-start">
                  <Trophy size={18} /> Ścieżka ukończona
                </div>
                <p className="mt-2 text-sm text-muted">Wszystkie etapy zaliczone. Wracaj do lekcji, kiedy chcesz.</p>
              </>
            )}
          </div>
        </div>
      </Card>

      <ol className="relative flex flex-col gap-3">
        {academy.statuses.map((s) => {
          const locked = s.state === "locked";
          const passed = s.state === "passed";
          const note = stageNote(s);
          const total = s.lessonsTotal + s.gates.length;
          const done = s.lessonsDone + s.gates.filter((g) => g.state === "passed").length;
          const body = (
            <div className={`card flex items-center gap-4 p-4 transition sm:p-5 ${locked ? "opacity-45" : "hover:border-white/15"} ${s.state === "available" ? "border-accent/40 shadow-[0_0_40px_-12px_rgba(142,17,191,0.6)]" : ""}`}>
              <div
                className={`num flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                  passed ? "bg-earned/15 text-earned" : locked ? "bg-white/5 text-muted" : "bg-accent/20 text-accent-soft"
                }`}
              >
                {passed ? <Check size={22} /> : locked ? <Lock size={18} /> : s.stage.code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  <span className="text-muted">{s.stage.code} · </span>
                  {s.stage.title}
                </div>
                <div className="truncate text-xs text-muted">{s.stage.description}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-accent-soft" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                  </div>
                  <span className="num shrink-0 text-[11px] text-muted">
                    {done}/{total}
                  </span>
                </div>
              </div>
              <div className={`shrink-0 text-right text-xs ${note.tone}`}>{note.text}</div>
            </div>
          );
          return <li key={s.stage.id}>{locked ? body : <Link href={`/akademia/${s.stage.id}`}>{body}</Link>}</li>;
        })}
      </ol>
    </div>
  );
}
