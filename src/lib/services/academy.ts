import "server-only";
import { randomUUID } from "node:crypto";
import { formById, launchPad } from "@/lib/academy/forms";
import { lessonTexts } from "@/lib/academy/lessons.generated";
import type { AcademyStage, AcademyTrack, ExamAttempt, Lesson, PublicExam } from "@/lib/academy/types";
import type { AppUser } from "@/lib/auth/users";
import type { ContractVersion } from "@/lib/contracts/types";
import { getDataSource } from "@/lib/data";
import {
  applyReview,
  isTrial,
  maxPoints,
  newAttempt,
  passPoints,
  sanitizeAnswers,
  scoreForm,
  stageStatuses,
  toPublicExam,
  trackProgress,
  validateFormDecision,
  type GateStatus,
  type StageStatus,
} from "@/lib/domain/academy";
import { currentContract } from "@/lib/domain/contract";
import { loadContext, subordinatesOf } from "./portfolio";

export const trackLabels: Record<AcademyTrack, string> = { field: "Ścieżka terenowa D1–D4", manager: "Ścieżka managera" };

/** Ścieżki osoby: audytor i handlowiec → terenowa; manager i zarząd → terenowa + managera. */
export function tracksFor(user: AppUser): AcademyTrack[] {
  return user.role === "manager" || user.role === "admin" ? ["field", "manager"] : ["field"];
}

export function trackFor(user: AppUser, requested?: string | null): AcademyTrack {
  const tracks = tracksFor(user);
  return tracks.includes(requested as AcademyTrack) ? (requested as AcademyTrack) : tracks[0];
}

export interface NextStep {
  stageTitle: string;
  href: string | null;
  label: string;
}

export interface AcademyOverview {
  track: AcademyTrack;
  tracks: AcademyTrack[];
  statuses: StageStatus[];
  progress: number;
  next: NextStep | null;
}

function gateStep(stage: AcademyStage, g: GateStatus): NextStep | null {
  const title = `${stage.code} · ${stage.title}`;
  if (g.state === "passed") return null;
  if (g.gate.kind === "exam") {
    if (g.state === "open") return { stageTitle: title, href: `/akademia/${stage.id}/egzamin`, label: "Egzamin" };
    if (g.state === "review") return { stageTitle: title, href: null, label: "Egzamin czeka na ocenę managera" };
    if (g.state === "cooldown") return { stageTitle: title, href: `/akademia/${stage.id}`, label: "Kolejne podejście wkrótce" };
    return null;
  }
  return { stageTitle: title, href: null, label: g.state === "needs_more" ? `${g.gate.label}: manager zaplanuje powtórkę` : `${g.gate.label} — wypełnia manager` };
}

function nextStep(statuses: StageStatus[], done: Set<string>): NextStep | null {
  const current = statuses.find((s) => s.state === "available");
  if (!current) return null;
  const lesson = current.stage.lessons.find((l) => !done.has(l.id));
  if (lesson) return { stageTitle: `${current.stage.code} · ${current.stage.title}`, href: `/akademia/${current.stage.id}/lekcja/${lesson.id}`, label: lesson.title };
  for (const g of current.gates) {
    const step = gateStep(current.stage, g);
    if (step) return step;
  }
  return null;
}

async function overviewFor(userId: string, track: AcademyTrack, now: Date) {
  const source = getDataSource();
  const [stages, progress, config] = await Promise.all([source.academyStages(track), source.academyProgress(userId), source.getConfig()]);
  const statuses = stageStatuses(stages, progress, config.academy, now);
  return { statuses, progress, config };
}

export async function getAcademy(user: AppUser, requestedTrack?: string | null, now = new Date()): Promise<AcademyOverview> {
  const track = trackFor(user, requestedTrack);
  const { statuses, progress } = await overviewFor(user.id, track, now);
  return { track, tracks: tracksFor(user), statuses, progress: trackProgress(statuses), next: nextStep(statuses, new Set(progress.lessonsDone)) };
}

