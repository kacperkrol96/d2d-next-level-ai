import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Clock, GraduationCap } from "lucide-react";
import { LessonIcon, lessonKindLabel } from "@/components/academy/LessonIcon";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { getStage } from "@/lib/services/academy";

const timeFmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });

export default async function EtapPage(props: PageProps<"/akademia/[stageId]">) {
  const user = await requireUser();
  const { stageId } = await props.params;
  const { track } = await props.searchParams;
  const view = await getStage(user, stageId, typeof track === "string" ? track : null);
  if (!view) notFound();
  const { status, lessons } = view;
  const q = user.role === "admin" && typeof track === "string" ? `?track=${track}` : "";
  const allDone = lessons.every((l) => l.done);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/akademia${q}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> Akademia
      </Link>
      <header className="mb-6">
        <p className="text-sm text-muted">
          Etap {view.index + 1} z {view.total}
        </p>
        <h1 className="num mt-1 text-3xl font-semibold tracking-tight">{status.stage.title}</h1>
        <p className="mt-2 text-muted">{status.stage.description}</p>
      </header>

      <Card className="mb-4">
        <CardTitle hint={`${status.lessonsDone}/${status.lessonsTotal}`}>Lekcje</CardTitle>
        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link href={`/akademia/${stageId}/lekcja/${l.id}${q}`} className="flex items-center gap-3 rounded-2xl bg-card-2 px-4 py-3 transition hover:bg-white/[0.06]">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${l.done ? "bg-earned/15 text-earned" : "bg-accent/15 text-accent-soft"}`}>
                  {l.done ? <Check size={17} /> : <LessonIcon kind={l.kind} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{l.title}</div>
                  <div className="text-xs text-muted">
                    {lessonKindLabel[l.kind]} · {l.minutes} min
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className={status.state === "passed" ? "border-earned/30" : "border-accent/30"}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold">
              <GraduationCap size={20} />
            </span>
            <div>
              <div className="font-medium">Egzamin etapu</div>
              <div className="text-xs text-muted">
                {status.stage.exam.questions.length} pytań · sprawdzany automatycznie
                {status.bestScore !== null && <> · najlepszy wynik {Math.round(status.bestScore * 100)}%</>}
              </div>
            </div>
          </div>
          {status.examOpen ? (
            <Link
              href={`/akademia/${stageId}/egzamin${q}`}
              className="rounded-full bg-gradient-to-r from-accent to-accent-soft px-5 py-2.5 text-sm font-medium"
            >
              {status.state === "passed" ? "Powtórz egzamin" : "Rozpocznij egzamin"}
            </Link>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs text-muted">
              <Clock size={13} />
              {status.retryAt ? `Kolejna próba o ${timeFmt.format(new Date(status.retryAt))}` : allDone ? "Niedostępny" : "Najpierw ukończ lekcje"}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
