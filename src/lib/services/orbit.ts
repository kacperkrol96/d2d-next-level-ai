import "server-only";
import type { AppUser } from "@/lib/auth/users";
import type { AppConfig } from "@/lib/config/types";
import { getDataSource } from "@/lib/data";
import { fleetCost, type FleetResult } from "@/lib/domain/fleet";
import { averageOfferSignDays, computeKpi, documentsOnTimeRate, fiveStarReviewRate, type KpiResult } from "@/lib/domain/kpi";
import { formatPLN, roundMoney } from "@/lib/domain/money";
import { checkRedCard, kpiYellowCard, noReportYellowCard, type PersonEvent, type RedCardCheck } from "@/lib/domain/cards";
import { dayClosedInTime, recordingShare } from "@/lib/domain/rhythm";
import { activePlan, nextSafetyTier, safetyPay, type AuditorPlan, type SafetyPay } from "@/lib/domain/safety";
import { computeSettlement, fleetDeductionForPeriod, monthSettledIn, previousMonth, type MonthlyFleetCost, type Settlement, type SettlementPeriod } from "@/lib/domain/settlement";
import {
  auditorEntries,
  auditorMeasurements,
  auditorLevelState,
  loadContext,
  monthKey,
  salesEntries,
  salesKpiRaw,
  salesLevelState,
  subordinatesOf,
  summarize,
  type CommissionEntry,
  type Earnings,
  type PortfolioContext,
} from "./portfolio";

export type { CommissionEntry, Earnings };

export interface RateRow {
  label: string;
  current: string;
  next: string | null;
}

export interface OrbitData {
  track: "sales" | "auditor";
  level: number;
  title: string;
  nextLevel: number | null;
  nextTitle: string | null;
  clientsCount: number;
  clientsMissing: number;
  peopleMissing: number;
  progress: number;
  rates: RateRow[];
  kpi: KpiResult & { units: Record<string, string> };
  payout: { commission: number; multiplier: number; payout: number };
  /** Rozliczenie bieżącego okresu z pozycjami (m.in. „Flota”, „Korekty”). */
  settlement: Settlement & { fleetMonths: string[] };
  /** Historia kartek (najnowsze pierwsze) i stan czerwonej kartki. */
  discipline: { events: PersonEvent[]; red: RedCardCheck };
  /** Nagrania: udział nagranych spotkań vs minimum z ustawień. */
  recordings: { recorded: number; held: number; share: number; min: number; ok: boolean; missing: number };
  /** Audytor: aktywny system wynagrodzenia. */
  plan: AuditorPlanView | null;
  fleet: FleetResult | null;
  path: { level: number; title: string; requirement: string; reached: boolean; current: boolean }[];
  badges: { key: string; label: string; description: string; earned: boolean }[];
  earnings: Earnings;
}