export interface StageView {
  status: StageStatus;
  track: AcademyTrack;
  lessons: (Lesson & { done: boolean; watched: number | null })[];
  /** Egzaminy etapu w wersji publicznej (bez kluczy). */
  exams: Record<string, { title: string; maxPoints: number; passPoints: number; trial: boolean; lastTrial: ExamAttempt | null }>;
}

/** Etap tylko, gdy nie jest zablokowany (inaczej null). Szuka na wszystkich ścieżkach osoby. */
export async function getStage(user: AppUser, stageId: string, now = new Date()): Promise<StageView | null> {
  const source = getDataSource();
  for (const track of tracksFor(user)) {
    const { statuses, progress, config } = await overviewFor(user.id, track, now);
    const status = statuses.find((s) => s.stage.id === stageId);
    if (!status) continue;
    if (status.state === "locked") return null;
    const done = new Set(progress.lessonsDone);
    const exams: StageView["exams"] = {};
    for (const g of status.stage.gates) {
      if (g.kind !== "exam") continue;
      const exam = await source.academyExam(g.examId);
      const trials = progress.attempts.filter((a) => a.examId === g.examId && a.trial).sort((a, b) => b.at.localeCompare(a.at));
      if (exam) exams[g.examId] = { title: exam.title, maxPoints: maxPoints(exam), passPoints: passPoints(exam, config.academy), trial: isTrial(exam, config.academy), lastTrial: trials[0] ?? null };
    }
    return {
      status,
      track,
      lessons: status.stage.lessons.map((l) => ({ ...l, done: done.has(l.id), watched: l.kind === "video" ? (progress.videoWatched[l.id] ?? 0) : null })),
      exams,
    };
  }
  return null;
}

export type LessonBody =
  | { kind: "reading"; markdown: string }
  | { kind: "contract"; contract: ContractVersion | null }
  | { kind: "video"; youtubeId: string | null; watched: number; required: number }
  | { kind: "launchpad"; plan: typeof launchPad };

export async function getLesson(user: AppUser, stageId: string, lessonId: string) {
  const view = await getStage(user, stageId);
  const lesson = view?.lessons.find((l) => l.id === lessonId);
  if (!view || !lesson) return null;
  const source = getDataSource();
  let body: LessonBody;
  if (lesson.kind === "reading") body = { kind: "reading", markdown: lessonTexts[lesson.content]?.body ?? "" };
  else if (lesson.kind === "contract") {
    const track = user.track ?? "auditor";
    body = { kind: "contract", contract: currentContract(await source.contractVersions(track), track) };
  } else if (lesson.kind === "video") {
    const [links, config] = await Promise.all([source.videoLinks(), source.getConfig()]);
    body = { kind: "video", youtubeId: links[lesson.videoKey] ?? null, watched: lesson.watched ?? 0, required: config.academy.videoWatchedShare };
  } else body = { kind: "launchpad", plan: launchPad };
  const index = view.lessons.findIndex((l) => l.id === lessonId);
  return { view, lesson, body, index };
}

/** Zaliczenie lekcji. Film — tylko po obejrzeniu wymaganej części (ustawienie). */
export async function completeLesson(user: AppUser, stageId: string, lessonId: string): Promise<string> {
  const view = await getStage(user, stageId);
  const lesson = view?.lessons.find((l) => l.id === lessonId);
  if (!view || !lesson) return "/akademia";
  if (lesson.kind === "video") {
    const { academy } = await getDataSource().getConfig();
    if ((lesson.watched ?? 0) < academy.videoWatchedShare) return `/akademia/${stageId}/lekcja/${lessonId}`;
  }
  await getDataSource().markLessonDone(user.id, lessonId);
  const i = view.lessons.findIndex((l) => l.id === lessonId);
  const next = view.lessons.slice(i + 1).find((l) => !l.done);
  return next ? `/akademia/${stageId}/lekcja/${next.id}` : `/akademia/${stageId}`;
}

