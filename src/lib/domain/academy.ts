import type { AcademyRules } from "@/lib/config/types";
import type { AcademyProgress, AcademyStage, ExamAttempt, ExamDef, FormSubmission, Gate, PublicExam } from "@/lib/academy/types";
import type { FormDef } from "@/lib/academy/forms";

/**
 * Akademia: egzaminy (zamknięte sprawdzane automatycznie na serwerze, otwarte ocenia manager),
 * karty managera i odblokowywanie etapów. Etap N+1 otwiera się po zaliczeniu etapu N.
 */

const EPS = 1e-9;

export function maxPoints(exam: ExamDef): number {
  return round2(exam.questions.reduce((s, q) => s + q.points, 0));
}

/** Próg punktowy egzaminu: % z ustawień (dla egzaminu albo domyślny) × maksimum, w górę. */
export function passPoints(exam: ExamDef, rules: AcademyRules): number {
  const share = rules.examPassThresholds[exam.id] ?? rules.passThreshold;
  return Math.ceil(maxPoints(exam) * share - EPS);
}

/** Egzamin próbny, dopóki admin nie oznaczy kluczy jako zweryfikowanych. */
export function isTrial(exam: ExamDef, rules: AcademyRules): boolean {
  return rules.verifiedExams[exam.id] !== true;
}

/** Czy egzamin ma punktowane pytania otwarte (wtedy wynik ustala manager). */
export function needsReview(exam: ExamDef): boolean {
  return exam.questions.some((q) => q.type === "text" && q.points > 0);
}

/** Klucz nigdy nie wychodzi z serwera: tylko treść, opcje i punkty. */
export function toPublicExam(exam: ExamDef, rules: AcademyRules): PublicExam {
  return {
    id: exam.id,
    title: exam.title,
    instructions: exam.instructions,
    timeLimitMinutes: exam.timeLimitMinutes,
    maxPoints: maxPoints(exam),
    passPoints: passPoints(exam, rules),
    trial: isTrial(exam, rules),
    questions: exam.questions.map((q) => ({ id: q.id, type: q.type, text: q.text, points: q.points, options: q.options, items: q.items })),
  };
}

/** Sprawdzenie pytań zamkniętych (jedna poprawna odpowiedź). */
export function gradeClosed(exam: ExamDef, answers: Record<string, number | string>): { autoPoints: number; correct: Record<string, boolean> } {
  const correct: Record<string, boolean> = {};
  let autoPoints = 0;
  for (const q of exam.questions) {
    if (q.type !== "choice") continue;
    const ok = typeof answers[q.id] === "number" && answers[q.id] === q.correctIndex;
    correct[q.id] = ok;
    if (ok) autoPoints += q.points;
  }
  return { autoPoints: round2(autoPoints), correct };
}

/** Odpowiedzi tylko na pytania z egzaminu, w dozwolonym formacie (tekst przycięty do rozsądnej długości). */
export function sanitizeAnswers(exam: ExamDef, raw: Record<string, unknown>): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  for (const q of exam.questions) {
    const v = raw[q.id];
    if (q.type === "choice" && typeof v === "number" && Number.isInteger(v) && v >= 0 && v < (q.options?.length ?? 0)) out[q.id] = v;
    if (q.type === "text" && typeof v === "string" && v.trim()) out[q.id] = v.trim().slice(0, 4000);
  }
  return out;
}

export function newAttempt(exam: ExamDef, stageId: string, answers: Record<string, number | string>, rules: AcademyRules, now: Date, id: string): ExamAttempt {
  const { autoPoints } = gradeClosed(exam, answers);
  const review = needsReview(exam);
  return {
    id,
    examId: exam.id,
    stageId,
    at: now.toISOString(),
    answers,
    autoPoints,
    review: null,
    points: review ? null : autoPoints,
    passed: review ? null : autoPoints >= passPoints(exam, rules) - EPS,
    ...(isTrial(exam, rules) ? { trial: true } : {}),
  };
}

/** Ocena managera: punkty za każde punktowane pytanie otwarte w zakresie 0–max. */
export function applyReview(
  exam: ExamDef,
  attempt: ExamAttempt,
  points: Record<string, number>,
  meta: { comment: string; by: string; at: Date },
  rules: AcademyRules,
): ExamAttempt | { error: string } {
  if (attempt.review) return { error: "To podejście jest już ocenione" };
  let manual = 0;
  const kept: Record<string, number> = {};
  for (const q of exam.questions) {
    if (q.type !== "text" || q.points <= 0) continue;
    const v = points[q.id];
    if (typeof v !== "number" || Number.isNaN(v)) return { error: "Oceń wszystkie punktowane pytania otwarte" };
    if (v < 0 || v > q.points + EPS) return { error: `Pytanie ${q.id}: od 0 do ${q.points} pkt` };
    kept[q.id] = v;
    manual += v;
  }
  const total = round2(attempt.autoPoints + manual);
  return {
    ...attempt,
    review: { points: kept, comment: meta.comment.trim(), by: meta.by, at: meta.at.toISOString() },
    points: total,
    passed: total >= passPoints(exam, rules) - EPS,
  };
}

/** Kiedy wolno podejść ponownie (null = od razu). */
export function retryAvailableAt(last: ExamAttempt | null, rules: AcademyRules): Date | null {
  if (!last || last.passed !== false || rules.retryCooldownMinutes <= 0) return null;
  const decidedAt = last.review ? last.review.at : last.at;
  return new Date(Date.parse(decidedAt) + rules.retryCooldownMinutes * 60 * 1000);
}

