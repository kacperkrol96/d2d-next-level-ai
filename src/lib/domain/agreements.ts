import type { AgreementScope, AppConfig, CrmRules, InitialsCode, ScopeCode, StatusCategory } from "@/lib/config/types";
import type { ClientTerms, LeadRuleException, SalesAttribution } from "@/lib/data/types";
import { localDay } from "./settlement";
import type { CrmAgreement, CrmClient, CrmEmployee, CrmStatusChange } from "@/lib/crm/types";

/**
 * Rozpoznawanie danych z CRM: zakres z końcówki numeru, inicjały,
 * kategoria statusu, przypisania. Zasada: nic nie zgadujemy — wszystko
 * nierozpoznane trafia do kolejki „Do wyjaśnienia” (issues).
 */

/** Ujednolicenie tekstu: wielkie litery, pojedyncze spacje, bez spacji na brzegach. */
export function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLocaleUpperCase("pl-PL");
}

/** Końcówka/kod bez kropek, myślników i spacji (TERM. → TERM). */
function normalizeCode(text: string): string {
  return normalize(text).replace(/[^A-ZĄĆĘŁŃÓŚŹŻ0-9]/g, "");
}

export interface ParsedNumber {
  /** Pierwszy segment numeru (inicjały handlowca). */
  initials: string | null;
  /** Surowa końcówka (ostatni segment, jeśli nie jest liczbą). */
  suffix: string | null;
  scope: ScopeCode | null;
}

/** Numer w formacie INICJAŁY/NR/MM/RR[RR]/ZAKRES — zakres bywa pominięty. */
export function parseAgreementNumber(number: string, rules: CrmRules): ParsedNumber {
  const segments = number.split("/").map((s) => s.trim()).filter(Boolean);
  const first = segments[0] ?? "";
  const initials = /^\p{L}{2,4}$/u.test(first) ? normalizeCode(first) : null;
  const last = segments.length > 1 ? segments[segments.length - 1] : "";
  const suffix = last && !/^\d+$/.test(last) ? last : null;
  const code = suffix ? normalizeCode(suffix) : null;
  const scope = code ? (rules.scopeCodes.find((s) => s.codes.some((c) => normalizeCode(c) === code)) ?? null) : null;
  return { initials, suffix, scope };
}

export type StatusCategoryResult = StatusCategory | "ignored" | "unknown";

/** Kategoria statusu: znaczniki negatywne zawsze wygrywają; potem tabela admina. */
export function statusCategory(type: string, status: string, rules: CrmRules): StatusCategoryResult {
  const s = normalize(status);
  if (rules.negativeMarkers.some((m) => s.includes(normalize(m)))) return "negative";
  if (rules.ignoredStatuses.some((i) => normalize(i) === s)) return "ignored";
  const typeConfig = rules.agreementTypes.find((t) => normalize(t.name) === normalize(type));
  if (!typeConfig) return "unknown";
  const entry = Object.entries(typeConfig.categories).find(([name]) => normalize(name) === s);
  return entry ? entry[1] : "unknown";
}

function sortedHistory(history: readonly CrmStatusChange[]): CrmStatusChange[] {
  return [...history].sort((a, b) => a.at.localeCompare(b.at));
}

/** Obecny status z pominięciem ignorowanych (np. „WYLICZENIE PROWIZJI”). */
export function effectiveStatus(agreement: CrmAgreement, rules: CrmRules): CrmStatusChange | null {
  const history = sortedHistory(agreement.statusHistory);
  for (let i = history.length - 1; i >= 0; i--) {
    if (statusCategory(agreement.type, history[i].status, rules) !== "ignored") return history[i];
  }
  return null;
}

export function agreementCategory(agreement: CrmAgreement, rules: CrmRules): StatusCategoryResult {
  const current = effectiveStatus(agreement, rules);
  return current ? statusCategory(agreement.type, current.status, rules) : "unknown";
}