export async function recordVideoProgress(user: AppUser, stageId: string, lessonId: string, share: number) {
  const view = await getStage(user, stageId);
  const lesson = view?.lessons.find((l) => l.id === lessonId);
  if (!lesson || lesson.kind !== "video" || !Number.isFinite(share)) return;
  await getDataSource().saveVideoProgress(user.id, lessonId, share);
}

/** Egzamin w wersji publicznej — tylko gdy bramka jest otwarta. */
export async function getExam(user: AppUser, stageId: string): Promise<{ view: StageView; exam: PublicExam } | null> {
  const view = await getStage(user, stageId);
  const gate = view?.status.gates.find((g) => g.gate.kind === "exam" && g.state === "open");
  if (!view || !gate || gate.gate.kind !== "exam") return null;
  const source = getDataSource();
  const [exam, config] = await Promise.all([source.academyExam(gate.gate.examId), source.getConfig()]);
  return exam ? { view, exam: toPublicExam(exam, config.academy) } : null;
}

export interface ExamOutcome {
  state: "passed" | "failed" | "review";
  /** Egzamin próbny — wynik nie odblokowuje etapu. */
  trial: boolean;
  autoPoints: number;
  closedTotal: number;
  closedCorrect: number;
  maxPoints: number;
  passPoints: number;
  /** Pytania zamknięte z błędną odpowiedzią (bez pokazywania klucza). */
  wrong: string[];
  unlocked: { title: string } | null;
  trackCompleted: boolean;
}

export async function submitExam(user: AppUser, stageId: string, rawAnswers: Record<string, unknown>, now = new Date()): Promise<ExamOutcome | { error: string }> {
  const source = getDataSource();
  const view = await getStage(user, stageId, now);
  const gate = view?.status.gates.find((g) => g.gate.kind === "exam");
  if (!view || !gate || gate.gate.kind !== "exam") return { error: "Etap jest zablokowany." };
  if (gate.state !== "open") {
    return { error: gate.state === "review" ? "Poprzednie podejście czeka na ocenę managera." : gate.state === "cooldown" ? "Kolejna próba będzie możliwa później." : "Najpierw ukończ wszystkie lekcje etapu." };
  }
  const [exam, config] = await Promise.all([source.academyExam(gate.gate.examId), source.getConfig()]);
  if (!exam) return { error: "Brak egzaminu." };
  const answers = sanitizeAnswers(exam, rawAnswers);
  const attempt = newAttempt(exam, stageId, answers, config.academy, now, randomUUID());
  await source.saveExamAttempt(user.id, attempt);

  const closed = exam.questions.filter((q) => q.type === "choice");
  const wrong = closed.filter((q) => answers[q.id] !== q.correctIndex).map((q) => q.text);
  const after = await getAcademy(user, view.track, now);
  const index = after.statuses.findIndex((s) => s.stage.id === stageId);
  const passedNow = after.statuses[index]?.state === "passed" && view.status.state !== "passed";
  const next = after.statuses[index + 1];
  return {
    state: attempt.passed === null ? "review" : attempt.passed ? "passed" : "failed",
    trial: attempt.trial === true,
    autoPoints: attempt.autoPoints,
    closedTotal: closed.length,
    closedCorrect: closed.length - wrong.length,
    maxPoints: maxPoints(exam),
    passPoints: passPoints(exam, config.academy),
    wrong,
    unlocked: passedNow && next ? { title: `${next.stage.code} · ${next.stage.title}` } : null,
    trackCompleted: passedNow && !next,
  };
}

// ------------------------------------------------------------------ manager: zespół, oceny, karty

/** Osoby prowadzone przez użytkownika: manager / handlowiec z audytorami — swoja struktura (z CRM), zarząd — wszyscy. */
export async function teamOf(user: AppUser): Promise<AppUser[]> {
  const users = (await getDataSource().listUsers()).filter((u) => u.track && u.id !== user.id);
  if (user.role === "admin") return users;
  if ((user.role !== "manager" && user.role !== "sales") || !user.crmEmployeeId) return [];
  const ctx = await loadContext();
  const ids = new Set([...subordinatesOf(user.crmEmployeeId, ctx.employees, "sales"), ...subordinatesOf(user.crmEmployeeId, ctx.employees, "auditor")].map((e) => e.id));
  return users.filter((u) => u.crmEmployeeId && ids.has(u.crmEmployeeId));
}

