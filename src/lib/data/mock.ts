import "server-only";
import { demoUsers } from "@/lib/auth/users";
import { seedConfig } from "@/lib/config/seed";
import { MockCrm } from "@/lib/crm";
import { buildMockData } from "@/lib/crm/mock-data";
import { academyStages } from "@/lib/academy/content";
import { seedContracts } from "@/lib/contracts/seed";
import type { ContractAcceptance, ContractTrack, ContractVersion } from "@/lib/contracts/types";
import type { AppConfig } from "@/lib/config/types";
import { exams } from "@/lib/academy/exams";
import type { AcademyProgress, AcademyTrack, ExamAttempt, FormSubmission } from "@/lib/academy/types";
import { recordEvent, type PersonEvent } from "@/lib/domain/cards";
import type { PlanChange } from "@/lib/domain/safety";
import { MOCK_EPOCH } from "@/lib/crm/mock-data";
import type { AppClientData, DataSource, KpiInputs, SalesAttribution, SalesDecision, WorkLog } from "./types";

const kpiInputs: Record<string, KpiInputs> = {
  "e-anna": { approvedFiveStarReviews: 2, reportingPct: 97, auditorKpi: null },
  "e-marek": { approvedFiveStarReviews: 9, reportingPct: 88, auditorKpi: null },
  "e-ola": { approvedFiveStarReviews: 0, reportingPct: 96, auditorKpi: { unique_meetings: 3.6, leads_per_cycle: 10.2, crm_task_time: 14 } },
  "e-tomek": { approvedFiveStarReviews: 0, reportingPct: 91, auditorKpi: { unique_meetings: 3.1, leads_per_cycle: 9.4, crm_task_time: 30 } },
};

/** Dane testowe w pamięci serwera (zapis znika po restarcie). */
export class MockDataSource implements DataSource {
  readonly kind = "mock" as const;
  private readonly crmProvider = new MockCrm();
  private discipline: PersonEvent[] = seedDiscipline();
  private adminAttributions: SalesAttribution[] = [];
  private decisions: SalesDecision[] = [];
  private academy = new Map<string, AcademyProgress>(seedAcademy());

  private config: AppConfig = seedConfig;
  private contracts: ContractVersion[] = seedContracts();
  private acceptances: ContractAcceptance[] = seedAcceptances();

  async getConfig() {
    return this.config;
  }

  async updateConfig(patch: Partial<AppConfig>) {
    this.config = { ...this.config, ...patch };
  }

  async contractVersions(track?: ContractTrack) {
    return this.contracts.filter((c) => !track || c.track === track).sort((a, b) => b.version - a.version);
  }

  async publishContract(version: ContractVersion) {
    this.contracts.push(version);
  }

