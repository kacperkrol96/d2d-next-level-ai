import type { AgreementScope, AppConfig, CrmRules, ScopeCode, StatusCategory } from "@/lib/config/types";
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

// ------------------------------------------------------------------ klient

export type IssueKind =
  | "missing_suffix"
  | "unknown_suffix"
  | "unknown_status"
  | "no_sales_person"
  | "unknown_initials"
  | "no_auditor";

export interface Issue {
  kind: IssueKind;
  clientId: string;
  agreementId: string | null;
  agreementNumber: string | null;
  /** Czego dotyczy blokada: prowizji handlowca, audytora czy obu. */
  blocks: ("sales" | "auditor")[];
  message: string;
}

export interface ResolvedAgreement {
  agreement: CrmAgreement;
  scope: AgreementScope | null;
  scopeLabel: string | null;
  category: StatusCategoryResult;
  status: string | null;
}

export interface ResolvedClient {
  client: CrmClient;
  salesId: string | null;
  salesSource: "client" | "initials" | null;
  auditorId: string | null;
  agreements: ResolvedAgreement[];
  /** Umowy termo + źródło ciepła. */
  salesAgreements: ResolvedAgreement[];
  auditAgreement: ResolvedAgreement | null;
  issues: Issue[];
}

const blocksFor = (scope: AgreementScope | null): ("sales" | "auditor")[] =>
  scope === "audit" ? ["auditor"] : scope === null ? ["sales", "auditor"] : ["sales"];

/**
 * Ustalenie handlowca, audytora i zakresów klienta.
 * - handlowiec = przypisany pracownik klienta; awaryjnie inicjały z numeru umowy sprzedażowej,
 * - audytor = pole „user” z umowy audytowej (/A).
 */
export function resolveClient(client: CrmClient, agreements: readonly CrmAgreement[], employees: readonly CrmEmployee[], config: AppConfig): ResolvedClient {
  const rules = config.crm;
  const issues: Issue[] = [];
  const issue = (kind: IssueKind, a: CrmAgreement | null, blocks: ("sales" | "auditor")[], message: string) =>
    issues.push({ kind, clientId: client.id, agreementId: a?.id ?? null, agreementNumber: a?.number ?? null, blocks, message });

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

  // Handlowiec
  const employeeIds = new Set(employees.map((e) => e.id));
  let salesId: string | null = null;
  let salesSource: ResolvedClient["salesSource"] = null;
  if (client.assignedEmployeeId && employeeIds.has(client.assignedEmployeeId)) {
    salesId = client.assignedEmployeeId;
    salesSource = "client";
  } else if (salesAgreements.length > 0) {
    const first = salesAgreements[0].agreement;
    const parsed = parseAgreementNumber(first.number, rules);
    const match = parsed.initials ? rules.initials.find((i) => normalize(i.code) === parsed.initials) : undefined;
    if (match) {
      salesId = match.employeeId;
      salesSource = "initials";
    } else {
      issue("unknown_initials", first, ["sales"], `Brak handlowca przy kliencie, a inicjały „${parsed.initials ?? "—"}” z umowy ${first.number} nie są w tabeli`);
    }
  }
  if (salesAgreements.length > 0 && !salesId && !issues.some((i) => i.kind === "unknown_initials")) {
    issue("no_sales_person", salesAgreements[0].agreement, ["sales"], "Nie da się ustalić handlowca klienta");
  }

  // Audytor
  let auditorId: string | null = null;
  if (auditAgreement) {
    const user = auditAgreement.agreement.userId;
    if (user && employees.some((e) => e.id === user && e.role === "auditor")) auditorId = user;
    else issue("no_auditor", auditAgreement.agreement, ["auditor"], `Umowa audytowa ${auditAgreement.agreement.number} nie wskazuje audytora`);
  }

  return { client, salesId, salesSource, auditorId, agreements: resolved, salesAgreements, auditAgreement, issues };
}

export function isBlocked(client: ResolvedClient, role: "sales" | "auditor"): boolean {
  return client.issues.some((i) => i.blocks.includes(role));
}
