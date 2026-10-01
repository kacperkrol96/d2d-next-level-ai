import type { AcademyRules } from "@/lib/config/types";
import type { AcademyProgress, AcademyStage, ExamAttempt, Question } from "@/lib/academy/types";

/**
 * Akademia: automatyczne sprawdzanie egzaminów i odblokowywanie etapów.
 * Etap N+1 otwiera się dopiero po zdaniu egzaminu etapu N.
 */

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  chosen: number[];
  expected: number[];
}

export interface ExamResult {
  correctCount: number;
  total: number;
  /** Wynik 0–1. */
  score: number;
  passed: boolean;
  results: QuestionResult[];
}

const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

/** Pytanie zaliczone tylko przy dokładnie tym samym zestawie odpowiedzi (także wielokrotnego wyboru). */
export function gradeExam(questions: readonly Question[], answers: Record<string, number[]>, rules: AcademyRules): ExamResult {
  const results = questions.map((q) => {
    const chosen = [...new Set(answers[q.id] ?? [])];
    return { questionId: q.id, correct: sameSet(chosen, q.correct), chosen, expected: q.correct };
  });
  const correctCount = results.filter((r) => r.correct).length;
  const total = questions.length;
  const score = total === 0 ? 0 : correctCount / total;
  return { correctCount, total, score, passed: total > 0 && score >= rules.passThreshold - 1e-9, results };
}

export type StageState = "locked" | "available" | "passed";

export interface StageStatus {
  stage: AcademyStage;
  state: StageState;
  lessonsDone: number;
  lessonsTotal: number;
  /** Czy można już podejść do egzaminu. */
  examOpen: boolean;
  /** Najlepszy wynik (0–1) lub null. */
  bestScore: number | null;
  lastAttempt: ExamAttempt | null;
  /** Kiedy można podejść ponownie (ISO), jeśli trwa przerwa po niezdanym egzaminie. */
  retryAt: string | null;
}

export function lastAttemptFor(stageId: string, progress: AcademyProgress): ExamAttempt | null {
  return progress.attempts.filter((a) => a.stageId === stageId).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

/** Kiedy wolno podejść ponownie (null = od razu). */
export function retryAvailableAt(last: ExamAttempt | null, rules: AcademyRules): Date | null {
  if (!last || last.passed || rules.retryCooldownMinutes <= 0) return null;
  return new Date(Date.parse(last.at) + rules.retryCooldownMinutes * 60 * 1000);
}

export function stageStatuses(stages: readonly AcademyStage[], progress: AcademyProgress, rules: AcademyRules, now: Date): StageStatus[] {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const passed = new Set(progress.attempts.filter((a) => a.passed).map((a) => a.stageId));
  const done = new Set(progress.lessonsDone);
  let previousPassed = true;
  return sorted.map((stage) => {
    const state: StageState = passed.has(stage.id) ? "passed" : previousPassed ? "available" : "locked";
    previousPassed = passed.has(stage.id);
    const lessonsDone = stage.lessons.filter((l) => done.has(l.id)).length;
    const last = lastAttemptFor(stage.id, progress);
    const retry = retryAvailableAt(last, rules);
    const waiting = retry !== null && retry > now;
    const lessonsOk = !rules.requireLessonsBeforeExam || lessonsDone === stage.lessons.length;
    const scores = progress.attempts.filter((a) => a.stageId === stage.id).map((a) => a.score);
    return {
      stage,
      state,
      lessonsDone,
      lessonsTotal: stage.lessons.length,
      examOpen: state !== "locked" && lessonsOk && !waiting,
      bestScore: scores.length ? Math.max(...scores) : null,
      lastAttempt: last,
      retryAt: waiting ? retry!.toISOString() : null,
    };
  });
}

/** Postęp ścieżki 0–1: lekcje + egzaminy (każdy egzamin waży jak jedna lekcja). */
export function trackProgress(statuses: readonly StageStatus[]): number {
  const total = statuses.reduce((s, st) => s + st.lessonsTotal + 1, 0);
  const done = statuses.reduce((s, st) => s + st.lessonsDone + (st.state === "passed" ? 1 : 0), 0);
  return total === 0 ? 0 : done / total;
}

/** Sprawdzenie poprawności treści (np. po edycji w panelu admina). */
export function validateStage(stage: AcademyStage): string[] {
  const errors: string[] = [];
  const questions = [...stage.exam.questions, ...stage.lessons.flatMap((l) => (l.kind === "quiz" ? l.questions : []))];
  if (stage.exam.questions.length === 0) errors.push(`Etap „${stage.title}” nie ma pytań egzaminacyjnych`);
  for (const q of questions) {
    if (q.options.length < 2) errors.push(`Pytanie „${q.text}” ma mniej niż 2 odpowiedzi`);
    if (q.correct.length === 0) errors.push(`Pytanie „${q.text}” nie ma poprawnej odpowiedzi`);
    if (q.correct.some((i) => i < 0 || i >= q.options.length)) errors.push(`Pytanie „${q.text}” wskazuje nieistniejącą odpowiedź`);
  }
  return errors;
}
