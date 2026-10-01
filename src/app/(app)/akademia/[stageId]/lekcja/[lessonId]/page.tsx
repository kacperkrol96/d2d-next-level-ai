import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, PlayCircle } from "lucide-react";
import { ObjectionCards } from "@/components/academy/ObjectionCards";
import { PracticeQuiz } from "@/components/academy/PracticeQuiz";
import { LessonIcon, lessonKindLabel } from "@/components/academy/LessonIcon";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { getStage } from "@/lib/services/academy";
import { markLessonDone } from "../../../actions";

export default async function LekcjaPage(props: PageProps<"/akademia/[stageId]/lekcja/[lessonId]">) {
  const user = await requireUser();
  const { stageId, lessonId } = await props.params;
  const { track } = await props.searchParams;
  const view = await getStage(user, stageId, typeof track === "string" ? track : null);
  const lesson = view?.lessons.find((l) => l.id === lessonId);
  if (!view || !lesson) notFound();
  const q = user.role === "admin" && typeof track === "string" ? `?track=${track}` : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/akademia/${stageId}${q}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> {view.status.stage.title}
      </Link>
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft">
          <LessonIcon kind={lesson.kind} size={20} />
        </span>
        <div>
          <p className="text-xs text-muted">
            {lessonKindLabel[lesson.kind]} · {lesson.minutes} min
          </p>
          <h1 className="num text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>
        </div>
      </header>

      {lesson.kind === "script" && (
        <div className="flex flex-col gap-4">
          {lesson.sections.map((s) => (
            <Card key={s.heading}>
              <h2 className="num mb-2 text-lg font-semibold text-gold">{s.heading}</h2>
              <p className="leading-relaxed text-white/85">{s.text}</p>
            </Card>
          ))}
        </div>
      )}

      {lesson.kind === "objections" && <ObjectionCards items={lesson.items} />}

      {lesson.kind === "video" && (
        <Card className="overflow-hidden p-0 sm:p-0">
          {lesson.url ? (
            <iframe src={lesson.url} title={lesson.title} className="aspect-video w-full" allow="fullscreen; picture-in-picture" />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-accent/20 to-bg text-center">
              <PlayCircle size={56} strokeWidth={1.25} className="text-white/70" />
              <span className="text-sm text-muted">Film zostanie dodany przez NLE</span>
            </div>
          )}
          <p className="p-5 text-sm text-white/85 sm:p-6">{lesson.summary}</p>
        </Card>
      )}

      {lesson.kind === "quiz" && <PracticeQuiz questions={lesson.questions} />}

      <form action={markLessonDone} className="mt-6">
        <input type="hidden" name="stageId" value={stageId} />
        <input type="hidden" name="lessonId" value={lesson.id} />
        <button className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium shadow-[0_10px_30px_-10px_rgba(142,17,191,0.8)]">
          <Check size={18} /> {lesson.done ? "Ukończone — dalej" : "Ukończyłem — dalej"}
        </button>
      </form>
    </div>
  );
}
