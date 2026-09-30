import type { KpiResult } from "./kpi";

/** Żółta kartka za wynik KPI w przedziale „poniżej minimum”. Zasady kartek ustalimy później. */
export interface YellowCard {
  personId: string;
  /** Początek okresu rozliczeniowego (ISO). */
  periodStart: string;
  issuedAt: string;
  kpiScore: number;
  reason: string;
}

export function yellowCardFor(personId: string, kpi: KpiResult, periodStart: Date, now: Date): YellowCard | null {
  if (!kpi.yellowCard) return null;
  return {
    personId,
    periodStart: periodStart.toISOString(),
    issuedAt: now.toISOString(),
    kpiScore: kpi.score,
    reason: `Wynik KPI ${kpi.score} pkt — ${kpi.band.label.toLowerCase()}`,
  };
}

/** Dopisuje kartkę do historii osoby — najwyżej jedna kartka na osobę w okresie. */
export function recordYellowCard(history: readonly YellowCard[], card: YellowCard | null): YellowCard[] {
  if (!card) return [...history];
  const exists = history.some((c) => c.personId === card.personId && c.periodStart === card.periodStart);
  return exists ? [...history] : [...history, card];
}
