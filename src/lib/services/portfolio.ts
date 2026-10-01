import "server-only";
import type { AppConfig, StatusCategory } from "@/lib/config/types";
import type { CrmAgreement, CrmEmployee } from "@/lib/crm/types";
import { getDataSource } from "@/lib/data";
import {
  enteredStatusAt,
  isBlocked,
  reachedCategoryAt,
  reachedPathStatusAt,
  resolveClient,
  type Issue,
  type ResolvedClient,
} from "@/lib/domain/agreements";
import { auditorClientCommission, isSamVat, salesClientPayments, type PaymentAgreement, type PaymentState } from "@/lib/domain/commission";
import { auditorLevelFor, levelTimeline, salesLevelFor, type ClientEvent } from "@/lib/domain/levels";
import { formatPLN, roundMoney } from "@/lib/domain/money";
import { isInPeriod, localDay, settlementPeriodFor, type SettlementPeriod } from "@/lib/domain/settlement";
import { buildTrajectory, statusChangesSince, type StatusChange, type Trajectory } from "@/lib/domain/trajectory";

/**
 * Portfel osoby: jej klienci z CRM, prowizje (z poziomem z chwili zazielenienia),
 * potrącenia po spadku w status negatywny i trajektorie umów.
 */

export type EntryState = PaymentState | "unresolved";

export interface CommissionEntry {
  /** base = prowizja (Solo / audytor), duoTopUp = „Dopłata do Duetu”, surchargeTopUp = „Dopłata nadmarży”. */
  kind: "base" | "duoTopUp" | "surchargeTopUp";
  clientId: string;
  clientName: string;
  city: string;
  crmUrl: string;
  state: EntryState;
  /** Kwota (ujemna dla potrącenia). */
  amount: number;
  /** Od kiedy prowizja jest zielona (ISO). */
  greenAt: string | null;
  /** Spadek w status negatywny (ISO) — dla potrąceń. */
  droppedAt: string | null;
  /** Poziom, wg którego policzono stawkę. */
  level: number;
  status: string;
  detail: string;
  /** Ile kroków do zielonej (najbliższa umowa), null = nie dotyczy. */
  stepsToGreen: number | null;
  /** Ostrzeżenie (np. brak leadu w aplikacji, zanim reguła zacznie blokować). */
  warning: string | null;
  /** Klient „sam VAT” (handlowiec) — dla dyferencji managera. */
  samVat?: boolean;
}

export interface Earnings {
  entries: CommissionEntry[];
  greenTotal: number;
  greyTotal: number;
  /** Zielone w bieżącym okresie (razem z dopłatami do Duetu). */
  periodGreenTotal: number;
  /** W tym „Dopłaty do Duetu” zielone w bieżącym okresie. */
  periodDuoTopUps: number;
  /** W tym „Dopłaty nadmarży” zielone w bieżącym okresie. */
  periodSurchargeTopUps: number;
  /** Potrącenia w bieżącym okresie (dodatnia kwota). */
  periodDeductions: number;
  period: SettlementPeriod;
  latestGreen: CommissionEntry | null;
}

export interface PortfolioContext {
  config: AppConfig;
  employees: CrmEmployee[];
  clients: ResolvedClient[];
  agreements: CrmAgreement[];
  now: Date;
}

export async function loadContext(now = new Date()): Promise<PortfolioContext> {
  const source = getDataSource();
  const crm = source.crm();
  const [config, employees, rawClients, agreements, app, squadrons] = await Promise.all([
    source.getConfig(),
    crm.listEmployees(),
    crm.listClients(),
    crm.listAgreements(),
    source.appClientData(),
    source.squadrons(),
  ]);
  const clients = rawClients.map((c) => resolveClient(c, agreements, employees, config, { ...app, now, squadrons }));
  return { config, employees, clients, agreements, now };
}

/** Wszyscy podlegli (rekurencyjnie) danej osobie z wybraną rolą. */
export function subordinatesOf(managerId: string, employees: readonly CrmEmployee[], role: CrmEmployee["role"]): CrmEmployee[] {
  const direct = employees.filter((e) => e.managerId === managerId);
  return direct.flatMap((e) => [...(e.role === role ? [e] : []), ...subordinatesOf(e.id, employees, role)]);
}

const earliest = (dates: (Date | null)[]): Date | null =>
  dates.filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

/** Kiedy umowa po zazielenieniu spadła w status negatywny. */
function droppedAfter(agreements: CrmAgreement[], after: Date, ctx: PortfolioContext): Date | null {
  return earliest(agreements.map((a) => reachedCategoryAt({ ...a, statusHistory: a.statusHistory.filter((h) => new Date(h.at) > after) }, ["negative"], ctx.config.crm)));
}

