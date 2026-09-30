import type { KpiBand, KpiDefinition } from "@/lib/config/types";
import { roundMoney } from "./money";

/** Poziom KPI (0 = poniżej progu I, 1–5 = poziomy I–V). */
export function kpiLevel(value: number, definition: KpiDefinition): number {
  let level = 0;
  definition.thresholds.forEach((threshold, index) => {
    const reached = definition.direction === "higher" ? value >= threshold : value <= threshold;
    if (reached) level = index + 1;
  });
  return level;
}

export interface KpiResultItem {
  key: string;
  label: string;
  weight: number;
  /** null = brak danych; KPI pomijane w wyniku (wagi przeliczane). */
  value: number | null;
  level: number;
  points: number;
  maxPoints: number;
}

export interface KpiResult {
  items: KpiResultItem[];
  /** Wynik w skali 0–100 pkt. */
  score: number;
  band: KpiBand;
  multiplier: number;
  belowMinimum: boolean;
}

export const MAX_KPI_LEVEL = 5;

export function bandForScore(score: number, bands: readonly KpiBand[]): KpiBand {
  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  let band = sorted[0];
  for (const candidate of sorted) {
    if (score >= candidate.minScore) band = candidate;
  }
  if (!band) throw new Error("Brak przedziałów KPI w konfiguracji");
  return band;
}

/**
 * Wynik KPI: każde KPI ocenione na poziomie 0–5 × waga, przeskalowane do 0–100.
 * Przy sumie wag 20 skalowanie nic nie zmienia (5 × 20 = 100).
 */
export function computeKpi(
  definitions: readonly KpiDefinition[],
  values: Record<string, number | null | undefined>,
  bands: readonly KpiBand[],
): KpiResult {
  const items: KpiResultItem[] = definitions.map((definition) => {
    const raw = values[definition.key];
    const value = raw === undefined ? null : raw;
    const level = value === null ? 0 : kpiLevel(value, definition);
    return {
      key: definition.key,
      label: definition.label,
      weight: definition.weight,
      value,
      level,
      points: level * definition.weight,
      maxPoints: value === null ? 0 : MAX_KPI_LEVEL * definition.weight,
    };
  });

  const points = items.reduce((sum, item) => sum + item.points, 0);
  const maxPoints = items.reduce((sum, item) => sum + item.maxPoints, 0);
  const score = maxPoints === 0 ? 0 : roundMoney((points / maxPoints) * 100);
  const band = bandForScore(score, bands);

  return { items, score, band, multiplier: band.multiplier, belowMinimum: band.belowMinimum };
}

// ---------- Surowe wartości KPI handlowca liczone z historii statusów CRM ----------

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface OfferTiming {
  handedOverAt: Date;
  signedAt: Date | null;
}

/**
 * Średni czas (dni) od „oferta przekazana do handlowca” do podpisania umowy.
 * Oferta niepodpisana po `capDays` wchodzi do średniej jako `capDays`;
 * oferty młodsze i niepodpisane jeszcze się nie liczą.
 * Każdy czas jest ograniczony z góry do `capDays`.
 */
export function averageOfferSignDays(offers: readonly OfferTiming[], now: Date, capDays: number): number | null {
  const durations: number[] = [];
  for (const offer of offers) {
    if (offer.signedAt) {
      durations.push(Math.min((offer.signedAt.getTime() - offer.handedOverAt.getTime()) / DAY_MS, capDays));
    } else if ((now.getTime() - offer.handedOverAt.getTime()) / DAY_MS >= capDays) {
      durations.push(capDays);
    }
  }
  if (durations.length === 0) return null;
  return roundMoney(durations.reduce((a, b) => a + b, 0) / durations.length);
}

export interface DocumentsTiming {
  signedAt: Date;
  documentsCompleteAt: Date | null;
}

/**
 * % klientów z kompletem dokumentów w ciągu `deadlineHours` od podpisania.
 * Klient liczy się, gdy ma komplet albo termin już minął.
 */
export function documentsOnTimeRate(clients: readonly DocumentsTiming[], now: Date, deadlineHours: number): number | null {
  let eligible = 0;
  let onTime = 0;
  for (const client of clients) {
    const deadline = client.signedAt.getTime() + deadlineHours * HOUR_MS;
    if (client.documentsCompleteAt) {
      eligible++;
      if (client.documentsCompleteAt.getTime() <= deadline) onTime++;
    } else if (now.getTime() > deadline) {
      eligible++;
    }
  }
  if (eligible === 0) return null;
  return roundMoney((onTime / eligible) * 100);
}

/** % klientów z ofertą, którzy mają zatwierdzoną opinię 5★. */
export function fiveStarReviewRate(clientsWithOffer: number, approvedReviews: number): number | null {
  if (clientsWithOffer === 0) return null;
  return roundMoney((Math.min(approvedReviews, clientsWithOffer) / clientsWithOffer) * 100);
}
