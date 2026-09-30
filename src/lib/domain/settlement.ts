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
}

export function computeSettlement(input: SettlementInput): Settlement {
  const afterKpi = roundMoney(input.commissions * input.kpiMultiplier);
  const additions = roundMoney(input.additions ?? 0);
  const deductions = roundMoney(input.deductions ?? 0);
  const fleet = roundMoney(input.fleetCost ?? 0);
  const net = roundMoney(afterKpi + additions - deductions - fleet);
  return {
    commissions: roundMoney(input.commissions),
    afterKpi,
    additions,
    deductions,
    fleetCost: fleet,
    payable: Math.max(0, net),
    carryOver: net < 0 ? roundMoney(-net) : 0,
  };
}