// ------------------------------------------------------------------ HANDLOWIEC

interface SalesFacts {
  rc: ResolvedClient;
  agreements: PaymentAgreement[];
  samVat: boolean;
  /** Pierwsze zazielenienie (klient liczy się do awansu od tej chwili). */
  greenAt: Date | null;
  /** Utrata wszystkich zielonych umów (rezygnacja) — odejmuje klienta z licznika. */
  droppedAt: Date | null;
}

function salesFacts(rc: ResolvedClient, ctx: PortfolioContext): SalesFacts {
  const rules = ctx.config.crm;
  const agreements: PaymentAgreement[] = rc.salesAgreements.map((r) => {
    const greenAt = reachedCategoryAt(r.agreement, ["sales_earned"], rules);
    const negative = r.category === "negative";
    return {
      scope: r.scope as PaymentAgreement["scope"],
      category: r.category as StatusCategory,
      valueNet: r.agreement.valueNet,
      greenAt,
      droppedAt: greenAt && negative ? droppedAfter([r.agreement], greenAt, ctx) : null,
    };
  });
  const hasActiveRek = rc.agreements.some((r) => r.scope === "rek" && r.category !== "negative");
  const greenAt = earliest(agreements.map((a) => a.greenAt));
  const earned = agreements.filter((a) => a.greenAt);
  const lostAll = earned.length > 0 && earned.every((a) => a.category === "negative");
  const droppedAt = lostAll ? earned.map((a) => a.droppedAt).filter((d): d is Date => !!d).sort((x, y) => y.getTime() - x.getTime())[0] ?? null : null;
  return { rc, agreements, samVat: isSamVat(rc.terms, hasActiveRek, ctx.config) ?? false, greenAt, droppedAt };
}

function salesEvents(employeeId: string, ctx: PortfolioContext): ClientEvent[] {
  const team = new Set(subordinatesOf(employeeId, ctx.employees, "sales").map((e) => e.id));
  return ctx.clients
    .filter((rc) => !isBlocked(rc, "sales") && rc.salesId && (rc.salesId === employeeId || team.has(rc.salesId)))
    .map((rc) => ({ rc, f: salesFacts(rc, ctx) }))
    .filter(({ f }) => f.greenAt)
    .map(({ rc, f }) => ({ at: f.greenAt!, droppedAt: f.droppedAt, structure: rc.salesId !== employeeId }));
}

export function salesLevelState(employeeId: string, highestLevel: number, ctx: PortfolioContext) {
  const { config } = ctx;
  const events = salesEvents(employeeId, ctx);
  const levelFor = (own: number, structure: number) =>
    salesLevelFor({ ownClients: own, structureClients: structure }, config.salesLevels, config.rules.salesStructureCountsFromLevel).current.level;
  const timeline = levelTimeline(events, levelFor);
  const counted = (e: ClientEvent) => !e.droppedAt || e.droppedAt > ctx.now;
  const own = events.filter((e) => !e.structure && counted(e)).length;
  const structure = events.filter((e) => e.structure && counted(e)).length;
  const progress = salesLevelFor(
    { ownClients: own, structureClients: structure, previousLevel: Math.max(highestLevel, timeline(ctx.now)) },
    config.salesLevels,
    config.rules.salesStructureCountsFromLevel,
  );
  return { timeline, own, structure, progress };
}

const PAYMENT_LABEL = { base: "Solo", duoTopUp: "Dopłata do Duetu", surchargeTopUp: "Dopłata nadmarży" } as const;

