import "server-only";
import { getConfig } from "@/lib/config";
import type { AppConfig, AuditorLevel, SalesLevel } from "@/lib/config/types";
import { getCrm, currentStatus, enteredStatusAt, reachedStatusAt, resolveAssignment } from "@/lib/crm";
import type { CrmClient, CrmEmployee } from "@/lib/crm/types";
import { mockActivity, mockCompanyTargetPct } from "@/lib/crm/mock-activity";
import type { AppUser } from "@/lib/auth/users";
import { auditorClientCommission, applyKpiMultiplier, salesClientCommission, type CommissionState } from "@/lib/domain/commission";
import { averageOfferSignDays, computeKpi, documentsOnTimeRate, fiveStarReviewRate, type KpiResult } from "@/lib/domain/kpi";
import { auditorLevelFor, salesLevelFor } from "@/lib/domain/levels";
import { fleetCost, type FleetResult } from "@/lib/domain/fleet";
import { settlementPeriodFor } from "@/lib/domain/settlement";
import { formatPLN, roundMoney } from "@/lib/domain/money";

export interface CommissionEntry {
  clientId: string;
  clientName: string;
  city: string;
  crmUrl: string;
  state: CommissionState;
  amount: number;
  /** Data, od której prowizja jest zielona (ISO). */
  greenAt: string | null;
  status: string;
  detail: string;
}

export interface Earnings {
  entries: CommissionEntry[];
  greenTotal: number;
  greyTotal: number;
  periodGreenTotal: number;
  period: { start: string; end: string };
  latestGreen: CommissionEntry | null;
}

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
  fleet: FleetResult | null;
  path: { level: number; title: string; requirement: string; reached: boolean; current: boolean }[];
  badges: { key: string; label: string; description: string; earned: boolean }[];
  earnings: Earnings;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function periodOf(config: AppConfig, now: Date) {
  return settlementPeriodFor(now, config.rules.settlementAnchorDate, config.rules.settlementPeriodDays);
}

function summarize(entries: CommissionEntry[], config: AppConfig, now: Date): Earnings {
  const period = periodOf(config, now);
  const green = entries.filter((e) => e.state === "green");
  const inPeriod = green.filter((e) => e.greenAt && new Date(e.greenAt) >= period.start && new Date(e.greenAt) < period.end);
  const latestGreen = [...green].sort((a, b) => (b.greenAt ?? "").localeCompare(a.greenAt ?? ""))[0] ?? null;
  return {
    entries,
    greenTotal: roundMoney(green.reduce((s, e) => s + e.amount, 0)),
    greyTotal: roundMoney(entries.filter((e) => e.state === "grey").reduce((s, e) => s + e.amount, 0)),
    periodGreenTotal: roundMoney(inPeriod.reduce((s, e) => s + e.amount, 0)),
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    latestGreen,
  };
}

// ------------------------------------ HANDLOWIEC ------------------------------------

function salesEntries(clients: CrmClient[], level: SalesLevel, config: AppConfig): CommissionEntry[] {
  return clients.map((client) => {
    const status = currentStatus(client.salesStatusHistory) ?? "—";
    const c = salesClientCommission({ status, mode: client.mode, agreements: client.agreements }, level, config);
    const greenAt = c.state === "green" ? reachedStatusAt(client.salesStatusHistory, config.rules.salesGreenFromStatus, config.pipelines.sales) : null;
    const parts = [`${client.mode === "solo" ? "Solo" : "Duet"} ${formatPLN(c.base)}`];
    if (c.samVat) parts.push("sam VAT");
    if (c.surchargePart > 0) parts.push(`nadmarża ${formatPLN(c.surchargePart)}`);
    return {
      clientId: client.id,
      clientName: client.displayName,
      city: client.city,
      crmUrl: client.crmUrl,
      state: c.state,
      amount: c.state === "cancelled" ? 0 : c.total,
      greenAt: greenAt?.toISOString() ?? null,
      status,
      detail: parts.join(" · "),
    };
  });
}

