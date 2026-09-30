import { roundMoney } from "./money";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SettlementPeriod {
  index: number;
  start: Date;
  /** Koniec okresu (wyłącznie) — pierwszy dzień następnego okresu. */
  end: Date;
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Okres rozliczeniowy (co `lengthDays` dni od daty startowej) zawierający `date`. */
export function settlementPeriodFor(date: Date, anchorISO: string, lengthDays: number): SettlementPeriod {
  const anchor = Date.parse(`${anchorISO}T00:00:00Z`);
  const days = Math.floor((utcDay(date) - anchor) / DAY_MS);
  const index = Math.floor(days / lengthDays);
  const start = new Date(anchor + index * lengthDays * DAY_MS);
  return { index, start, end: new Date(start.getTime() + lengthDays * DAY_MS) };
}

export interface SettlementInput {
  /** Suma zielonych prowizji w okresie. */
  commissions: number;
  kpiMultiplier: number;
  /** Stałe dodatki (np. opieka nad zespołem) — bez mnożnika KPI. */
  additions?: number;
  /** Potrącenia za rezygnacje klientów po wypłacie (dodatnie kwoty). */
  deductions?: number;
  /** Koszt auta firmowego do potrącenia. */
  fleetCost?: number;
}

export interface SettlementLine {
  key: "commissions" | "kpi" | "additions" | "deductions" | "fleet";
  label: string;
  /** Kwota ze znakiem: dodatnia zwiększa, ujemna zmniejsza wypłatę. */
  amount: number;
}

export interface Settlement {
  commissions: number;
  afterKpi: number;
  additions: number;
  deductions: number;
  fleetCost: number;
  /** Kwota do wypłaty (≥ 0). */
  payable: number;
  /** Niepokryta część potrąceń przechodzi na kolejny okres. */
  carryOver: number;
  /** Pozycje rozliczenia do pokazania w Skarbcu i Mennicy („Flota” osobno). */
  lines: SettlementLine[];
}

export function computeSettlement(input: SettlementInput): Settlement {
  const afterKpi = roundMoney(input.commissions * input.kpiMultiplier);
  const additions = roundMoney(input.additions ?? 0);
  const deductions = roundMoney(input.deductions ?? 0);
  const fleet = roundMoney(input.fleetCost ?? 0);
  const net = roundMoney(afterKpi + additions - deductions - fleet);
  const lines: SettlementLine[] = [{ key: "commissions", label: "Prowizje", amount: roundMoney(input.commissions) }];
  if (afterKpi !== roundMoney(input.commissions)) {
    lines.push({ key: "kpi", label: `Mnożnik KPI ${Math.round(input.kpiMultiplier * 100)}%`, amount: roundMoney(afterKpi - input.commissions) });
  }
  if (additions) lines.push({ key: "additions", label: "Dodatki", amount: additions });
  if (deductions) lines.push({ key: "deductions", label: "Korekty (rezygnacje)", amount: -deductions });
  if (fleet) lines.push({ key: "fleet", label: "Flota", amount: -fleet });
  return {
    lines,
    commissions: roundMoney(input.commissions),
    afterKpi,
    additions,
    deductions,
    fleetCost: fleet,
    payable: Math.max(0, net),
    carryOver: net < 0 ? roundMoney(-net) : 0,
  };
}

export interface MonthlyFleetCost {
  /** Miesiąc w formacie YYYY-MM. */
  month: string;
  cost: number;
}

/**
 * Koszt auta za miesiąc jest potrącany automatycznie w najbliższym
 * rozliczeniu po jego zakończeniu, czyli w okresie, który zawiera
 * pierwszy dzień następnego miesiąca.
 */
export function fleetDeductionForPeriod(period: SettlementPeriod, costs: readonly MonthlyFleetCost[]): { total: number; months: string[] } {
  const months: string[] = [];
  let total = 0;
  for (const { month, cost } of costs) {
    const [y, m] = month.split("-").map(Number);
    const firstDayAfter = Date.UTC(y, m, 1); // m jest 1-based, więc to 1. dzień kolejnego miesiąca
    if (firstDayAfter >= period.start.getTime() && firstDayAfter < period.end.getTime()) {
      months.push(month);
      total += cost;
    }
  }
  return { total: roundMoney(total), months };
}