export function salesEntries(employeeId: string, ctx: PortfolioContext, timeline: (t: Date) => number, currentLevel: number): CommissionEntry[] {
  const { config } = ctx;
  return ctx.clients
    .filter((rc) => rc.salesId === employeeId && rc.salesAgreements.length > 0)
    .flatMap((rc): CommissionEntry[] => {
      const base = {
        clientId: rc.client.id,
        clientName: rc.client.displayName,
        city: rc.client.city,
        crmUrl: rc.client.crmUrl,
        status: rc.salesAgreements.map((r) => r.status ?? "—").join(" · "),
        stepsToGreen: minSteps(rc, "sales", ctx),
        warning: rc.leadRule === "warning" ? "Ten klient nie ma leadu w aplikacji" : null,
      };
      if (isBlocked(rc, "sales")) {
        return [{ ...base, kind: "base", state: "unresolved", amount: 0, greenAt: null, droppedAt: null, level: currentLevel, detail: issueText(rc, "sales") }];
      }
      const f = salesFacts(rc, ctx);
      // Stawka wg poziomu sprzed klienta (z chwili pierwszego zazielenienia).
      const level = f.greenAt ? timeline(f.greenAt) : currentLevel;
      const levelConfig = config.salesLevels.find((l) => l.level === level)!;
      const payments = salesClientPayments(
        {
          agreements: f.agreements,
          samVat: f.samVat,
          surchargeNet: rc.terms.surchargeNet,
          surchargeSetAt: rc.terms.surchargeSetAt ? new Date(rc.terms.surchargeSetAt) : null,
        },
        levelConfig,
        config,
      );
      const notes: string[] = [];
      if (f.samVat) notes.push(`sam VAT −${Math.round(config.rules.samVatReduction * 100)}%`);
      if (rc.terms.surchargeNet === null) notes.push("nadmarża nieuzupełniona");
      notes.push(`poziom ${level}`);
      return payments.map((p) => {
        const label = PAYMENT_LABEL[p.kind];
        const detail = [label, ...notes].join(" · ");
        return {
          ...base,
          samVat: f.samVat,
          kind: p.kind,
          state: p.state,
          amount: p.amount,
          greenAt: p.greenAt?.toISOString() ?? null,
          droppedAt: p.droppedAt?.toISOString() ?? null,
          level,
          detail: p.state === "clawback" ? `Potrącenie: status negatywny po wypłacie · ${detail}` : detail,
        };
      });
    });
}

// ------------------------------------------------------------------ AUDYTOR

function auditGreenAt(rc: ResolvedClient, ctx: PortfolioContext): Date | null {
  return rc.auditAgreement ? reachedCategoryAt(rc.auditAgreement.agreement, ["auditor_earned"], ctx.config.crm) : null;
}

export function auditorLevelState(employeeId: string, highestLevel: number, ctx: PortfolioContext) {
  const { config } = ctx;
  const team = subordinatesOf(employeeId, ctx.employees, "auditor");
  const teamIds = new Set(team.map((e) => e.id));
  const events: ClientEvent[] = ctx.clients
    .filter((rc) => !isBlocked(rc, "auditor") && rc.auditorId && (rc.auditorId === employeeId || teamIds.has(rc.auditorId)))
    .map((rc) => ({ rc, at: auditGreenAt(rc, ctx) }))
    .filter((x): x is { rc: ResolvedClient; at: Date } => x.at !== null)
    .map(({ rc, at }) => ({
      at,
      droppedAt: rc.auditAgreement!.category === "negative" ? droppedAfter([rc.auditAgreement!.agreement], at, ctx) : null,
      structure: rc.auditorId !== employeeId,
    }));
  const levelFor = (own: number, structure: number) =>
    auditorLevelFor({ ownClients: own, structureClients: structure, activePeople: team.length }, config.auditorLevels).current.level;
  const timeline = levelTimeline(events, levelFor);
  const counted = (e: ClientEvent) => !e.droppedAt || e.droppedAt > ctx.now;
  const own = events.filter((e) => !e.structure && counted(e)).length;
  const structure = events.filter((e) => e.structure && counted(e)).length;
  const progress = auditorLevelFor(
    { ownClients: own, structureClients: structure, activePeople: team.length, previousLevel: Math.max(highestLevel, timeline(ctx.now)) },
    config.auditorLevels,
  );
  return { timeline, own, structure, progress, team };
}