function salesKpiValues(clients: CrmClient[], employee: CrmEmployee, employees: CrmEmployee[], allClients: CrmClient[], config: AppConfig, now: Date) {
  const { milestones } = config.pipelines;
  const offers = clients
    .map((c) => ({ handedOverAt: enteredStatusAt(c.salesStatusHistory, milestones.offerHandedOver), signedAt: enteredStatusAt(c.salesStatusHistory, milestones.contractSigned) }))
    .filter((o): o is { handedOverAt: Date; signedAt: Date | null } => o.handedOverAt !== null);
  const signed = clients
    .map((c) => ({ signedAt: enteredStatusAt(c.salesStatusHistory, milestones.contractSigned), documentsCompleteAt: enteredStatusAt(c.salesStatusHistory, milestones.documentsComplete) }))
    .filter((o): o is { signedAt: Date; documentsCompleteAt: Date | null } => o.signedAt !== null);

  const auditors = employees.filter((e) => e.role === "auditor" && e.managerId === employee.id);
  const auditorScores = auditors.map((a) => auditorKpi(a, allClients, config).score);

  return {
    five_star_reviews: fiveStarReviewRate(offers.length, mockActivity[employee.id]?.approvedFiveStarReviews ?? 0),
    documents_24h: documentsOnTimeRate(signed, now, config.rules.documentsDeadlineHours),
    team_auditors_kpi: auditorScores.length ? roundMoney(auditorScores.reduce((a, b) => a + b, 0) / auditorScores.length) : null,
    offer_sign_time: averageOfferSignDays(offers, now, config.rules.offerSignCapDays),
    company_result: mockCompanyTargetPct,
  };
}

// ------------------------------------ AUDYTOR ------------------------------------

function auditorKpi(employee: CrmEmployee, _clients: CrmClient[], config: AppConfig): KpiResult {
  const raw = mockActivity[employee.id]?.auditorKpi;
  return computeKpi(config.kpi.auditor, { ...raw, company_target: mockCompanyTargetPct }, config.kpiBands);
}

function auditorEntries(clients: CrmClient[], level: AuditorLevel, config: AppConfig): CommissionEntry[] {
  const tierLabel = { basic: "podstawowy", elevated: "podwyższony", highest: "najwyższy" } as const;
  return clients.map((client) => {
    const auditStatus = currentStatus(client.auditStatusHistory) ?? "—";
    const salesStatus = currentStatus(client.salesStatusHistory) ?? "—";
    const c = auditorClientCommission({ auditStatus, salesStatus, incomeTier: client.incomeTier }, level, config);
    const greenAt = c.state === "green" ? reachedStatusAt(client.auditStatusHistory, config.rules.auditorGreenFromStatus, config.pipelines.audit) : null;
    const parts = [`Próg ${tierLabel[client.incomeTier]} ${formatPLN(c.rate)}`];
    if (c.closingBonus > 0) parts.push(`bonus za zamknięcie ${formatPLN(c.closingBonus)}`);
    else if (c.potentialClosingBonus > 0) parts.push(`+${formatPLN(c.potentialClosingBonus)} gdy handlowiec zamknie`);
    return {
      clientId: client.id,
      clientName: client.displayName,
      city: client.city,
      crmUrl: client.crmUrl,
      state: c.state,
      amount: c.total,
      greenAt: greenAt?.toISOString() ?? null,
      status: auditStatus,
      detail: parts.join(" · "),
    };
  });
}

// ------------------------------------ WSPÓLNE ------------------------------------

function badges(config: AppConfig, data: { clients: number; kpiMultiplier: number; level: number }) {
  return config.badges.map((b) => ({ key: b.key, label: b.label, description: b.description, earned: data[b.metric] >= b.min }));
}

async function loadCrm() {
  const crm = getCrm();
  const [employees, clients] = await Promise.all([crm.listEmployees(), crm.listClients()]);
  return { employees, clients: clients.map((c) => ({ client: c, ...resolveAssignment(c, employees) })) };
}

export async function getEarnings(user: AppUser, now = new Date()): Promise<Earnings | null> {
  const orbit = await getOrbitData(user, now);
  return orbit?.earnings ?? null;
}