  async contractAcceptances() {
    return [...this.acceptances].sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));
  }

  async acceptContract(acceptance: ContractAcceptance) {
    this.acceptances.push(acceptance);
  }

  crm() {
    return this.crmProvider;
  }

  async listUsers() {
    return demoUsers;
  }

  async findUser(id: string) {
    return demoUsers.find((u) => u.id === id) ?? null;
  }

  async kpiInputs(employeeId: string): Promise<KpiInputs> {
    return kpiInputs[employeeId] ?? { approvedFiveStarReviews: 0, reportingPct: null, auditorKpi: null };
  }

  async companyTargetPct() {
    return 103;
  }

  async addDisciplineEvent(event: PersonEvent) {
    this.discipline = recordEvent(this.discipline, event);
  }

  async disciplineOf(personId: string) {
    return this.discipline.filter((e) => e.personId === personId).sort((a, b) => b.at.localeCompare(a.at));
  }

  async auditorPlanHistory(userId: string): Promise<PlanChange[]> {
    return planHistory[userId] ?? [];
  }

  async workLog(employeeId: string): Promise<WorkLog> {
    return workLogs[employeeId] ?? { hoursThisMonth: 0, meetingsHeld: 0, meetingsRecorded: 0, days: [], today: { leads: 0, meetings: 0 } };
  }

  async appClientData(): Promise<AppClientData> {
    const { terms, attributions, leadExceptions } = buildMockData();
    return { terms, attributions: [...attributions, ...this.adminAttributions], leadExceptions };
  }

  async confirmSalesPerson(d: SalesDecision) {
    this.adminAttributions.push({ clientId: d.clientId, employeeId: d.employeeId, source: "admin", at: d.at, note: `potwierdził ${d.by}` });
    this.decisions.unshift(d);
  }

  async salesDecisions() {
    return this.decisions;
  }

  private videos: Record<string, string> = {};

  async academyStages(track: AcademyTrack) {
    return academyStages.filter((s) => s.track === track);
  }

  async academyExam(examId: string) {
    return exams.find((e) => e.id === examId) ?? null;
  }

  async academyProgress(userId: string): Promise<AcademyProgress> {
    return this.academy.get(userId) ?? { userId, lessonsDone: [], videoWatched: {}, attempts: [], forms: [] };
  }

  async markLessonDone(userId: string, lessonId: string) {
    const p = await this.academyProgress(userId);
    if (!p.lessonsDone.includes(lessonId)) this.academy.set(userId, { ...p, lessonsDone: [...p.lessonsDone, lessonId] });
  }

  async saveVideoProgress(userId: string, lessonId: string, share: number) {
    const p = await this.academyProgress(userId);
    const best = Math.max(p.videoWatched[lessonId] ?? 0, Math.min(1, Math.max(0, share)));
    this.academy.set(userId, { ...p, videoWatched: { ...p.videoWatched, [lessonId]: best } });
  }

  async saveExamAttempt(userId: string, attempt: ExamAttempt) {
    const p = await this.academyProgress(userId);
    this.academy.set(userId, { ...p, attempts: [...p.attempts, attempt] });
  }

  async updateExamAttempt(userId: string, attempt: ExamAttempt) {
    const p = await this.academyProgress(userId);
    this.academy.set(userId, { ...p, attempts: p.attempts.map((a) => (a.id === attempt.id ? attempt : a)) });
  }

  async saveFormSubmission(submission: FormSubmission) {
    const p = await this.academyProgress(submission.personId);
    this.academy.set(submission.personId, { ...p, forms: [...p.forms, submission] });
  }

  async videoLinks() {
    return { ...this.videos };
  }

  async setVideoLink(key: string, youtubeId: string | null) {
    if (youtubeId) this.videos[key] = youtubeId;
    else delete this.videos[key];
  }

}

const DAY = 24 * 60 * 60 * 1000;
const isoAgo = (days: number, hourUtc = 18) => {
  const d = new Date(MOCK_EPOCH.getTime() - days * DAY);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d.toISOString();
};
const dayAgo = (days: number) => isoAgo(days).slice(0, 10);

/** Ola na Safety od startu (bez zmian). Przykład historii zmian — w Wieży (Etap 3). */
const planHistory: Record<string, PlanChange[]> = {};

/** Dziennik pracy (testowy): Ola raz nie zamknęła dnia, nagrania poniżej 20% u Tomka. */
const workLogs: Record<string, WorkLog> = {
  "e-ola": {
    hoursThisMonth: 96,
    meetingsHeld: 14,
    meetingsRecorded: 4,
    days: [
      { day: dayAgo(1), closedAt: isoAgo(1, 18) },
      { day: dayAgo(2), closedAt: isoAgo(2, 17) },
      { day: dayAgo(3), closedAt: null },
    ],
    today: { leads: 7, meetings: 0 },
  },
  "e-tomek": { hoursThisMonth: 80, meetingsHeld: 12, meetingsRecorded: 1, days: [], today: { leads: 0, meetings: 3 } },
  "e-marek": { hoursThisMonth: 110, meetingsHeld: 9, meetingsRecorded: 3, days: [], today: { leads: 0, meetings: 2 } },
  "e-anna": { hoursThisMonth: 120, meetingsHeld: 6, meetingsRecorded: 2, days: [], today: { leads: 0, meetings: 1 } },
};