export async function canCoach(user: AppUser, personId: string): Promise<AppUser | null> {
  return (await teamOf(user)).find((u) => u.id === personId) ?? null;
}

export interface TeamMemberAcademy {
  person: AppUser;
  statuses: StageStatus[];
  progress: number;
  current: StageStatus | null;
  pendingReviews: ExamAttempt[];
  /** Karty do wypełnienia w etapie, na którym jest osoba. */
  formsToFill: { stageId: string; formId: string; label: string; state: string }[];
  videos: { lessonId: string; title: string; watched: number }[];
  /** Wymagana obejrzana część filmu (ustawienie). */
  threshold: number;
}

export async function getTeamAcademy(user: AppUser, now = new Date()): Promise<TeamMemberAcademy[]> {
  const team = await teamOf(user);
  const config = await getDataSource().getConfig();
  return Promise.all(
    team.map(async (person) => {
      const { statuses, progress } = await overviewFor(person.id, "field", now);
      const current = statuses.find((s) => s.state === "available") ?? null;
      const videos = statuses.flatMap((s) => s.stage.lessons.filter((l) => l.kind === "video").map((l) => ({ lessonId: l.id, title: l.title, watched: progress.videoWatched[l.id] ?? 0 })));
      return {
        person,
        statuses,
        progress: trackProgress(statuses),
        current,
        pendingReviews: progress.attempts.filter((a) => a.passed === null),
        formsToFill: current
          ? current.gates
              .filter((g) => g.gate.kind === "form" && g.state !== "passed")
              .map((g) => ({ stageId: current.stage.id, formId: (g.gate as { formId: string }).formId, label: (g.gate as { label: string }).label, state: g.state }))
          : [],
        videos: videos.map((v) => ({ ...v, watched: Math.min(1, v.watched) })),
        threshold: config.academy.videoWatchedShare,
      };
    }),
  );
}

/** Podejście do oceny — z wzorcami odpowiedzi (widzi tylko manager / zarząd). */
export async function getReview(user: AppUser, personId: string, attemptId: string) {
  const person = await canCoach(user, personId);
  if (!person) return null;
  const source = getDataSource();
  const progress = await source.academyProgress(personId);
  const attempt = progress.attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;
  const [exam, config] = await Promise.all([source.academyExam(attempt.examId), source.getConfig()]);
  if (!exam) return null;
  return { person, attempt, exam, maxPoints: maxPoints(exam), passPoints: passPoints(exam, config.academy) };
}

export async function reviewAttempt(user: AppUser, personId: string, attemptId: string, points: Record<string, number>, comment: string, now = new Date()) {
  const data = await getReview(user, personId, attemptId);
  if (!data) return { error: "Brak dostępu do tego podejścia." };
  const config = await getDataSource().getConfig();
  const reviewed = applyReview(data.exam, data.attempt, points, { comment, by: user.id, at: now }, config.academy);
  if ("error" in reviewed) return reviewed;
  await getDataSource().updateExamAttempt(personId, reviewed);
  return { ok: true as const, passed: reviewed.passed };
}

export async function submitForm(user: AppUser, personId: string, formId: string, values: Record<string, string>, decision: string | null, now = new Date()) {
  const person = await canCoach(user, personId);
  const form = formById(formId);
  if (!person || !form) return { error: "Brak dostępu." };
  const { score, missing } = scoreForm(form, values);
  if (missing.length) return { error: `Oceń wszystkie elementy (brakuje: ${missing.length})` };
  const decisionError = validateFormDecision(form, decision);
  if (decisionError) return { error: decisionError };
  await getDataSource().saveFormSubmission({ formId: form.id, personId, by: user.id, at: now.toISOString(), values, score, decision: form.decision ? decision : null });
  return { ok: true as const };
}
