import "server-only";
import { demoUsers } from "@/lib/auth/users";
import { seedConfig } from "@/lib/config/seed";
import { MockCrm } from "@/lib/crm";
import { buildMockData } from "@/lib/crm/mock-data";
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

  async yellowCardsOf(personId: string) {
    return this.yellowCards.filter((c) => c.personId === personId);
  }
}