export interface AuditorPlanView {
  active: AuditorPlan;
  /** Bieżący miesiąc (YYYY-MM). */
  month: string;
  measurements: number;
  /** Safety za bieżący miesiąc (prognoza na dziś). */
  safety: SafetyPay;
  nextTier: { missing: number; base: number } | null;
  /** „Ile zarobiłbyś na Next Level” w tym miesiącu (po mnożniku KPI). */
  nextLevelPreview: number;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function badges(config: AppConfig, data: { clients: number; kpiMultiplier: number; level: number }) {
  return config.badges.map((b) => ({ key: b.key, label: b.label, description: b.description, earned: data[b.metric] >= b.min }));
}

/** Koszty floty za miesiące z zielonymi klientami oraz bieżący i poprzedni miesiąc. */
function monthlyFleetCosts(entries: CommissionEntry[], ctx: PortfolioContext): MonthlyFleetCost[] {
  const counts = new Map<string, number>();
  const now = ctx.now;
  counts.set(monthKey(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), ctx), 0);
  counts.set(monthKey(now, ctx), 0);
  for (const e of entries) {
    if (e.state === "green" && e.greenAt) {
      const key = monthKey(new Date(e.greenAt), ctx);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts].map(([month, clients]) => ({ month, cost: fleetCost(clients, ctx.config.fleetBands).cost }));
}

function settlementFor(earnings: Earnings, kpi: KpiResult, fleetCosts: MonthlyFleetCost[], safety?: number) {
  const fleet = fleetDeductionForPeriod(earnings.period, fleetCosts);
  const settlement = computeSettlement({
    safetyPay: safety,
    commissions: safety !== undefined ? 0 : roundMoney(earnings.periodGreenTotal - earnings.periodDuoTopUps - earnings.periodSurchargeTopUps),
    duoTopUps: safety !== undefined ? 0 : earnings.periodDuoTopUps,
    surchargeTopUps: safety !== undefined ? 0 : earnings.periodSurchargeTopUps,
    kpiMultiplier: kpi.multiplier,
    deductions: safety !== undefined ? 0 : earnings.periodDeductions,
    fleetCost: fleet.total,
  });
  return { ...settlement, fleetMonths: fleet.months };
}

/** Kartki automatyczne (KPI < 30, dzień bez „Zamknij dzień”) + historia osoby. */
async function discipline(personId: string, kpi: KpiResult, earnings: Earnings, ctx: PortfolioContext): Promise<OrbitData["discipline"]> {
  const source = getDataSource();
  const { config, now } = ctx;
  const log = await source.workLog(personId);
  const automatic = [
    kpiYellowCard(personId, kpi, earnings.period.startDay, now),
    ...log.days.map((d) => noReportYellowCard(personId, d.day, dayClosedInTime(d.day, d.closedAt ? new Date(d.closedAt) : null, config.rhythm, config.timeZone), now)),
  ];
  for (const card of automatic) if (card) await source.addDisciplineEvent(card);
  const events = await source.disciplineOf(personId);
  return { events, red: checkRedCard(events, config.cards, now) };
}

async function recordings(personId: string, role: "auditor" | "sales", ctx: PortfolioContext): Promise<OrbitData["recordings"]> {
  const log = await getDataSource().workLog(personId);
  return { recorded: log.meetingsRecorded, held: log.meetingsHeld, ...recordingShare(log.meetingsRecorded, log.meetingsHeld, role, ctx.config.rhythm) };
}

async function auditorKpi(employeeId: string, ctx: PortfolioContext): Promise<KpiResult> {
  const source = getDataSource();
  const [inputs, target] = await Promise.all([source.kpiInputs(employeeId), source.companyTargetPct()]);
  return computeKpi(ctx.config.kpi.auditor, { ...(inputs.auditorKpi ?? {}), reporting: inputs.reportingPct, company_target: target }, ctx.config.kpiBands);
}

async function salesKpi(employeeId: string, ctx: PortfolioContext): Promise<KpiResult> {
  const { config, now } = ctx;
  const source = getDataSource();
  const [inputs, target] = await Promise.all([source.kpiInputs(employeeId), source.companyTargetPct()]);
  const raw = salesKpiRaw(employeeId, ctx);
  const auditors = subordinatesOf(employeeId, ctx.employees, "auditor");
  const scores = await Promise.all(auditors.map((a) => auditorKpi(a.id, ctx).then((k) => k.score)));
  return computeKpi(
    config.kpi.sales,
    {
      five_star_reviews: fiveStarReviewRate(raw.offers.length, inputs.approvedFiveStarReviews),
      documents_24h: documentsOnTimeRate(raw.documents, now, config.rules.documentsDeadlineHours),
      team_auditors_kpi: scores.length ? roundMoney(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      offer_sign_time: averageOfferSignDays(raw.offers, now, config.rules.offerSignCapDays),
      reporting: inputs.reportingPct,
      company_result: target,
    },
    config.kpiBands,
  );
}

export async function getEarnings(user: AppUser, now = new Date()): Promise<Earnings | null> {
  const orbit = await getOrbitData(user, now);
  return orbit?.earnings ?? null;
}

export async function getOrbitData(user: AppUser, now = new Date(), context?: PortfolioContext): Promise<OrbitData | null> {
  if (!user.crmEmployeeId || !user.track) return null;
  const ctx = context ?? (await loadContext(now));
  const { config } = ctx;
  const employeeId = user.crmEmployeeId;
  if (!ctx.employees.some((e) => e.id === employeeId)) return null;

  if (user.track === "sales") {
    const state = salesLevelState(employeeId, user.highestLevel, ctx);
    const lp = state.progress;
    const entries = salesEntries(employeeId, ctx, state.timeline, lp.current.level);
    const earnings = summarize(entries, ctx);
    const kpi = await salesKpi(employeeId, ctx);
    const settlement = settlementFor(earnings, kpi, user.hasCompanyCar ? monthlyFleetCosts(entries, ctx) : []);
    const thisMonth = monthKey(now, ctx);
    const monthClients = entries.filter((e) => e.state === "green" && e.greenAt && monthKey(new Date(e.greenAt), ctx) === thisMonth).length;
    const structureCounts = (lp.next?.level ?? lp.current.level) >= config.rules.salesStructureCountsFromLevel;

    return {
      track: "sales",
      level: lp.current.level,
      title: lp.current.title,
      nextLevel: lp.next?.level ?? null,
      nextTitle: lp.next?.title ?? null,
      clientsCount: structureCounts ? state.own + state.structure : state.own,
      clientsMissing: lp.clientsMissing,
      peopleMissing: 0,
      progress: lp.progress,
      rates: [
        { label: "Solo (1 umowa)", current: formatPLN(lp.current.soloRate), next: lp.next ? formatPLN(lp.next.soloRate) : null },
        { label: "Duet (termo + źródło ciepła)", current: formatPLN(lp.current.duoRate), next: lp.next ? formatPLN(lp.next.duoRate) : null },
        { label: "Udział w nadmarży", current: pct(lp.current.surchargeShare), next: lp.next ? pct(lp.next.surchargeShare) : null },
      ],
      kpi: { ...kpi, units: Object.fromEntries(config.kpi.sales.map((k) => [k.key, k.unit])) },
      payout: { commission: earnings.periodGreenTotal, multiplier: kpi.multiplier, payout: settlement.payable },
      settlement,
      discipline: await discipline(employeeId, kpi, earnings, ctx),
      recordings: await recordings(employeeId, "sales", ctx),
      plan: null,
      fleet: user.hasCompanyCar ? fleetCost(monthClients, config.fleetBands) : null,
      path: config.salesLevels.map((l) => ({
        level: l.level,
        title: l.title,
        requirement: l.clientsToReach === 0 ? "Start" : `${l.clientsToReach} klientów${l.level >= config.rules.salesStructureCountsFromLevel ? " zespołu" : ""}`,
        reached: l.level <= lp.current.level,
        current: l.level === lp.current.level,
      })),
      badges: badges(config, { clients: state.own, kpiMultiplier: kpi.multiplier, level: lp.current.level }),
      earnings,
    };
  }

  const state = auditorLevelState(employeeId, user.highestLevel, ctx);
  const lp = state.progress;
  const next = lp.next;
  const entries = auditorEntries(employeeId, ctx, state.timeline, lp.current.level);
  const earnings = summarize(entries, ctx);
  const kpi = await auditorKpi(employeeId, ctx);
  const plan = await auditorPlan(user, employeeId, kpi, entries, earnings.period, ctx);
  const settlement = settlementFor(earnings, kpi, [], plan.active === "safety" ? plan.closedMonthPay ?? 0 : undefined);

  return {
    track: "auditor",
    level: lp.current.level,
    title: lp.current.title,
    nextLevel: next?.level ?? null,
    nextTitle: next?.title ?? null,
    clientsCount: next?.countsStructure ? state.own + state.structure : state.own,
    clientsMissing: lp.clientsMissing,
    peopleMissing: lp.peopleMissing,
    progress: lp.progress,
    rates: [
      { label: "Próg podstawowy", current: formatPLN(lp.current.rates.basic), next: next ? formatPLN(next.rates.basic) : null },
      { label: "Próg podwyższony", current: formatPLN(lp.current.rates.elevated), next: next ? formatPLN(next.rates.elevated) : null },
      { label: "Próg najwyższy", current: formatPLN(lp.current.rates.highest), next: next ? formatPLN(next.rates.highest) : null },
      { label: "Bonus za zamknięcie", current: formatPLN(lp.current.closingBonus), next: next ? formatPLN(next.closingBonus) : null },
    ],
    kpi: { ...kpi, units: Object.fromEntries(config.kpi.auditor.map((k) => [k.key, k.unit])) },
    payout: { commission: earnings.periodGreenTotal, multiplier: kpi.multiplier, payout: settlement.payable },
    settlement,
    discipline: await discipline(employeeId, kpi, earnings, ctx),
    recordings: await recordings(employeeId, "auditor", ctx),
    plan: plan.view,
    fleet: null,
    path: config.auditorLevels.map((l) => ({
      level: l.level,
      title: l.title,
      requirement: l.clientsToReach === 0 ? "Start" : l.activePeopleToReach > 0 ? `${l.clientsToReach} klientów + ${l.activePeopleToReach} os.` : `${l.clientsToReach} klientów`,
      reached: l.level <= lp.current.level,
      current: l.level === lp.current.level,
    })),
    badges: badges(config, { clients: state.own, kpiMultiplier: kpi.multiplier, level: lp.current.level }),
    earnings,
  };
}

/**
 * System audytora: Safety (miesięcznie wg pomiarów) albo Next Level (tabela poziomów).
 * Safety za miesiąc wypłacamy w okresie z pierwszym dniem następnego miesiąca.
 */
async function auditorPlan(user: AppUser, employeeId: string, kpi: KpiResult, entries: CommissionEntry[], period: SettlementPeriod, ctx: PortfolioContext) {
  const source = getDataSource();
  const { config, now } = ctx;
  const [history, log] = await Promise.all([source.auditorPlanHistory(user.id), source.workLog(employeeId)]);
  const active = activePlan(history, now);
  const measured = auditorMeasurements(employeeId, ctx);
  const month = monthKey(now, ctx);
  const inMonth = (m: string) => measured.filter((x) => monthKey(x.at, ctx) === m);
  const contractType = user.contract?.type ?? "B2B";
  const pay = (m: string, hours: number) => safetyPay(inMonth(m).length, config.safety, { contractType, hoursWorked: hours, kpiMultiplier: kpi.multiplier });
  const current = pay(month, log.hoursThisMonth);
  const clientsThisMonth = new Set(inMonth(month).map((x) => x.clientId));
  const preview = entries.filter((e) => clientsThisMonth.has(e.clientId) && (e.state === "green" || e.state === "grey")).reduce((sum, e) => sum + e.amount, 0);
  // Zamknięty miesiąc w bieżącym okresie (godziny poprzedniego miesiąca — dziś brak danych → 0).
  const prev = previousMonth(month);
  const closedMonthPay = active === "safety" && monthSettledIn(prev, period) ? pay(prev, 0).total : null;
  const view: AuditorPlanView = {
    active,
    month,
    measurements: current.measurements,
    safety: current,
    nextTier: nextSafetyTier(current.measurements, config.safety),
    nextLevelPreview: roundMoney(preview * kpi.multiplier),
  };
  return { active, view, closedMonthPay };
}
