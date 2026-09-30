import type { CrmClient, CrmEmployee, CrmProvider } from "./types";
import { buildMockClients, mockEmployees } from "./mock-data";

class MockCrm implements CrmProvider {
  readonly source = "mock" as const;
  readonly reports: { clientId: string; reporterId: string; note: string; at: string }[] = [];

  async listEmployees(): Promise<CrmEmployee[]> {
    return mockEmployees;
  }

  async listClients(): Promise<CrmClient[]> {
    return buildMockClients();
  }

  async getClient(id: string): Promise<CrmClient | null> {
    return buildMockClients().find((c) => c.id === id) ?? null;
  }

  async reportAssignmentError(clientId: string, reporterId: string, note: string): Promise<void> {
    this.reports.push({ clientId, reporterId, note, at: new Date().toISOString() });
  }
}

/**
 * Zwraca warstwę CRM. Dopóki nie ma klucza API (RRUP_API_KEY),
 * aplikacja pracuje na danych testowych. Prawdziwy klient RRUP
 * powstanie, gdy Kacper poda klucz (patrz docs/PLAN.md).
 */
export function getCrm(): CrmProvider {
  if (process.env.RRUP_API_KEY) {
    // TODO(Etap CRM): RrupCrm z https://funduszremontowy.rrcrm.pl/api/v1
    console.warn("RRUP_API_KEY ustawiony, ale integracja RRUP nie jest jeszcze gotowa — używam danych testowych.");
  }
  return mockCrm;
}

const mockCrm = new MockCrm();

export type * from "./types";
export { currentStatus, enteredStatusAt, reachedStatusAt, resolveAssignment } from "./assignment";
