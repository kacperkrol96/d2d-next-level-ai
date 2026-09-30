import type { AuditorLevel, SalesLevel } from "@/lib/config/types";

export interface LevelProgress<L> {
  current: L;
  next: L | null;
  /** Ilu klientów brakuje do następnego poziomu (0, gdy max). */
  clientsMissing: number;
  /** Ilu aktywnych osób brakuje do następnego poziomu (0, gdy nie dotyczy). */
  peopleMissing: number;
  /** Postęp do następnego poziomu 0–1 (1, gdy max). */
  progress: number;
}

function byLevel<L extends { level: number }>(levels: readonly L[]): L[] {
  return [...levels].sort((a, b) => a.level - b.level);
}

function findLevel<L extends { level: number }>(levels: readonly L[], level: number): L {
  const found = levels.find((l) => l.level === level);
  if (!found) throw new Error(`Poziom ${level} nie istnieje w konfiguracji`);
  return found;
}

function ratio(have: number, from: number, to: number): number {
  if (to <= from) return 1;
  return Math.max(0, Math.min(1, (have - from) / (to - from)));
}

/**
 * Poziom handlowca: najwyższy, którego próg klientów jest osiągnięty.
 * Brak minimum do utrzymania — poziom nigdy nie spada poniżej `previousLevel`.
 */
export function salesLevelFor(clients: number, levels: readonly SalesLevel[], previousLevel = 1): LevelProgress<SalesLevel> {
  const sorted = byLevel(levels);
  let reached = sorted[0].level;
  for (const level of sorted) {
    if (clients >= level.clientsToReach) reached = level.level;
  }
  const currentLevel = Math.max(reached, previousLevel);
  const current = findLevel(sorted, currentLevel);
  const next = sorted.find((l) => l.level === currentLevel + 1) ?? null;
  return {
    current,
    next,
    clientsMissing: next ? Math.max(0, next.clientsToReach - clients) : 0,
    peopleMissing: 0,
    progress: next ? ratio(clients, current.clientsToReach, next.clientsToReach) : 1,
  };
}

export interface AuditorLevelInput {
  ownClients: number;
  structureClients: number;
  activePeople: number;
  /** Poziom zdobyty raz zostaje na zawsze. */
  previousLevel?: number;
}

function auditorClientsFor(level: AuditorLevel, input: AuditorLevelInput): number {
  return level.countsStructure ? input.ownClients + input.structureClients : input.ownClients;
}

function auditorMeets(level: AuditorLevel, input: AuditorLevelInput): boolean {
  return auditorClientsFor(level, input) >= level.clientsToReach && input.activePeople >= level.activePeopleToReach;
}

/**
 * Poziom audytora. Od poziomów z `countsStructure` liczą się klienci
 * struktury + wymagana liczba aktywnych osób. Poziom nigdy nie spada.
 */
export function auditorLevelFor(input: AuditorLevelInput, levels: readonly AuditorLevel[]): LevelProgress<AuditorLevel> {
  const sorted = byLevel(levels);
  let reached = sorted[0].level;
  for (const level of sorted) {
    if (auditorMeets(level, input)) reached = level.level;
    else break;
  }
  const currentLevel = Math.max(reached, input.previousLevel ?? 1);
  const current = findLevel(sorted, currentLevel);
  const next = sorted.find((l) => l.level === currentLevel + 1) ?? null;
  if (!next) return { current, next, clientsMissing: 0, peopleMissing: 0, progress: 1 };

  const clients = auditorClientsFor(next, input);
  const clientProgress = ratio(clients, current.clientsToReach, next.clientsToReach);
  const peopleProgress = next.activePeopleToReach > 0 ? ratio(input.activePeople, current.activePeopleToReach, next.activePeopleToReach) : 1;
  return {
    current,
    next,
    clientsMissing: Math.max(0, next.clientsToReach - clients),
    peopleMissing: Math.max(0, next.activePeopleToReach - input.activePeople),
    progress: Math.min(clientProgress, peopleProgress),
  };
}