/** Pierwsza data wejścia w status o jednej z kategorii (np. kiedy prowizja zrobiła się zielona). */
export function reachedCategoryAt(agreement: CrmAgreement, categories: readonly StatusCategory[], rules: CrmRules): Date | null {
  const hit = sortedHistory(agreement.statusHistory).find((h) => {
    const c = statusCategory(agreement.type, h.status, rules);
    return c !== "ignored" && c !== "unknown" && categories.includes(c);
  });
  return hit ? new Date(hit.at) : null;
}

/** Pierwsze wejście w dokładnie ten status. */
export function enteredStatusAt(agreement: CrmAgreement, status: string): Date | null {
  const hit = sortedHistory(agreement.statusHistory).find((h) => normalize(h.status) === normalize(status));
  return hit ? new Date(hit.at) : null;
}

/** Indeks statusu na ścieżce typu umowy (−1, gdy brak). */
export function pathIndex(type: string, status: string, rules: CrmRules): number {
  const typeConfig = rules.agreementTypes.find((t) => normalize(t.name) === normalize(type));
  return typeConfig ? typeConfig.path.findIndex((p) => normalize(p) === normalize(status)) : -1;
}

/** Pierwsze wejście w status równy wskazanemu lub dalszy na ścieżce (bez negatywnych). */
export function reachedPathStatusAt(agreement: CrmAgreement, status: string, rules: CrmRules): Date | null {
  const target = pathIndex(agreement.type, status, rules);
  if (target === -1) return null;
  const hit = sortedHistory(agreement.statusHistory).find((h) => {
    const c = statusCategory(agreement.type, h.status, rules);
    return c !== "negative" && c !== "ignored" && pathIndex(agreement.type, h.status, rules) >= target;
  });
  return hit ? new Date(hit.at) : null;
}

// ------------------------------------------------------------------ inicjały (tylko podpowiedź)

/** Podpowiedź osoby z inicjałów: najdłuższy pasujący prefiks (RSZ przed RS). */
export function suggestFromInitials(initials: string | null, rules: CrmRules): InitialsCode | null {
  if (!initials) return null;
  const code = normalizeCode(initials);
  const matches = rules.initials.filter((i) => code.startsWith(normalizeCode(i.code)));
  return matches.sort((a, b) => normalizeCode(b.code).length - normalizeCode(a.code).length)[0] ?? null;
}

// ------------------------------------------------------------------ klient

export type IssueKind =
  | "missing_suffix"
  | "unknown_suffix"
  | "unknown_status"
  | "no_sales_person"
  | "sales_conflict"
  | "no_auditor"
  | "missing_income_tier"
  | "no_app_lead";

export interface Issue {
  kind: IssueKind;
  clientId: string;
  agreementId: string | null;
  agreementNumber: string | null;
  /** Czego dotyczy blokada: prowizji handlowca, audytora czy obu. */
  blocks: ("sales" | "auditor")[];
  message: string;
  /** Podpowiedź z inicjałów — do potwierdzenia przez admina jednym kliknięciem. */
  suggestion?: InitialsCode;
}

export interface ResolvedAgreement {
  agreement: CrmAgreement;
  scope: AgreementScope | null;
  scopeLabel: string | null;
  category: StatusCategoryResult;
  status: string | null;
}

export type SalesSource = "admin" | "app" | "client" | "history";

/** Stan reguły „Nie ma w aplikacji = nie ma klienta”. */
export type LeadRuleState = "ok" | "warning" | "blocked" | "not_applicable";

export interface ResolvedClient {
  client: CrmClient;
  terms: ClientTerms;
  salesId: string | null;
  salesSource: SalesSource | null;
  auditorId: string | null;
  agreements: ResolvedAgreement[];
  /** Umowy termo + źródło ciepła. */
  salesAgreements: ResolvedAgreement[];
  auditAgreement: ResolvedAgreement | null;
  leadRule: LeadRuleState;
  issues: Issue[];
}

export interface AppClientInputs {
  terms: readonly ClientTerms[];
  attributions: readonly SalesAttribution[];
  leadExceptions: readonly LeadRuleException[];
  now: Date;
}

const blocksFor = (scope: AgreementScope | null): ("sales" | "auditor")[] =>
  scope === "audit" ? ["auditor"] : scope === null ? ["sales", "auditor"] : ["sales"];