export function auditorEntries(employeeId: string, ctx: PortfolioContext, timeline: (t: Date) => number, currentLevel: number): CommissionEntry[] {
  const { config } = ctx;
  const tierLabel = { basic: "podstawowy", elevated: "podwyższony", highest: "najwyższy" } as const;
  const entries: CommissionEntry[] = [];
  for (const rc of ctx.clients) {
    if (rc.auditorId !== employeeId || !rc.auditAgreement) continue;
    const base = {
      clientId: rc.client.id,
      clientName: rc.client.displayName,
      city: rc.client.city,
      crmUrl: rc.client.crmUrl,
      status: rc.auditAgreement.status ?? "—",
      stepsToGreen: minSteps(rc, "auditor", ctx),
      kind: "base" as const,
      warning: null,
    };
    if (isBlocked(rc, "auditor")) {
      entries.push({ ...base, state: "unresolved", amount: 0, greenAt: null, droppedAt: null, level: currentLevel, detail: issueText(rc, "auditor") });
      continue;
    }
    const greenAt = auditGreenAt(rc, ctx);
    const level = greenAt ? timeline(greenAt) : currentLevel;
    const levelConfig = config.auditorLevels.find((l) => l.level === level)!;
    const salesClosed = !isBlocked(rc, "sales") && salesFacts(rc, ctx).agreements.some((a) => a.category === "sales_earned");
    const tier = rc.terms.incomeTier!; // brak progu blokuje audytora (missing_income_tier)
    const c = auditorClientCommission({ auditCategory: rc.auditAgreement.category as StatusCategory, salesClosed, incomeTier: tier }, levelConfig);
    if (c.state === "none") continue;
    const parts = [`Próg ${tierLabel[tier]} ${formatPLN(c.rate)}`];
    if (c.closingBonus > 0) parts.push(`bonus za zamknięcie ${formatPLN(c.closingBonus)}`);
    else if (c.potentialClosingBonus > 0) parts.push(`+${formatPLN(c.potentialClosingBonus)} gdy handlowiec zamknie`);
    parts.push(`poziom ${level}`);
    const droppedAt = c.state === "cancelled" && greenAt ? droppedAfter([rc.auditAgreement.agreement], greenAt, ctx) : null;
    if (droppedAt && greenAt) {
      const original = auditorClientCommission({ auditCategory: "auditor_earned", salesClosed, incomeTier: tier }, levelConfig);
      entries.push({ ...base, state: "clawback", amount: -original.total, greenAt: greenAt.toISOString(), droppedAt: droppedAt.toISOString(), level, detail: `Potrącenie: status negatywny po wypłacie · ${parts.join(" · ")}` });
      continue;
    }
    entries.push({ ...base, state: c.state, amount: c.total, greenAt: greenAt?.toISOString() ?? null, droppedAt: null, level, detail: parts.join(" · ") });
  }
  return entries;
}

/**
 * Pomiary audytora (Safety): pomiar po pozytywnej weryfikacji — umowa /A w „TWORZENIE OFERTY” lub dalej
 * (ta sama chwila, co zielona prowizja audytora) — z datą wejścia.
 */
export function auditorMeasurements(employeeId: string, ctx: PortfolioContext): { clientId: string; at: Date }[] {
  return ctx.clients
    .filter((rc) => rc.auditorId === employeeId && rc.auditAgreement && !isBlocked(rc, "auditor"))
    .map((rc) => ({ clientId: rc.client.id, at: reachedCategoryAt(rc.auditAgreement!.agreement, ["auditor_earned"], ctx.config.crm) }))
    .filter((m): m is { clientId: string; at: Date } => m.at !== null);
}

// ------------------------------------------------------------------ wspólne

function issueText(rc: ResolvedClient, role: "sales" | "auditor"): string {
  return `Do wyjaśnienia: ${rc.issues.filter((i) => i.blocks.includes(role)).map((i) => i.message).join("; ")}`;
}

function minSteps(rc: ResolvedClient, role: "sales" | "auditor", ctx: PortfolioContext): number | null {
  const list = role === "sales" ? rc.salesAgreements : rc.auditAgreement ? [rc.auditAgreement] : [];
  const steps = list.map((r) => buildTrajectory(r.agreement, r.scope, ctx.config.crm).stepsToGreen).filter((s): s is number => s !== null);
  return steps.length ? Math.min(...steps) : null;
}

export function summarize(entries: CommissionEntry[], ctx: PortfolioContext): Earnings {
  const { config, now } = ctx;
  const period = settlementPeriodFor(now, config.settlementPeriods, config.timeZone);
  const inPeriod = (iso: string | null) => iso !== null && isInPeriod(new Date(iso), period, config.timeZone);
  const green = entries.filter((e) => e.state === "green");
  // Potrącamy tylko prowizje zielone w okresie wcześniejszym niż spadek (czyli już wypłacone).
  const deductions = entries.filter((e) => e.state === "clawback" && inPeriod(e.droppedAt) && !inPeriod(e.greenAt));
  const latestGreen = [...green].sort((a, b) => (b.greenAt ?? "").localeCompare(a.greenAt ?? ""))[0] ?? null;
  return {
    entries,
    greenTotal: roundMoney(green.reduce((s, e) => s + e.amount, 0)),
    greyTotal: roundMoney(entries.filter((e) => e.state === "grey").reduce((s, e) => s + e.amount, 0)),
    periodGreenTotal: roundMoney(green.filter((e) => inPeriod(e.greenAt)).reduce((s, e) => s + e.amount, 0)),
    periodDuoTopUps: roundMoney(green.filter((e) => e.kind === "duoTopUp" && inPeriod(e.greenAt)).reduce((s, e) => s + e.amount, 0)),
    periodSurchargeTopUps: roundMoney(green.filter((e) => e.kind === "surchargeTopUp" && inPeriod(e.greenAt)).reduce((s, e) => s + e.amount, 0)),
    periodDeductions: roundMoney(-deductions.reduce((s, e) => s + e.amount, 0)),
    period,
    latestGreen,
  };
}

