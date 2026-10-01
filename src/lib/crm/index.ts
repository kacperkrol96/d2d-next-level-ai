import type { CrmAgreement, CrmClient, CrmEmployee, CrmProvider } from "./types";
import { buildMockData, mockEmployees } from "./mock-data";

/** CRM na danych testowych (kształt jak prawdziwy RRUP). */
export class MockCrm implements CrmProvider {
  readonly source = "mock" as const;
  readonly reports: { clientId: string; reporterId: string; note: string; at: string }[] = [];

  async listEmployees(): Promise<CrmEmployee[]> {
    return mockEmployees;
  }

  async listClients(): Promise<CrmClient[]> {
    return buildMockData().clients;
  }

  async listAgreements(): Promise<CrmAgreement[]> {
    return buildMockData().agreements;
  }

  async reportAssignmentError(clientId: string, reporterId: string, note: string): Promise<void> {
    this.reports.push({ clientId, reporterId, note, at: new Date().toISOString() });
  }
}

export type * from "./types";