// ------------------------------------------------------------------ karty managera

/** Suma ocen 1–5 (karta punktowana) i walidacja wypełnienia. */
export function scoreForm(form: FormDef, values: Record<string, string>): { score: number | null; max: number | null; missing: string[] } {
  const items = form.sections.flatMap((s) => s.items);
  const scales = items.filter((i) => i.type === "scale");
  const missing = scales.filter((i) => !/^[1-5]$/.test(values[i.id] ?? "")).map((i) => i.label);
  if (!form.scored) return { score: null, max: null, missing: [] };
  const score = scales.reduce((s, i) => s + (Number(values[i.id]) || 0), 0);
  return { score, max: scales.length * 5, missing };
}

export function validateFormDecision(form: FormDef, decision: string | null): string | null {
  if (!form.decision) return null;
  if (!decision || !form.decision.options.includes(decision)) return "Wybierz decyzję";
  return null;
}

// ------------------------------------------------------------------ etapy

export type GateState = "locked" | "open" | "cooldown" | "review" | "passed" | "waiting" | "needs_more";

export interface GateStatus {
  gate: Gate;
  state: GateState;
  lastAttempt: ExamAttempt | null;
  bestPoints: number | null;
  retryAt: string | null;
  lastForm: FormSubmission | null;
}

export type StageState = "locked" | "available" | "passed";

export interface StageStatus {
  stage: AcademyStage;
  state: StageState;
  lessonsDone: number;
  lessonsTotal: number;
  gates: GateStatus[];
}

function latest<T extends { at: string }>(list: readonly T[]): T | null {
  return [...list].sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

function gateStatus(gate: Gate, stage: AcademyStage, progress: AcademyProgress, lessonsOk: boolean, rules: AcademyRules, now: Date): GateStatus {
  const base = { gate, lastAttempt: null, bestPoints: null, retryAt: null, lastForm: null };
  if (gate.kind === "form") {
    const last = latest(progress.forms.filter((f) => f.formId === gate.formId));
    if (!last) return { ...base, state: "waiting" };
    const ok = gate.passDecision === null || last.decision === gate.passDecision;
    return { ...base, lastForm: last, state: ok ? "passed" : "needs_more" };
  }
  // Podejścia próbne (klucze niezweryfikowane) nie odblokowują etapu i nie blokują kolejnych prób.
  const attempts = progress.attempts.filter((a) => a.examId === gate.examId && a.stageId === stage.id && !a.trial);
  const last = latest(attempts);
  const scored = attempts.map((a) => a.points).filter((p): p is number => p !== null);
  const common = { ...base, lastAttempt: last, bestPoints: scored.length ? Math.max(...scored) : null };
  if (attempts.some((a) => a.passed)) return { ...common, state: "passed" };
  if (last && last.passed === null) return { ...common, state: "review" };
  if (!lessonsOk) return { ...common, state: "locked" };
  const retry = retryAvailableAt(last, rules);
  if (retry && retry > now) return { ...common, state: "cooldown", retryAt: retry.toISOString() };
  return { ...common, state: "open" };
}

export function stageStatuses(stages: readonly AcademyStage[], progress: AcademyProgress, rules: AcademyRules, now: Date): StageStatus[] {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const done = new Set(progress.lessonsDone);
  let previousPassed = true;
  return sorted.map((stage) => {
    const lessonsDone = stage.lessons.filter((l) => done.has(l.id)).length;
    const allLessons = lessonsDone === stage.lessons.length;
    const lessonsOk = !rules.requireLessonsBeforeExam || allLessons;
    const gates = stage.gates.map((g) => gateStatus(g, stage, progress, lessonsOk, rules, now));
    const complete = allLessons && gates.every((g) => g.state === "passed");
    const state: StageState = !previousPassed ? "locked" : complete ? "passed" : "available";
    previousPassed = state === "passed";
    return { stage, state, lessonsDone, lessonsTotal: stage.lessons.length, gates };
  });
}

/** Postęp ścieżki 0–1: lekcje + bramki (egzamin / karta) — każda waży jak jedna lekcja. */
export function trackProgress(statuses: readonly StageStatus[]): number {
  const total = statuses.reduce((s, st) => s + st.lessonsTotal + st.gates.length, 0);
  const done = statuses.reduce((s, st) => s + st.lessonsDone + st.gates.filter((g) => g.state === "passed").length, 0);
  return total === 0 ? 0 : done / total;
}

/** Sprawdzenie spójności treści (np. po edycji w panelu admina). */
export function validateExam(exam: ExamDef): string[] {
  const errors: string[] = [];
  if (exam.questions.length === 0) errors.push(`Egzamin „${exam.title}” nie ma pytań`);
  for (const q of exam.questions) {
    if (q.points < 0) errors.push(`${q.id}: ujemne punkty`);
    if (q.type === "choice") {
      if (!q.options || q.options.length < 2) errors.push(`${q.id}: mniej niż 2 odpowiedzi`);
      if (q.correctIndex === null || q.correctIndex < 0 || q.correctIndex >= (q.options?.length ?? 0)) errors.push(`${q.id}: brak poprawnej odpowiedzi w kluczu`);
    }
  }
  return errors;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