/** Klienci osoby (handlowiec: przypisani; audytor: z jego umów /A). */
export function clientsOf(employeeId: string, track: "sales" | "auditor", ctx: PortfolioContext): ResolvedClient[] {
  return ctx.clients.filter((rc) => (track === "sales" ? rc.salesId === employeeId : rc.auditorId === employeeId));
}

export interface ClientTrajectory {
  client: ResolvedClient;
  trajectories: Trajectory[];
}

export function trajectoriesOf(employeeId: string, track: "sales" | "auditor", ctx: PortfolioContext): ClientTrajectory[] {
  return clientsOf(employeeId, track, ctx).map((rc) => ({
    client: rc,
    trajectories: rc.agreements.map((r) => buildTrajectory(r.agreement, r.scope, ctx.config.crm)),
  }));
}

/** Zmiany statusów u klientów osoby (do powiadomień „Biuro przesunęło umowę…”). */
export function officeMoves(employeeId: string, track: "sales" | "auditor", since: Date, ctx: PortfolioContext): (StatusChange & { clientName: string })[] {
  const clients = clientsOf(employeeId, track, ctx);
  const names = new Map(clients.map((rc) => [rc.client.id, rc.client.displayName]));
  const agreements = clients.flatMap((rc) => rc.agreements.map((r) => r.agreement));
  return statusChangesSince(agreements, since, ctx.config.crm).map((c) => ({ ...c, clientName: names.get(c.clientId) ?? "" }));
}

export function allIssues(ctx: PortfolioContext): (Issue & { clientName: string })[] {
  return ctx.clients.flatMap((rc) => rc.issues.map((i) => ({ ...i, clientName: rc.client.displayName })));
}

// ------------------------------------------------------------------ KPI (surowe wartości)

export function salesKpiRaw(employeeId: string, ctx: PortfolioContext) {
  const { milestones } = ctx.config.crm;
  const own = clientsOf(employeeId, "sales", ctx);
  const offers = own
    .filter((rc) => rc.auditAgreement)
    .map((rc) => ({
      handedOverAt: enteredStatusAt(rc.auditAgreement!.agreement, milestones.offerHandedOver),
      signedAt: earliest(rc.salesAgreements.map((r) => enteredStatusAt(r.agreement, milestones.contractSigned))),
    }))
    .filter((o): o is { handedOverAt: Date; signedAt: Date | null } => o.handedOverAt !== null);
  const documents = own
    .map((rc) => ({
      signedAt: earliest(rc.salesAgreements.map((r) => enteredStatusAt(r.agreement, milestones.contractSigned))),
      documentsCompleteAt: earliest(rc.salesAgreements.map((r) => reachedPathStatusAt(r.agreement, milestones.documentsComplete, ctx.config.crm))),
    }))
    .filter((d): d is { signedAt: Date; documentsCompleteAt: Date | null } => d.signedAt !== null);
  return { offers, documents };
}

export function monthKey(date: Date, ctx: PortfolioContext): string {
  return localDay(date, ctx.config.timeZone).slice(0, 7);
}

/** Oferty od audytorów czekające na podpis (start: umowa /A w „PRZEKAZANA DO PH”). */
export function offersWaiting(employeeId: string, ctx: PortfolioContext) {
  const { milestones } = ctx.config.crm;
  return clientsOf(employeeId, "sales", ctx)
    .map((rc) => ({ rc, handedOverAt: rc.auditAgreement ? enteredStatusAt(rc.auditAgreement.agreement, milestones.offerHandedOver) : null }))
    // Każda umowa poza audytem (także z nierozpoznaną końcówką) oznacza, że oferta została już podpisana.
    .filter(({ rc, handedOverAt }) => handedOverAt && !rc.agreements.some((r) => r.scope !== "audit" && enteredStatusAt(r.agreement, milestones.contractSigned)))
    .map(({ rc, handedOverAt }) => ({ clientId: rc.client.id, clientName: rc.client.displayName, city: rc.client.city, handedOverAt: handedOverAt!.toISOString() }));
}

/** Pierwsze zazielenienie umów termo / źródło klienta (np. klient eskadry). */
export function reachedCategoryAtSafe(rc: ResolvedClient, ctx: PortfolioContext): Date | null {
  return earliest(rc.salesAgreements.map((r) => reachedCategoryAt(r.agreement, ["sales_earned"], ctx.config.crm)));
}
