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
}

export interface SalesClientInput {
  /** Umowy termo i źródło ciepła klienta — zawsze JEDNA prowizja za klienta. */
  agreements: SalesAgreementInput[];
  /** Klient „sam VAT” (patrz isSamVat). */
  samVat: boolean;
  /** Nadmarża netto klienta (null = nieuzupełniona → 0). */
  surchargeNet: number | null;
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
 * Brak progu przy włączonej regule → null (do wyjaśnienia).
 */
export function isSamVat(
  client: { incomeTier: IncomeTier | null; samVatFromOffer: boolean | null },
  hasActiveRek: boolean,
  config: AppConfig,
): boolean | null {
  if (client.samVatFromOffer !== null) return client.samVatFromOffer;
  if (!config.samVat.enabled) return false;
  if (client.incomeTier === null) return null;
  return client.incomeTier === config.samVat.incomeTier && !hasActiveRek;
}

export interface CommissionAmount {
  baseRate: number;
  /** Część podstawowa po ewentualnej obniżce „sam VAT”. */
  base: number;
  /** Nadmarża po limicie (przed udziałem). */
  surchargeCapped: number;
  /** Udział handlowca w nadmarży. */
  surchargePart: number;
  total: number;
}

/** Kwota prowizji dla zakresu i wartości umów (limit nadmarży liczony od tych umów). */
export function commissionAmount(scope: SalesScope, values: readonly number[], samVat: boolean, surchargeNet: number | null, level: SalesLevel, config: AppConfig): CommissionAmount {
  const baseRate = scope === "solo" ? level.soloRate : level.duoRate;
  const base = roundMoney(samVat ? baseRate * (1 - config.rules.samVatReduction) : baseRate);
  const totalValue = values.reduce((sum, v) => sum + v, 0);
  const surchargeCapped = roundMoney(Math.min(Math.max(0, surchargeNet ?? 0), totalValue * config.rules.surchargeCapShare));
  const surchargePart = roundMoney(surchargeCapped * level.surchargeShare);
  return { baseRate, base, surchargeCapped, surchargePart, total: roundMoney(base + surchargePart) };
}

export interface SalesCommission extends CommissionAmount {
  state: CommissionState;
  scope: SalesScope;
  samVat: boolean;
}

/**
 * Prowizja handlowca ZA KLIENTA (pełny zakres, bez podziału na płatności) —
 * zielona, gdy którakolwiek aktywna umowa termo/źródło jest „prowizja handlowca zarobiona”.
 */
export function salesClientCommission(input: SalesClientInput, level: SalesLevel, config: AppConfig): SalesCommission {
  const active = input.agreements.filter((a) => a.category !== "negative");
  const scope = salesScope(active);
  const amount = commissionAmount(scope, active.map((a) => a.valueNet), input.samVat, input.surchargeNet, level, config);
  let state: CommissionState;
  if (input.agreements.length === 0) state = "none";
  else if (active.length === 0) state = "cancelled";
  else state = active.some((a) => a.category === "sales_earned") ? "green" : "grey";
  return { ...amount, state, scope, samVat: input.samVat };
}

// ---------------------------------- PŁATNOŚCI: SOLO + DOPŁATA DO DUETU ----------------------------------

export interface PaymentAgreement extends SalesAgreementInput {
  /** Kiedy umowa zrobiła się zielona (null = jeszcze nie). */
  greenAt: Date | null;
  /** Kiedy po zazielenieniu spadła w status negatywny. */
  droppedAt: Date | null;
}

export type PaymentState = CommissionState | "clawback";

export interface SalesPayment {
  /** base = prowizja Solo (pierwsza zielona umowa), duoTopUp = „Dopłata do Duetu”. */
  kind: "base" | "duoTopUp";
  state: PaymentState;
  /** Kwota (ujemna przy potrąceniu). */
  amount: number;
  greenAt: Date | null;
  droppedAt: Date | null;
}

const latest = (dates: (Date | null)[]) => dates.filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
const earliestDate = (dates: (Date | null)[]) => dates.filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

/**
 * Płatności handlowca za klienta:
 * - gdy zielona jest jedna umowa (termo albo źródło) → od razu stawka Solo,
 * - gdy zazieleni się umowa drugiej kategorii → „Dopłata do Duetu” (różnica) jako osobna pozycja,
 * - umowa negatywna nie liczy się do Solo/Duet; utrata po wypłacie → potrącenie.
 */
export function salesClientPayments(
  input: { agreements: PaymentAgreement[]; samVat: boolean; surchargeNet: number | null },
  level: SalesLevel,
  config: AppConfig,
): SalesPayment[] {
  const { agreements, samVat, surchargeNet } = input;
  if (agreements.length === 0) return [];
  const amount = (scope: SalesScope, list: PaymentAgreement[]) => commissionAmount(scope, list.map((a) => a.valueNet), samVat, surchargeNet, level, config).total;
  const isActive = (a: PaymentAgreement) => a.category !== "negative";
  const active = agreements.filter(isActive);
  const earned = agreements.filter((a) => a.greenAt).sort((a, b) => a.greenAt!.getTime() - b.greenAt!.getTime());
  const activeEarned = earned.filter(isActive);
  const has = (list: PaymentAgreement[], scope: PaymentAgreement["scope"]) => list.some((a) => a.scope === scope);

  // Jeszcze nic zielonego: szara prowizja Solo + szara dopłata, jeśli w grze jest Duet.
  if (earned.length === 0) {
    if (active.length === 0) return [{ kind: "base", state: "cancelled", amount: 0, greenAt: null, droppedAt: null }];
    const primary = active.find((a) => a.scope === "thermo") ?? active[0];
    const base = amount("solo", [primary]);
    const out: SalesPayment[] = [{ kind: "base", state: "grey", amount: base, greenAt: null, droppedAt: null }];
    if (has(active, "thermo") && has(active, "heatSource")) {
      out.push({ kind: "duoTopUp", state: "grey", amount: roundMoney(amount("duo", active) - base), greenAt: null, droppedAt: null });
    }
    return out;
  }

  const first = earned[0];
  const base = amount("solo", [first]);
  const out: SalesPayment[] = [
    activeEarned.length > 0
      ? { kind: "base", state: "green", amount: base, greenAt: first.greenAt, droppedAt: null }
      : { kind: "base", state: "clawback", amount: -base, greenAt: first.greenAt, droppedAt: latest(earned.map((a) => a.droppedAt)) },
  ];

  const earnedThermo = earned.filter((a) => a.scope === "thermo");
  const earnedHeat = earned.filter((a) => a.scope === "heatSource");
  if (earnedThermo.length && earnedHeat.length) {
    const duoGreenAt = latest([earnedThermo[0].greenAt, earnedHeat[0].greenAt]);
    if (has(activeEarned, "thermo") && has(activeEarned, "heatSource")) {
      out.push({ kind: "duoTopUp", state: "green", amount: roundMoney(amount("duo", activeEarned) - base), greenAt: duoGreenAt, droppedAt: null });
    } else {
      const paid = roundMoney(amount("duo", earned) - base);
      const brokenAt = earliestDate(earned.filter((a) => !isActive(a)).map((a) => a.droppedAt));
      out.push({ kind: "duoTopUp", state: "clawback", amount: -paid, greenAt: duoGreenAt, droppedAt: brokenAt });
    }
  } else if (activeEarned.length > 0) {
    const missing: PaymentAgreement["scope"] = has(activeEarned, "thermo") ? "heatSource" : "thermo";
    const pending = active.find((a) => !a.greenAt && a.scope === missing);
    if (pending) {
      out.push({ kind: "duoTopUp", state: "grey", amount: roundMoney(amount("duo", [...activeEarned, pending]) - base), greenAt: null, droppedAt: null });
    }
  }
  return out;
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