/** Historia testowa: spóźnienie Marka i kartka managera. */
function seedDiscipline(): PersonEvent[] {
  return [
    { personId: "e-marek", kind: "late", at: isoAgo(12, 7), by: "u-anna" },
    { personId: "e-marek", kind: "yellow", reason: "no_gops", at: isoAgo(9, 15), by: "u-anna", automatic: false, note: "Klient bez zaświadczenia z GOPS na audycie" },
  ];
}

/**
 * Akceptacje testowe: Marek i Anna zaakceptowali kontrakt handlowca (wersja 1),
 * Ola zobaczy zwój przy pierwszym wejściu.
 */
function seedAcceptances(): ContractAcceptance[] {
  const sig = `data:image/png;base64,${"A".repeat(120)}`;
  return [
    { userId: "u-marek", track: "sales", version: 1, acceptedAt: isoAgo(20, 9), signature: sig },
    { userId: "u-anna", track: "sales", version: 1, acceptedAt: isoAgo(40, 9), signature: sig },
  ];
}

/**
 * Postęp testowy: Marek zdał D1, egzamin D2 czeka na ocenę Anny; Ola w trakcie D1;
 * Anna ma ścieżkę terenową za sobą i czyta Podręcznik Managera.
 */
function seedAcademy(): [string, AcademyProgress][] {
  const d1 = ["d1-kontrakt", "d1-wynagrodzenia", "d1-prezentacja"];
  const d2 = academyStages.find((s) => s.id === "d2")!.lessons.map((l) => l.id);
  const d3 = ["d3-prospecting", "d3-walkthrough"];
  const watched = (ids: string[]) => Object.fromEntries(ids.filter((id) => id.startsWith("film-")).map((id) => [id, 1]));
  const attempt = (examId: string, days: number, points: number | null, passed: boolean | null, answers: ExamAttempt["answers"] = {}): ExamAttempt => ({
    id: `seed-${examId}-${days}`,
    examId,
    stageId: examId,
    at: isoAgo(days, 10),
    answers,
    autoPoints: points ?? 0,
    review: points === null ? null : { points: {}, comment: "", by: "u-anna", at: isoAgo(days - 1, 10) },
    points,
    passed,
  });
  const form = (formId: FormSubmission["formId"], personId: string, days: number, decision: string | null): FormSubmission => ({
    formId,
    personId,
    by: "u-anna",
    at: isoAgo(days, 16),
    values: {},
    score: formId === "d2-scenki" ? 58 : null,
    decision,
  });
  const marekD2Answers: ExamAttempt["answers"] = {
    "d2-q1": "Bo pauza daje klientowi moment na „nie, dziękuję”.",
    "d2-q11": "Rozumiem, dlatego zajmie nam to tylko dwie minuty — sprawdzimy, czy Pana dom w ogóle się kwalifikuje.",
  };
  return [
    ["u-marek", { userId: "u-marek", lessonsDone: [...d1, ...d2], videoWatched: watched(d2), attempts: [attempt("d1", 20, 13, true), attempt("d2", 1, null, null, marekD2Answers)], forms: [] }],
    ["u-ola", { userId: "u-ola", lessonsDone: ["d1-kontrakt"], videoWatched: {}, attempts: [], forms: [] }],
    [
      "u-anna",
      {
        userId: "u-anna",
        lessonsDone: [...d1, ...d2, ...d3, "m1-1", "m1-2"],
        videoWatched: watched(d2),
        attempts: [attempt("d1", 90, 15, true), attempt("d2", 80, 18, true)],
        forms: [form("d2-scenki", "u-anna", 79, "Gotowy do D3"), form("d3", "u-anna", 75, null), form("d4", "u-anna", 74, "Gotowy na samodzielność — start Ignition")],
      },
    ],
  ];
}
