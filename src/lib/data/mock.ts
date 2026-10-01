import "server-only";
import { demoUsers } from "@/lib/auth/users";
import { seedConfig } from "@/lib/config/seed";
import { MockCrm } from "@/lib/crm";
import { buildMockData } from "@/lib/crm/mock-data";
import { academyStages } from "@/lib/academy/content";
import type { AcademyProgress, AcademyTrack, ExamAttempt } from "@/lib/academy/types";
import { recordYellowCard, type YellowCard } from "@/lib/domain/yellow-card";
import type { AppClientData, DataSource, KpiInputs, SalesAttribution } from "./types";

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
  private yellowCards: YellowCard[] = [];
  private adminAttributions: SalesAttribution[] = [];
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

  async saveYellowCard(card: YellowCard) {
    this.yellowCards = recordYellowCard(this.yellowCards, card);
  }

  async appClientData(): Promise<AppClientData> {
    const { terms, attributions, leadExceptions } = buildMockData();
    return { terms, attributions: [...attributions, ...this.adminAttributions], leadExceptions };
  }

  async confirmSalesPerson(clientId: string, employeeId: string, adminId: string) {
    this.adminAttributions.push({ clientId, employeeId, source: "admin", at: new Date().toISOString(), note: `potwierdził ${adminId}` });
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

  async yellowCardsOf(personId: string) {
    return this.yellowCards.filter((c) => c.personId === personId);
  }
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
