import "server-only";
import { demoUsers } from "@/lib/auth/users";
import { seedConfig } from "@/lib/config/seed";
import { MockCrm } from "@/lib/crm";
import { buildMockData } from "@/lib/crm/mock-data";
import { academyStages } from "@/lib/academy/content";
import type { AcademyProgress, AcademyTrack, ExamAttempt } from "@/lib/academy/types";
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

  async getConfig() {
    return seedConfig;
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

  async academyStages(track: AcademyTrack) {
    return academyStages.filter((s) => s.track === track);
  }

  async academyProgress(userId: string): Promise<AcademyProgress> {
    return this.academy.get(userId) ?? { userId, lessonsDone: [], attempts: [] };
  }

  async markLessonDone(userId: string, lessonId: string) {
    const p = await this.academyProgress(userId);
    if (!p.lessonsDone.includes(lessonId)) this.academy.set(userId, { ...p, lessonsDone: [...p.lessonsDone, lessonId] });
  }

  async saveExamAttempt(userId: string, attempt: ExamAttempt) {
    const p = await this.academyProgress(userId);
    this.academy.set(userId, { ...p, attempts: [...p.attempts, attempt] });
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

/** Postęp testowy: Marek ma za sobą dwa etapy, Ola jeden. */
function seedAcademy(): [string, AcademyProgress][] {
  const day = 24 * 60 * 60 * 1000;
  const ago = (d: number) => new Date(Date.now() - d * day).toISOString();
  const passed = (stageId: string, score: number, d: number): ExamAttempt => ({ stageId, score, passed: true, at: ago(d), answers: {} });
  return [
    ["u-marek", { userId: "u-marek", lessonsDone: ["s1-l1", "s1-l2", "s1-l3", "s2-l1", "s2-l2", "s3-l1"], attempts: [passed("s1", 1, 20), { stageId: "s2", score: 0.67, passed: false, at: ago(12), answers: {} }, passed("s2", 1, 11)] }],
    ["u-anna", { userId: "u-anna", lessonsDone: ["s1-l1", "s1-l2", "s1-l3", "s2-l1", "s2-l2", "s3-l1", "s3-l2", "s4-l1"], attempts: [passed("s1", 1, 60), passed("s2", 1, 55), passed("s3", 1, 50), passed("s4", 1, 45)] }],
    ["u-ola", { userId: "u-ola", lessonsDone: ["a1-l1", "a1-l2", "a2-l1"], attempts: [passed("a1", 1, 15)] }],
  ];
}