const sourceLabel: Record<SalesSource, string> = {
  admin: "decyzja admina",
  app: "aplikacja (Radar/lead)",
  client: "przypisany pracownik w CRM",
  history: "historia przypisań w CRM",
};

/**
 * Reguła „Nie ma w aplikacji = nie ma klienta”: lead musi powstać w aplikacji przed
 * podpisaniem umowy. Przed datą włączenia (albo dla umów podpisanych przed nią) — tylko ostrzeżenie.
 */
export function leadRuleState(
  hasSales: boolean,
  contractSignedAt: Date | null,
  leadAt: Date | null,
  hasException: boolean,
  now: Date,
  config: AppConfig,
): LeadRuleState {
  if (!hasSales) return "not_applicable";
  if (hasException) return "ok";
  if (leadAt && (!contractSignedAt || leadAt.getTime() <= contractSignedAt.getTime())) return "ok";
  const from = config.appLeadRule.enforceFrom;
  const today = localDay(now, config.timeZone);
  const signedDay = contractSignedAt ? localDay(contractSignedAt, config.timeZone) : today;
  return from && today >= from && signedDay >= from ? "blocked" : "warning";
}

/**
 * Ustalenie handlowca, audytora i zakresów klienta.
 * Handlowiec — źródła w kolejności: (1) aplikacja: Radar/lead, (2) przypisany pracownik
 * klienta w CRM, (3) historia przypisań w CRM. Różne osoby → „Do wyjaśnienia”.
 * Decyzja admina rozstrzyga. Inicjały z numeru są TYLKO podpowiedzią w kolejce.
 * Audytor = pole „user” z umowy audytowej (/A).
 */
