import type { AgreementScope, AppConfig, AuditorLevel, IncomeTier, SalesLevel, StatusCategory } from "@/lib/config/types";
import { roundMoney } from "./money";

/**
 * Szara = do dopięcia, zielona = zarobiona, anulowana = status negatywny,
 * brak = jeszcze przed progiem prowizji (np. audyt przed dokumentacją pomiarową).
 */
export type CommissionState = "grey" | "green" | "cancelled" | "none";

// ---------------------------------- HANDLOWIEC ----------------------------------

export interface SalesAgreementInput {
  scope: Extract<AgreementScope, "thermo" | "heatSource">;
  category: StatusCategory;
  /** Wartość umowy netto. */
  valueNet: number;
  /** Nadmarża netto na umowie. */
  surchargeNet: number;
}

export interface SalesClientInput {
  /** Umowy termo i źródło ciepła klienta — zawsze JEDNA prowizja za klienta. */
  agreements: SalesAgreementInput[];
  /** Klient „sam VAT” (patrz isSamVat). */
  samVat: boolean;
}

/**
 * Zakres umów u JEDNEGO klienta:
 * - Solo = tylko termo albo tylko źródło ciepła,
 * - Duet = termo + co najmniej jedno źródło ciepła („prace po korek”).
 * Umowy z negatywnym statusem się nie liczą; REK nie wpływa na zakres.
 */
export type SalesScope = "solo" | "duo";

export function salesScope(agreements: readonly { scope: AgreementScope; category?: StatusCategory | string }[]): SalesScope {
  const active = agreements.filter((a) => a.category !== "negative");
  const hasThermo = active.some((a) => a.scope === "thermo");
  const hasHeatSource = active.some((a) => a.scope === "heatSource");
  return hasThermo && hasHeatSource ? "duo" : "solo";
}

/**
 * „Sam VAT” = klient na progu dochodowym z reguły (domyślnie najwyższym) ORAZ bez
 * aktywnej umowy REK. Oznaczenie z oferty (Konfigurator) ma pierwszeństwo.
 */
export function isSamVat(
  client: { incomeTier: IncomeTier; samVatFromOffer: boolean | null },
  hasActiveRek: boolean,
  config: AppConfig,
): boolean {
  if (client.samVatFromOffer !== null) return client.samVatFromOffer;
  if (!config.samVat.enabled) return false;
  return client.incomeTier === config.samVat.incomeTier && !hasActiveRek;
}

export interface SalesCommission {
  state: CommissionState;
  scope: SalesScope;
  baseRate: number;
  /** Część podstawowa po ewentualnej obniżce „sam VAT”. */
  base: number;
  /** Nadmarża po limicie (przed udziałem). */
  surchargeCapped: number;
  /** Udział handlowca w nadmarży. */
  surchargePart: number;
  total: number;
  samVat: boolean;
}

/**
 * Prowizja handlowca ZA KLIENTA — w całości dla handlowca przypisanego do klienta.
 * - zielona, gdy którakolwiek aktywna umowa termo/źródło jest w kategorii „prowizja handlowca zarobiona”,
 * - stawka Solo/Duet wg poziomu, „sam VAT” = obniżka wg konfiguracji,
 * - nadmarża netto z limitem % wartości umów termo + źródło (bez REK) × udział wg poziomu.
 */
export function salesClientCommission(input: SalesClientInput, level: SalesLevel, config: AppConfig): SalesCommission {
  const { rules } = config;
  const active = input.agreements.filter((a) => a.category !== "negative");
  const scope = salesScope(active);
  const baseRate = scope === "solo" ? level.soloRate : level.duoRate;
  const base = roundMoney(input.samVat ? baseRate * (1 - rules.samVatReduction) : baseRate);

  const totalValue = active.reduce((sum, a) => sum + a.valueNet, 0);
  const totalSurcharge = active.reduce((sum, a) => sum + Math.max(0, a.surchargeNet), 0);
  const surchargeCapped = roundMoney(Math.min(totalSurcharge, totalValue * rules.surchargeCapShare));
  const surchargePart = roundMoney(surchargeCapped * level.surchargeShare);

  let state: CommissionState;
  if (input.agreements.length === 0) state = "none";
  else if (active.length === 0) state = "cancelled";
  else state = active.some((a) => a.category === "sales_earned") ? "green" : "grey";

  return { state, scope, baseRate, base, surchargeCapped, surchargePart, total: roundMoney(base + surchargePart), samVat: input.samVat };
}

// ---------------------------------- AUDYTOR ----------------------------------

export interface AuditorClientInput {
  /** Kategoria umowy audytowej (/A). */
  auditCategory: StatusCategory;
  /** Czy handlowiec zamknął klienta (prowizja handlowca zielona). */
  salesClosed: boolean;
  incomeTier: IncomeTier;
}

export interface AuditorCommission {
  state: CommissionState;
  rate: number;
  /** Bonus za zamknięcie przez handlowca (0, gdy jeszcze nie zamknięty). */
  closingBonus: number;
  /** Bonus możliwy do zdobycia, gdy handlowiec zamknie klienta. */
  potentialClosingBonus: number;
  total: number;
}

/** Audytor: szara od „DOKUMENTACJA POMIAROWA”, zielona od „TWORZENIE OFERTY” (kategorie z tabeli statusów). */
export function auditorClientCommission(input: AuditorClientInput, level: AuditorLevel): AuditorCommission {
  const rate = level.rates[input.incomeTier];
  if (input.auditCategory === "negative") return { state: "cancelled", rate, closingBonus: 0, potentialClosingBonus: 0, total: 0 };
  if (input.auditCategory !== "auditor_grey" && input.auditCategory !== "auditor_earned") {
    return { state: "none", rate, closingBonus: 0, potentialClosingBonus: 0, total: 0 };
  }
  const closingBonus = input.salesClosed ? level.closingBonus : 0;
  return {
    state: input.auditCategory === "auditor_earned" ? "green" : "grey",
    rate,
    closingBonus,
    potentialClosingBonus: input.salesClosed ? 0 : level.closingBonus,
    total: roundMoney(rate + closingBonus),
  };
}

/**
 * Dyferencja managera: różnica między stawką managera a stawką osoby
 * z jego struktury za tego samego klienta (nigdy ujemna).
 */
export function differential(managerRate: number, subordinateRate: number): number {
  return roundMoney(Math.max(0, managerRate - subordinateRate));
}

export function auditorDifferential(manager: AuditorLevel, subordinate: AuditorLevel, tier: IncomeTier): number {
  return differential(manager.rates[tier], subordinate.rates[tier]);
}

// ---------------------------------- WYPŁATA ----------------------------------

/** Wypłata = prowizja × mnożnik KPI. */
export function applyKpiMultiplier(commission: number, multiplier: number): number {
  return roundMoney(commission * multiplier);
}
