import type { AgreementCategories, AppConfig, AuditorLevel, IncomeTier, SalesLevel } from "@/lib/config/types";
import { roundMoney } from "./money";
import { isCancelled, isStatusAtOrBeyond } from "./status";

/** Szara = do dopięcia, zielona = zarobiona, anulowana = klient zrezygnował. */
export type CommissionState = "grey" | "green" | "cancelled";

// ---------------------------------- HANDLOWIEC ----------------------------------

export interface SalesAgreementInput {
  /** Rodzaj umowy z CRM (np. „Termomodernizacja”, „Kocioł”). */
  kind: string;
  /** Wartość umowy netto. */
  valueNet: number;
  /** Nadmarża netto na umowie. */
  surchargeNet: number;
  /** Umowa „sam VAT”. */
  samVat: boolean;
}

export interface SalesClientInput {
  /** Aktualny status sprzedażowy klienta w CRM. */
  status: string;
  /** Wszystkie umowy klienta — zawsze JEDNA prowizja za klienta. */
  agreements: SalesAgreementInput[];
}

/**
 * Zakres umów u JEDNEGO klienta:
 * - Solo = umowa tylko z jednej kategorii (samo termo ALBO samo źródło ciepła),
 * - Duet = termomodernizacja + źródło ciepła („prace po korek”).
 * Rodzaje umów spoza obu kategorii nie wpływają na zakres.
 */
export type SalesScope = "solo" | "duo";

export function salesScope(agreements: readonly { kind: string }[], categories: AgreementCategories): SalesScope {
  const hasThermo = agreements.some((a) => categories.thermo.includes(a.kind));
  const hasHeatSource = agreements.some((a) => categories.heatSource.includes(a.kind));
  return hasThermo && hasHeatSource ? "duo" : "solo";
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
 * - stawka Solo/Duet wg poziomu; Solo/Duet rozpoznawane po rodzajach umów klienta,
 * - „sam VAT” (wszystkie umowy klienta) = obniżka wg konfiguracji,
 * - nadmarża netto z limitem % wartości umów netto × udział wg poziomu.
 */
export function salesClientCommission(input: SalesClientInput, level: SalesLevel, config: AppConfig): SalesCommission {
  const { rules, pipelines } = config;
  const scope = salesScope(input.agreements, config.agreementCategories);
  const baseRate = scope === "solo" ? level.soloRate : level.duoRate;
  const samVat = input.agreements.length > 0 && input.agreements.every((a) => a.samVat);
  const base = roundMoney(samVat ? baseRate * (1 - rules.samVatReduction) : baseRate);

  const totalValue = input.agreements.reduce((sum, a) => sum + a.valueNet, 0);
  const totalSurcharge = input.agreements.reduce((sum, a) => sum + Math.max(0, a.surchargeNet), 0);
  const surchargeCapped = roundMoney(Math.min(totalSurcharge, totalValue * rules.surchargeCapShare));
  const surchargePart = roundMoney(surchargeCapped * level.surchargeShare);

  let state: CommissionState = "grey";
  if (isCancelled(input.status, pipelines.cancelled)) state = "cancelled";
  else if (isStatusAtOrBeyond(input.status, rules.salesGreenFromStatus, pipelines.sales)) state = "green";

  return { state, scope, baseRate, base, surchargeCapped, surchargePart, total: roundMoney(base + surchargePart), samVat };
}

// ---------------------------------- AUDYTOR ----------------------------------

export interface AuditorClientInput {
  /** Status umowy audytowej. */
  auditStatus: string;
  /** Status sprzedażowy klienta (do bonusu za zamknięcie). */
  salesStatus: string;
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

export function auditorClientCommission(input: AuditorClientInput, level: AuditorLevel, config: AppConfig): AuditorCommission {
  const { rules, pipelines } = config;
  const rate = level.rates[input.incomeTier];

  if (isCancelled(input.auditStatus, pipelines.cancelled)) {
    return { state: "cancelled", rate, closingBonus: 0, potentialClosingBonus: 0, total: 0 };
  }

  const green = isStatusAtOrBeyond(input.auditStatus, rules.auditorGreenFromStatus, pipelines.audit);
  const closed =
    !isCancelled(input.salesStatus, pipelines.cancelled) &&
    isStatusAtOrBeyond(input.salesStatus, rules.auditorClosingBonusFromStatus, pipelines.sales);
  const closingBonus = closed ? level.closingBonus : 0;

  return {
    state: green ? "green" : "grey",
    rate,
    closingBonus,
    potentialClosingBonus: closed ? 0 : level.closingBonus,
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
