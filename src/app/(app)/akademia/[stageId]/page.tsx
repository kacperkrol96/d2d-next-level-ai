import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, ClipboardCheck, Clock, GraduationCap, Hourglass } from "lucide-react";
import { LessonIcon, lessonKindLabel } from "@/components/academy/LessonIcon";
import { Card, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import type { GateStatus } from "@/lib/domain/academy";
import { getStage, type StageView } from "@/lib/services/academy";

const timeFmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

function GateCard({ g, stageId, exam }: { g: GateStatus; stageId: string; exam?: StageView["exams"][string] }) {
  const passed = g.state === "passed";
  if (g.gate.kind === "exam") {
    const last = g.lastAttempt;
    return (
      <Card className={passed ? "border-earned/30" : "border-accent/30"}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${passed ? "bg-earned/15 text-earned" : "bg-gold/15 text-gold"}`}>
              {passed ? <Check size={20} /> : <GraduationCap size={20} />}
            </span>
            <div>
              <div className="font-medium">
                {exam?.title ?? "Egzamin"}
                {exam?.trial && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] text-gold">egzamin próbny</span>}
              </div>
              <div className="text-xs text-muted">
                próg {exam?.passPoints}/{exam?.maxPoints} pkt · pytania zamknięte sprawdza aplikacja, otwarte — manager
                {g.bestPoints !== null && <> · najlepszy wynik {g.bestPoints} pkt</>}
              </div>
            </div>
          </div>
          {g.state === "open" ? (
            <Link href={`/akademia/${stageId}/egzamin`} className="rounded-full bg-gradient-to-r from-accent to-accent-soft px-5 py-2.5 text-sm font-medium">
              {last && last.passed === false ? "Podejdź ponownie" : "Rozpocznij egzamin"}
            </Link>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs text-muted">
              {g.state === "review" ? <Hourglass size={13} /> : <Clock size={13} />}
              {g.state === "passed"
                ? "Zaliczony"
                : g.state === "review"
                  ? `Wysłany ${last ? dateFmt.format(new Date(last.at)) : ""} — czeka na ocenę managera`
                  : g.state === "cooldown" && g.retryAt
                    ? `Kolejna próba o ${timeFmt.format(new Date(g.retryAt))}`
                    : "Najpierw ukończ lekcje"}
            </span>
          )}
        </div>
        {exam?.trial && (
          <p className="mt-3 text-xs text-gold/90">
            Tryb próbny: wynik nie odblokowuje etapu, dopóki Zarząd nie zweryfikuje kluczy odpowiedzi.
            {exam.lastTrial && exam.lastTrial.points !== null && ` Ostatnia próba: ${exam.lastTrial.points} pkt.`}
            {exam.lastTrial && exam.lastTrial.passed === null && " Ostatnia próba czeka na ocenę managera."}
          </p>
        )}
        {last?.review?.comment && <p className="mt-3 rounded-2xl bg-card-2 px-4 py-3 text-sm text-white/85">Komentarz managera: {last.review.comment}</p>}
      </Card>
    );
  }
  return (
    <Card className={passed ? "border-earned/30" : ""}>
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${passed ? "bg-earned/15 text-earned" : "bg-white/[0.06] text-muted"}`}>
          {passed ? <Check size={20} /> : <ClipboardCheck size={20} />}
        </span>
        <div>
          <div className="font-medium">{g.gate.label}</div>
          <div className="text-xs text-muted">
            {g.state === "passed"
              ? `Wypełniona ${g.lastForm ? dateFmt.format(new Date(g.lastForm.at)) : ""}${g.lastForm?.decision ? ` · ${g.lastForm.decision}` : ""}`
              : g.state === "needs_more"
                ? `Decyzja managera: ${g.lastForm?.decision} — manager zaplanuje powtórkę`
                : "Wypełnia manager w aplikacji po obserwacji"}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default async function EtapPage(props: PageProps<"/akademia/[stageId]">) {
  const user = await requireUser();
  const { stageId } = await props.params;
  const view = await getStage(user, stageId);
  if (!view) notFound();
  const { status, lessons } = view;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/akademia?track=${view.track}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> Akademia
      </Link>
      <header className="mb-6">
        <p className="num text-sm text-gold">{status.stage.code}</p>
        <h1 className="num mt-1 text-3xl font-semibold tracking-tight">{status.stage.title}</h1>
        <p className="mt-2 text-muted">{status.stage.description}</p>
      </header>

      {lessons.length > 0 && (
        <Card className="mb-4">
          <CardTitle hint={`${status.lessonsDone}/${status.lessonsTotal}`}>Lekcje</CardTitle>
          <ul className="flex flex-col gap-2">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link href={`/akademia/${stageId}/lekcja/${l.id}`} className="flex items-center gap-3 rounded-2xl bg-card-2 px-4 py-3 transition hover:bg-white/[0.06]">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${l.done ? "bg-earned/15 text-earned" : "bg-accent/15 text-accent-soft"}`}>
                    {l.done ? <Check size={17} /> : <LessonIcon kind={l.kind} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{l.title}</div>
                    <div className="text-xs text-muted">
                      {lessonKindLabel[l.kind]} · {l.minutes} min{l.watched !== null && l.watched > 0 && !l.done ? ` · obejrzane ${Math.round(l.watched * 100)}%` : ""}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {status.gates.map((g) => (
          <GateCard key={g.gate.kind === "exam" ? g.gate.examId : g.gate.formId} g={g} stageId={stageId} exam={g.gate.kind === "exam" ? view.exams[g.gate.examId] : undefined} />
        ))}
      </div>
    </div>
  );
}
