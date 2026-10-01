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

export interface SalesLevelInput {
  ownClients: number;
  /** Klienci podległych handlowców (cały zespół w dół struktury). */
  structureClients: number;
  /** Poziom zdobyty wcześniej — brak minimum do utrzymania, poziom nie spada. */
  previousLevel?: number;
}

/**
 * Poziom handlowca: najwyższy, którego próg klientów jest osiągnięty.
 * Od poziomu `structureFromLevel` do progu liczą się klienci całego zespołu
 * (jego + podległych). Poziom nigdy nie spada poniżej `previousLevel`.
 */
export function salesLevelFor(input: SalesLevelInput, levels: readonly SalesLevel[], structureFromLevel: number): LevelProgress<SalesLevel> {
  const sorted = byLevel(levels);
  const clientsFor = (level: SalesLevel) =>
    level.level >= structureFromLevel ? input.ownClients + input.structureClients : input.ownClients;

  let reached = sorted[0].level;
  for (const level of sorted) {
    if (clientsFor(level) >= level.clientsToReach) reached = level.level;
    else break;
  }
  const currentLevel = Math.max(reached, input.previousLevel ?? 1);
  const current = findLevel(sorted, currentLevel);
  const next = sorted.find((l) => l.level === currentLevel + 1) ?? null;
  if (!next) return { current, next, clientsMissing: 0, peopleMissing: 0, progress: 1 };
  const clients = clientsFor(next);
  return {
    current,
    next,
    clientsMissing: Math.max(0, next.clientsToReach - clients),
    peopleMissing: 0,
    progress: ratio(clients, current.clientsToReach, next.clientsToReach),
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

// ------------------------------------------------------------------ poziom w czasie

export interface ClientEvent {
  /** Kiedy klient zaczął się liczyć (prowizja zielona). */
  at: Date;
  /** Kiedy przestał (rezygnacja / status negatywny) — odejmuje klienta z licznika. */
  droppedAt?: Date | null;
  /** Klient z zespołu (nie własny). */
  structure: boolean;
}

/**
 * Historia poziomu: poziom w chwili `t` to najwyższy poziom osiągnięty przed `t`
 * (rezygnacja odejmuje klienta z licznika, ale zdobyty poziom zostaje).
 * Służy do stawki „według poziomu z chwili, gdy prowizja zrobiła się zielona”.
 */
export function levelTimeline(
  events: readonly ClientEvent[],
  levelFor: (own: number, structure: number) => number,
  initialLevel = 1,
): (t: Date) => number {
  const points = [...new Set(events.flatMap((e) => [e.at.getTime(), ...(e.droppedAt ? [e.droppedAt.getTime()] : [])]))].sort((a, b) => a - b);
  const reached: { time: number; level: number }[] = [];
  let best = initialLevel;
  for (const time of points) {
    let own = 0;
    let structure = 0;
    for (const e of events) {
      const counted = e.at.getTime() <= time && (!e.droppedAt || e.droppedAt.getTime() > time);
      if (counted) {
        if (e.structure) structure++;
        else own++;
      }
    }
    best = Math.max(best, levelFor(own, structure));
    reached.push({ time, level: best });
  }
  return (t: Date) => {
    let level = initialLevel;
    for (const r of reached) if (r.time < t.getTime()) level = r.level;
    return level;
  };
}
