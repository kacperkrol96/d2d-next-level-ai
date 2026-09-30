import type { CrmClient, CrmEmployee, CrmStatusChange } from "./types";

export interface ResolvedAssignment {
  auditorId: string | null;
  salesId: string | null;
}

/**
 * Ustalanie audytora i handlowca z historii przypisań:
 * audytor = pierwszy przypisany pracownik z rolą audytora,
 * handlowiec = ostatni przypisany pracownik z rolą handlowca.
 */
export function resolveAssignment(client: CrmClient, employees: readonly CrmEmployee[]): ResolvedAssignment {
  const roleOf = new Map(employees.map((e) => [e.id, e.role]));
  const history = [...client.assignmentHistory].sort((a, b) => a.at.localeCompare(b.at));
  const auditor = history.find((h) => roleOf.get(h.employeeId) === "auditor");
  const sales = [...history].reverse().find((h) => roleOf.get(h.employeeId) === "sales");
  return { auditorId: auditor?.employeeId ?? null, salesId: sales?.employeeId ?? null };
}

export function currentStatus(history: readonly CrmStatusChange[]): string | null {
  if (history.length === 0) return null;
  return [...history].sort((a, b) => a.at.localeCompare(b.at))[history.length - 1].status;
}

/** Data pierwszego wejścia w status (z modułu czasu trwania statusu). */
export function enteredStatusAt(history: readonly CrmStatusChange[], status: string): Date | null {
  const entry = [...history].sort((a, b) => a.at.localeCompare(b.at)).find((h) => h.status === status);
  return entry ? new Date(entry.at) : null;
}

/** Data pierwszego wejścia w status równy progowi lub dalszy. */
export function reachedStatusAt(history: readonly CrmStatusChange[], threshold: string, pipeline: readonly string[]): Date | null {
  const thresholdIndex = pipeline.indexOf(threshold);
  const entry = [...history]
    .sort((a, b) => a.at.localeCompare(b.at))
    .find((h) => pipeline.indexOf(h.status) >= thresholdIndex && pipeline.indexOf(h.status) !== -1);
  return entry ? new Date(entry.at) : null;
}