export function resolveClient(
  client: CrmClient,
  agreements: readonly CrmAgreement[],
  employees: readonly CrmEmployee[],
  config: AppConfig,
  app: AppClientInputs,
): ResolvedClient {
  const rules = config.crm;
  const issues: Issue[] = [];
  const issue = (kind: IssueKind, a: CrmAgreement | null, blocks: ("sales" | "auditor")[], message: string, suggestion?: InitialsCode) =>
    issues.push({ kind, clientId: client.id, agreementId: a?.id ?? null, agreementNumber: a?.number ?? null, blocks, message, ...(suggestion ? { suggestion } : {}) });

  const resolved: ResolvedAgreement[] = agreements
    .filter((a) => a.clientId === client.id)
    .map((agreement) => {
      const parsed = parseAgreementNumber(agreement.number, rules);
      if (!parsed.suffix) issue("missing_suffix", agreement, ["sales", "auditor"], `Umowa ${agreement.number} nie ma końcówki zakresu`);
      else if (!parsed.scope) issue("unknown_suffix", agreement, ["sales", "auditor"], `Nierozpoznana końcówka „${parsed.suffix}” w umowie ${agreement.number}`);
      const current = effectiveStatus(agreement, rules);
      const category = agreementCategory(agreement, rules);
      if (category === "unknown") {
        issue("unknown_status", agreement, blocksFor(parsed.scope?.scope ?? null), `Nieznany status „${current?.status ?? "brak"}” (${agreement.type}) w umowie ${agreement.number}`);
      }
      return { agreement, scope: parsed.scope?.scope ?? null, scopeLabel: parsed.scope?.label ?? null, category, status: current?.status ?? null };
    });

  const salesAgreements = resolved.filter((r) => r.scope === "thermo" || r.scope === "heatSource");
  const auditAgreement = resolved.find((r) => r.scope === "audit") ?? null;
  const terms = app.terms.find((t) => t.clientId === client.id) ?? { clientId: client.id, incomeTier: null, surchargeNet: null, samVatFromOffer: null };

  // ---- Handlowiec
  const salesIds = new Set(employees.filter((e) => e.role === "sales").map((e) => e.id));
  const mine = app.attributions.filter((a) => a.clientId === client.id && salesIds.has(a.employeeId));
  const admin = [...mine].filter((a) => a.source === "admin").sort((a, b) => b.at.localeCompare(a.at))[0];
  let salesId: string | null = null;
  let salesSource: SalesSource | null = null;
  if (admin) {
    salesId = admin.employeeId;
    salesSource = "admin";
  } else {
    const candidates: { source: SalesSource; employeeId: string }[] = [];
    for (const a of mine) candidates.push({ source: "app", employeeId: a.employeeId });
    if (client.assignedEmployeeId && salesIds.has(client.assignedEmployeeId)) candidates.push({ source: "client", employeeId: client.assignedEmployeeId });
    const lastHistory = [...(client.assignmentHistory ?? [])].sort((a, b) => b.at.localeCompare(a.at)).find((h) => salesIds.has(h.employeeId));
    if (lastHistory) candidates.push({ source: "history", employeeId: lastHistory.employeeId });

    const distinct = [...new Set(candidates.map((c) => c.employeeId))];
    if (distinct.length === 1) {
      salesId = distinct[0];
      salesSource = candidates[0].source;
    } else if (distinct.length > 1) {
      const who = candidates.map((c) => `${employees.find((e) => e.id === c.employeeId)?.name ?? c.employeeId} (${sourceLabel[c.source]})`).join(" vs ");
      issue("sales_conflict", salesAgreements[0]?.agreement ?? null, ["sales"], `Źródła wskazują różnych handlowców: ${who}`);
    }
  }
  if (!salesId && salesAgreements.length > 0 && !issues.some((i) => i.kind === "sales_conflict")) {
    const first = salesAgreements[0].agreement;
    const suggestion = suggestFromInitials(parseAgreementNumber(first.number, rules).initials, rules);
    issue(
      "no_sales_person",
      first,
      ["sales"],
      suggestion
        ? `Brak handlowca w aplikacji i CRM. Podpowiedź z inicjałów „${suggestion.code}”: ${suggestion.personName} — do potwierdzenia`
        : `Brak handlowca w aplikacji i CRM; inicjały z umowy ${first.number} nie są w tabeli`,
      suggestion ?? undefined,
    );
  }

  // ---- Audytor
  let auditorId: string | null = null;
  if (auditAgreement) {
    const user = auditAgreement.agreement.userId;
    if (user && employees.some((e) => e.id === user && e.role === "auditor")) auditorId = user;
    else issue("no_auditor", auditAgreement.agreement, ["auditor"], `Umowa audytowa ${auditAgreement.agreement.number} nie wskazuje audytora`);
  }

  // ---- Próg dochodowy (tylko gdy potrzebny: stawka audytora, reguła „sam VAT”)
  if (!terms.incomeTier) {
    const blocks: ("sales" | "auditor")[] = [];
    if (auditAgreement) blocks.push("auditor");
    if (salesAgreements.length > 0 && terms.samVatFromOffer === null && config.samVat.enabled) blocks.push("sales");
    if (blocks.length) issue("missing_income_tier", null, blocks, "Brak progu dochodowego klienta (uzupełnia admin, docelowo z Konfiguratora)");
  }

  // ---- Reguła „Nie ma w aplikacji = nie ma klienta”
  const signedAt = salesAgreements
    .map((r) => enteredStatusAt(r.agreement, rules.milestones.contractSigned))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const lead = app.attributions
    .filter((a) => a.clientId === client.id && a.source === "lead")
    .sort((a, b) => a.at.localeCompare(b.at))[0];
  const leadRule = leadRuleState(
    salesAgreements.length > 0,
    signedAt,
    lead ? new Date(lead.at) : null,
    app.leadExceptions.some((e) => e.clientId === client.id),
    app.now,
    config,
  );
  if (leadRule === "blocked") issue("no_app_lead", salesAgreements[0]?.agreement ?? null, ["sales"], "Klient nie ma leadu w aplikacji sprzed umowy — prowizja i awans wstrzymane (wyjątek zatwierdza manager)");

  return { client, terms, salesId, salesSource, auditorId, agreements: resolved, salesAgreements, auditAgreement, leadRule, issues };
}

export function isBlocked(client: ResolvedClient, role: "sales" | "auditor"): boolean {
  return client.issues.some((i) => i.blocks.includes(role));
}
