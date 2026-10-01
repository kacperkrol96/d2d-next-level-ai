import type { SafetyRules, SafetyTier } from "@/lib/config/types";
import { roundMoney } from "./money";

/** System wynagrodzenia audytora. */
export type AuditorPlan = "safety" | "nextLevel";

export interface PlanChange {
  plan: AuditorPlan;
  /** Od kiedy obowiązuje (ISO). */
  from: string;
  /** Kto zdecydował (manager) i dlaczego. */
  by: string;
  reason: string;
  /** Czasowe cofnięcie na Safety (choroba / wypadek). */
  temporary?: boolean;
}

function tierFor(measurements: number, rules: SafetyRules): SafetyTier {
  const sorted = [...rules.tiers].sort((a, b) => a.minMeasurements - b.minMeasurements);
  return sorted.filter((t) => measurements >= t.minMeasurements).at(-1) ?? sorted[0];
}

export interface SafetyPay {
  measurements: number;
  tier: SafetyTier;
  /** Wypłata z progu (podstawa + pomiary ponad próg). */
  tierPay: number;
  /** Minimum dla umowy zlecenia (stawka godzinowa × godziny), 0 gdy nie dotyczy. */
  hourlyMinimum: number;
  /** Przed mnożnikiem KPI. */
  gross: number;
  /** Po mnożniku KPI (jeśli włączony w ustawieniach). */
  total: number;
}

/**
 * SAFETY — miesięcznie, wg liczby pomiarów: podstawa progu + stawka za każdy pomiar ponad próg.
 * Bez bonusu za zamknięcie. Umowa zlecenia: nie mniej niż stawka minimalna × przepracowane godziny.
 */
export function safetyPay(
  measurements: number,
  rules: SafetyRules,
  opts: { contractType: "B2B" | "Umowa zlecenia"; hoursWorked: number; kpiMultiplier: number },
): SafetyPay {
  const tier = tierFor(measurements, rules);
  const tierPay = roundMoney(tier.base + Math.max(0, measurements - tier.minMeasurements) * tier.perExtra);
  const hourlyMinimum = opts.contractType === "Umowa zlecenia" ? roundMoney(rules.minHourlyRate * opts.hoursWorked) : 0;
  const gross = Math.max(tierPay, hourlyMinimum);
  const total = roundMoney(rules.applyKpiMultiplier ? gross * opts.kpiMultiplier : gross);
  return { measurements, tier, tierPay, hourlyMinimum, gross, total };
}

/** Pasek do kolejnego progu Safety: „jeszcze 2 pomiary do 7 000 zł”. */
export function nextSafetyTier(measurements: number, rules: SafetyRules): { missing: number; base: number } | null {
  const next = [...rules.tiers].sort((a, b) => a.minMeasurements - b.minMeasurements).find((t) => t.minMeasurements > measurements);
  return next ? { missing: next.minMeasurements - measurements, base: next.base } : null;
}

/** Aktywny system w danej chwili wg historii zmian (bez historii → Safety na start). */
export function activePlan(history: readonly PlanChange[], at: Date, initial: AuditorPlan = "safety"): AuditorPlan {
  const past = history.filter((h) => Date.parse(h.from) <= at.getTime()).sort((a, b) => a.from.localeCompare(b.from));
  return past.at(-1)?.plan ?? initial;
}

/**
 * Zmiana systemu: Safety → Next Level (decyzja managera). Powrót na Safety tylko czasowo
 * (choroba / wypadek) — inaczej odrzucony.
 */
export function validatePlanChange(current: AuditorPlan, change: Omit<PlanChange, "from">): string | null {
  if (current === change.plan) return "To już aktywny system";
  if (change.plan === "safety" && !change.temporary) return "Powrót z Next Level na Safety jest możliwy tylko czasowo (choroba / wypadek)";
  if (!change.reason.trim()) return "Podaj powód zmiany";
  return null;
}
