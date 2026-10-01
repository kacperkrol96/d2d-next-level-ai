import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { LessonIcon, lessonKindLabel } from "@/components/academy/LessonIcon";
import { VideoLesson } from "@/components/academy/VideoLesson";
import { Card, CardTitle } from "@/components/ui/Card";
import { Markdown } from "@/components/ui/Markdown";
import { requireUser } from "@/lib/auth/session";
import { getLesson } from "@/lib/services/academy";
import { markLessonDone } from "../../../actions";

export default async function LekcjaPage(props: PageProps<"/akademia/[stageId]/lekcja/[lessonId]">) {
  const user = await requireUser();
  const { stageId, lessonId } = await props.params;
  const data = await getLesson(user, stageId, lessonId);
  if (!data) notFound();
  const { view, lesson, body, index } = data;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/akademia/${stageId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> {view.status.stage.code} · {view.status.stage.title}
      </Link>
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft">
          <LessonIcon kind={lesson.kind} size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted">
            {lessonKindLabel[lesson.kind]} {index + 1} z {view.lessons.length} · {lesson.minutes} min
          </p>
          <h1 className="num text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>
        </div>
      </header>

      {body.kind === "reading" && (
        <Card>
          <Markdown className="text-[15px] text-white/90">{body.markdown}</Markdown>
        </Card>
      )}

      {body.kind === "contract" &&
        (body.contract ? (
          <Card>
            <p className="mb-2 text-xs text-muted">Wersja {body.contract.version} — ta sama, którą akceptujesz na zwoju przy pierwszym uruchomieniu.</p>
            <Markdown className="text-[15px] text-white/90">{body.contract.body}</Markdown>
          </Card>
        ) : (
          <Card>Brak kontraktu dla tej ścieżki.</Card>
        ))}

      {body.kind === "launchpad" && (
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-sm text-white/85">{body.plan.purpose}</p>
          </Card>
          {body.plan.phases.map((p) => (
            <Card key={p.id}>
              <CardTitle hint={`dni ${p.days} · cel min. ${p.minMeasurements} pomiarów`}>
                {p.id} · {p.name}
              </CardTitle>
              <p className="mb-3 text-xs text-muted">Manager: {p.managerCadence}</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {p.habits.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-earned" /> {h}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Card>
            <CardTitle>Follow-up po umówieniu (7 punktów)</CardTitle>
            <ol className="list-decimal pl-5 text-sm text-white/85">
              {body.plan.followUp.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">Po 90 dniach: {body.plan.after90}</p>
          </Card>
        </div>
      )}

      {body.kind === "video" ? (
        <>
          <VideoLesson stageId={stageId} lessonId={lesson.id} youtubeId={body.youtubeId} watched={body.watched} required={body.required} done={lesson.done} />
          {lesson.kind === "video" && <p className="mt-4 text-sm text-muted">{lesson.summary}</p>}
        </>
      ) : (
        <form action={markLessonDone} className="mt-6">
          <input type="hidden" name="stageId" value={stageId} />
          <input type="hidden" name="lessonId" value={lesson.id} />
          <button className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium shadow-[0_10px_30px_-10px_rgba(142,17,191,0.8)]">
            <Check size={18} /> {lesson.done ? "Ukończone — dalej" : "Przeczytane — dalej"}
          </button>
        </form>
      )}
    </div>
  );
}