export async function getOrbitData(user: AppUser, now = new Date()): Promise<OrbitData | null> {
  if (!user.crmEmployeeId || !user.track) return null;
  const config = await getConfig();
  const { employees, clients } = await loadCrm();
  const employee = employees.find((e) => e.id === user.crmEmployeeId);
  if (!employee) return null;
  const allClients = clients.map((c) => c.client);

  if (user.track === "sales") {
    const own = clients.filter((c) => c.salesId === employee.id).map((c) => c.client);
    const probeLevel = config.salesLevels[0];
    const greenCount = salesEntries(own, probeLevel, config).filter((e) => e.state === "green").length;
    const lp = salesLevelFor(greenCount, config.salesLevels, user.highestLevel);
    const entries = salesEntries(own, lp.current, config);
    const earnings = summarize(entries, config, now);
    const kpi = computeKpi(config.kpi.sales, salesKpiValues(own, employee, employees, allClients, config, now), config.kpiBands);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthClients = entries.filter((e) => e.state === "green" && e.greenAt && new Date(e.greenAt) >= monthStart).length;

    return {
      track: "sales",
      level: lp.current.level,
      title: lp.current.title,
      nextLevel: lp.next?.level ?? null,
      nextTitle: lp.next?.title ?? null,
      clientsCount: greenCount,
      clientsMissing: lp.clientsMissing,
      peopleMissing: 0,
      progress: lp.progress,
      rates: [
        { label: "Klient solo", current: formatPLN(lp.current.soloRate), next: lp.next ? formatPLN(lp.next.soloRate) : null },
        { label: "Klient w duecie", current: formatPLN(lp.current.duoRate), next: lp.next ? formatPLN(lp.next.duoRate) : null },
        { label: "Udział w nadmarży", current: pct(lp.current.surchargeShare), next: lp.next ? pct(lp.next.surchargeShare) : null },
      ],
      kpi: { ...kpi, units: Object.fromEntries(config.kpi.sales.map((k) => [k.key, k.unit])) },
      payout: { commission: earnings.periodGreenTotal, multiplier: kpi.multiplier, payout: applyKpiMultiplier(earnings.periodGreenTotal, kpi.multiplier) },
      fleet: user.hasCompanyCar ? fleetCost(monthClients, config.fleetBands) : null,
      path: config.salesLevels.map((l) => ({
        level: l.level,
        title: l.title,
        requirement: l.clientsToReach === 0 ? "Start" : `${l.clientsToReach} klientów`,
        reached: l.level <= lp.current.level,
        current: l.level === lp.current.level,
      })),
      badges: badges(config, { clients: greenCount, kpiMultiplier: kpi.multiplier, level: lp.current.level }),
      earnings,
    };
  }

  // Audytor
  const own = clients.filter((c) => c.auditorId === employee.id).map((c) => c.client);
  const probe = auditorEntries(own, config.auditorLevels[0], config);
  const ownClients = probe.filter((e) => e.state === "green").length;
  const team = employees.filter((e) => e.managerId === employee.id);
  const structureClients = clients.filter((c) => c.auditorId && team.some((t) => t.id === c.auditorId)).length;
  const lp = auditorLevelFor({ ownClients, structureClients, activePeople: team.length, previousLevel: user.highestLevel }, config.auditorLevels);
  const entries = auditorEntries(own, lp.current, config);
  const earnings = summarize(entries, config, now);
  const kpi = auditorKpi(employee, allClients, config);
  const next = lp.next;

  return {
    track: "auditor",
    level: lp.current.level,
    title: lp.current.title,
    nextLevel: next?.level ?? null,
    nextTitle: next?.title ?? null,
    clientsCount: ownClients,
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
    payout: { commission: earnings.periodGreenTotal, multiplier: kpi.multiplier, payout: applyKpiMultiplier(earnings.periodGreenTotal, kpi.multiplier) },
    fleet: null,
    path: config.auditorLevels.map((l) => ({
      level: l.level,
      title: l.title,
      requirement: l.clientsToReach === 0 ? "Start" : l.activePeopleToReach > 0 ? `${l.clientsToReach} klientów + ${l.activePeopleToReach} os.` : `${l.clientsToReach} klientów`,
      reached: l.level <= lp.current.level,
      current: l.level === lp.current.level,
    })),
    badges: badges(config, { clients: ownClients, kpiMultiplier: kpi.multiplier, level: lp.current.level }),
    earnings,
  };
}
