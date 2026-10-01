import type { MonthDay, SettlementPeriodRule } from "@/lib/config/types";
import { roundMoney } from "./money";

export interface SettlementPeriod {
  /** np. „2026-10/1” (pierwsza połowa) lub „2026-10/2”. */
  key: string;
  /** Pierwszy i ostatni dzień okresu (YYYY-MM-DD, czas polski). */
  startDay: string;
  endDay: string;
  /** Termin rozliczenia/akceptacji i dzień wypłaty (YYYY-MM-DD). */
  settleBy: string;
  payoutOn: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Data w strefie czasowej firmy jako YYYY-MM-DD. */
export function localDay(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function shift(y: number, m: number, md: MonthDay): string {
  const total = y * 12 + (m - 1) + md.monthOffset;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return dayKey(ny, nm, Math.min(md.day, daysInMonth(ny, nm)));
}

/** Okres rozliczeniowy (np. 1–15 lub 16–koniec miesiąca) zawierający datę. */
export function settlementPeriodFor(date: Date, rules: readonly SettlementPeriodRule[], timeZone: string): SettlementPeriod {
  const [y, m, d] = localDay(date, timeZone).split("-").map(Number);
  const last = daysInMonth(y, m);
  const index = rules.findIndex((r) => d >= r.fromDay && d <= (r.toDay ?? last));
  if (index === -1) throw new Error(`Dzień ${d} nie należy do żadnego okresu rozliczeniowego`);
  const rule = rules[index];
  return {
    key: `${y}-${pad(m)}/${index + 1}`,
    startDay: dayKey(y, m, rule.fromDay),
    endDay: dayKey(y, m, Math.min(rule.toDay ?? last, last)),
    settleBy: shift(y, m, rule.settleBy),
    payoutOn: shift(y, m, rule.payoutOn),
  };
}

/** Okres bezpośrednio poprzedzający dany okres. */
export function previousPeriod(period: SettlementPeriod, rules: readonly SettlementPeriodRule[], timeZone: string): SettlementPeriod {
  const [y, m, d] = period.startDay.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d, 12) - 24 * 60 * 60 * 1000);
  return settlementPeriodFor(prev, rules, timeZone);
}

export function isInPeriod(date: Date, period: SettlementPeriod, timeZone: string): boolean {
  const day = localDay(date, timeZone);
  return day >= period.startDay && day <= period.endDay;
}

/** Ile pełnych dni zostało do terminu (YYYY-MM-DD); ujemne = po terminie. */
export function daysUntil(now: Date, day: string, timeZone: string): number {
  const today = Date.parse(`${localDay(now, timeZone)}T00:00:00Z`);
  return Math.round((Date.parse(`${day}T00:00:00Z`) - today) / (24 * 60 * 60 * 1000));
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
  if (deductions) lines.push({ key: "deductions", label: "Potrącenia (status negatywny)", amount: -deductions });
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
    const firstDayAfter = m === 12 ? dayKey(y + 1, 1, 1) : dayKey(y, m + 1, 1);
    if (firstDayAfter >= period.startDay && firstDayAfter <= period.endDay) {
      months.push(month);
      total += cost;
    }
  }
  return { total: roundMoney(total), months };
}
