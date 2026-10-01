import "server-only";
import type { AcademyStage, AcademyTrack, Lesson } from "@/lib/academy/types";
import type { AppUser } from "@/lib/auth/users";
import { getDataSource } from "@/lib/data";
import { gradeExam, stageStatuses, trackProgress, type ExamResult, type StageStatus } from "@/lib/domain/academy";

export const trackLabels: Record<AcademyTrack, string> = { sales: "Ścieżka handlowca", auditor: "Ścieżka audytora" };

/** Ścieżka osoby: audytor → audytora; handlowiec i manager → handlowca; zarząd wybiera. */
export function trackFor(user: AppUser, requested?: string | null): AcademyTrack {
  if (user.role === "admin") return requested === "auditor" ? "auditor" : "sales";
  return user.track === "auditor" ? "auditor" : "sales";
}

export interface NextStep {
  stageId: string;
  stageTitle: string;
  href: string;
  label: string;
}

export interface AcademyOverview {
  track: AcademyTrack;
  statuses: StageStatus[];
  progress: number;
  next: NextStep | null;
}

function nextStep(statuses: StageStatus[], doneLessons: Set<string>): NextStep | null {
  const current = statuses.find((s) => s.state === "available");
  if (!current) return null;
  const lesson = current.stage.lessons.find((l) => !doneLessons.has(l.id));
  if (lesson) return { stageId: current.stage.id, stageTitle: current.stage.title, href: `/akademia/${current.stage.id}/lekcja/${lesson.id}`, label: lesson.title };
  return { stageId: current.stage.id, stageTitle: current.stage.title, href: `/akademia/${current.stage.id}/egzamin`, label: "Egzamin" };
}

export async function getAcademy(user: AppUser, requestedTrack?: string | null, now = new Date()): Promise<AcademyOverview> {
  const source = getDataSource();
  const track = trackFor(user, requestedTrack);
  const [stages, progress, config] = await Promise.all([source.academyStages(track), source.academyProgress(user.id), source.getConfig()]);
  const statuses = stageStatuses(stages, progress, config.academy, now);
  return { track, statuses, progress: trackProgress(statuses), next: nextStep(statuses, new Set(progress.lessonsDone)) };
}

export interface StageView {
  status: StageStatus;
  lessons: (Lesson & { done: boolean })[];
  index: number;
  total: number;
}

/** Etap tylko, gdy nie jest zablokowany (inaczej null). */
export async function getStage(user: AppUser, stageId: string, requestedTrack?: string | null): Promise<StageView | null> {
  const overview = await getAcademy(user, requestedTrack);
  const index = overview.statuses.findIndex((s) => s.stage.id === stageId);
  const status = overview.statuses[index];
  if (!status || status.state === "locked") return null;
  const progress = await getDataSource().academyProgress(user.id);
  const done = new Set(progress.lessonsDone);
  return { status, lessons: status.stage.lessons.map((l) => ({ ...l, done: done.has(l.id) })), index, total: overview.statuses.length };
}

export async function completeLesson(user: AppUser, stageId: string, lessonId: string): Promise<string> {
  const view = await getStage(user, stageId);
  if (!view || !view.lessons.some((l) => l.id === lessonId)) return "/akademia";
  await getDataSource().markLessonDone(user.id, lessonId);
  const i = view.lessons.findIndex((l) => l.id === lessonId);
  const next = view.lessons.slice(i + 1).find((l) => !l.done);
  return next ? `/akademia/${stageId}/lekcja/${next.id}` : `/akademia/${stageId}`;
}

/** Pytania egzaminu bez poprawnych odpowiedzi (nie wysyłamy ich do przeglądarki). */
export function publicQuestions(stage: AcademyStage) {
  return stage.exam.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, multiple: q.correct.length > 1 }));
}

export interface ExamOutcome {
  result: Pick<ExamResult, "correctCount" | "total" | "score" | "passed">;
  mistakes: { question: string; explanation: string }[];
  unlocked: { title: string } | null;
  trackCompleted: boolean;
  threshold: number;
}

export async function submitExam(user: AppUser, stageId: string, answers: Record<string, number[]>, now = new Date()): Promise<ExamOutcome | { error: string }> {
  const source = getDataSource();
  const view = await getStage(user, stageId);
  if (!view) return { error: "Etap jest zablokowany." };
  if (!view.status.examOpen) return { error: view.status.retryAt ? "Kolejna próba będzie możliwa później." : "Najpierw ukończ wszystkie lekcje etapu." };
  const config = await source.getConfig();
  const stage = view.status.stage;
  const result = gradeExam(stage.exam.questions, answers, config.academy);
  await source.saveExamAttempt(user.id, { stageId, score: result.score, passed: result.passed, at: now.toISOString(), answers });

  const overview = await getAcademy(user);
  const wasPassed = view.status.state === "passed";
  const next = overview.statuses[view.index + 1];
  return {
    result: { correctCount: result.correctCount, total: result.total, score: result.score, passed: result.passed },
    mistakes: result.results
      .filter((r) => !r.correct)
      .map((r) => {
        const q = stage.exam.questions.find((x) => x.id === r.questionId)!;
        return { question: q.text, explanation: q.explanation };
      }),
    unlocked: result.passed && !wasPassed && next ? { title: next.stage.title } : null,
    trackCompleted: result.passed && !next,
    threshold: config.academy.passThreshold,
  };
}
