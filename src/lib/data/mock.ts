import "server-only";
import { demoUsers } from "@/lib/auth/users";
import { seedConfig } from "@/lib/config/seed";
import { MockCrm } from "@/lib/crm";
import { recordYellowCard, type YellowCard } from "@/lib/domain/yellow-card";
import type { DataSource, KpiInputs } from "./types";

const kpiInputs: Record<string, KpiInputs> = {
  "e-anna": { approvedFiveStarReviews: 2, auditorKpi: null },
  "e-marek": { approvedFiveStarReviews: 9, auditorKpi: null },
  "e-ola": { approvedFiveStarReviews: 0, auditorKpi: { unique_meetings: 3.6, leads_per_cycle: 10.2, crm_reporting: 96, crm_task_time: 14 } },
  "e-tomek": { approvedFiveStarReviews: 0, auditorKpi: { unique_meetings: 3.1, leads_per_cycle: 9.4, crm_reporting: 91, crm_task_time: 30 } },
};

/** Dane testowe w pamięci serwera (zapis znika po restarcie). */
export class MockDataSource implements DataSource {
  readonly kind = "mock" as const;
  private readonly crmProvider = new MockCrm();
  private yellowCards: YellowCard[] = [];

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
    return kpiInputs[employeeId] ?? { approvedFiveStarReviews: 0, auditorKpi: null };
  }

  async companyTargetPct() {
    return 103;
  }

  async saveYellowCard(card: YellowCard) {
    this.yellowCards = recordYellowCard(this.yellowCards, card);
  }

  async yellowCardsOf(personId: string) {
    return this.yellowCards.filter((c) => c.personId === personId);
  }
}
