import type { AppConfig, SalesLevel } from "@/lib/config/types";
import { differential } from "./commission";
import { roundMoney } from "./money";

/**
 * Dyferencja managera-handlowca za klienta osoby z jego struktury: różnica stawek
 * Solo / Duet między poziomem managera i poziomem osoby (nigdy ujemna).
 * - prowizja Solo → różnica stawek Solo,
 * - „Dopłata do Duetu” → różnica dopłat (Duet − Solo),
 * - „sam VAT” obniża dyferencję tak samo jak stawkę,
 * - „Dopłata nadmarży” — bez dyferencji (udział w nadmarży ma tylko handlowiec przy kliencie; do potwierdzenia).
 */
export function salesDifferential(
  payment: { kind: "base" | "duoTopUp" | "surchargeTopUp"; samVat: boolean; state: string },
  manager: SalesLevel,
  sub: SalesLevel,
  config: AppConfig,
): number {
  if (payment.kind === "surchargeTopUp") return 0;
  const sign = payment.state === "clawback" ? -1 : 1;
  const raw = payment.kind === "base" ? differential(manager.soloRate, sub.soloRate) : differential(manager.duoRate - manager.soloRate, sub.duoRate - sub.soloRate);
  const factor = payment.samVat ? 1 - config.rules.samVatReduction : 1;
  return roundMoney(sign * raw * factor);
}

/** Opieka nad zespołem: kwota miesięczna z poziomu managera (wpisuje admin), gdy ma kogoś w strukturze. */
export function teamCareFee(level: SalesLevel, teamSize: number): number {
  return teamSize > 0 ? (level.teamCareFee ?? 0) : 0;
}

/** „Twój zarobek ze struktury w tym miesiącu” = dyferencja + opieka nad zespołem (bez mnożnika KPI dla opieki). */
export function structureTotal(differentials: readonly number[], teamCare: number): number {
  return roundMoney(differentials.reduce((s, d) => s + d, 0) + teamCare);
}
