import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { buildMockData, mockEmployees } from "@/lib/crm/mock-data";
import type { CrmAgreement, CrmClient } from "@/lib/crm/types";
import type { ClientTerms } from "@/lib/data/types";
import {
  agreementCategory,
  effectiveStatus,
  parseAgreementNumber,
  reachedCategoryAt,
  reachedPathStatusAt,
  leadRuleState,
  resolveClient,
  statusCategory,
  suggestFromInitials,
} from "../agreements";

const rules = config.crm;
const PREF = "PREFINANSOWANIE 2.0";
const AUDIT = "AUDYT CP 2.0";

describe("końcówka numeru → zakres (niejednolita pisownia)", () => {
  const scopeOf = (n: string) => parseAgreementNumber(n, rules).scope?.scope ?? null;

  it.each([
    ["MW/12/09/26/TERMO", "thermo"],
    ["MW/12/09/2026/Termo", "thermo"],
    ["MW/12/09/26/termo", "thermo"],
    ["MW/12/09/2026/TERM", "thermo"],
    ["MW/12/09/26/TERM.", "thermo"],
    ["MW/12/09/26/KOT", "heatSource"],
    ["MW/12/09/26/Kot", "heatSource"],
    ["MW/12/09/26/PC", "heatSource"],
    ["MW/12/09/26/pc", "heatSource"],
    ["MW/12/09/26/ZGAZ", "heatSource"],
    ["MW/12/09/26/REK", "rek"],
    ["MW/12/09/26/Rek", "rek"],
    ["ON/03/09/26/A", "audit"],
    ["ON/03/09/26/a", "audit"],
    [" MW / 12 / 09 / 26 / TERMO ", "thermo"],
  ])("%s → %s", (number, scope) => {
    expect(scopeOf(number)).toBe(scope);
  });

  it("etykieta źródła ciepła z tabeli", () => {
    expect(parseAgreementNumber("MW/1/09/26/ZGAZ", rules).scope?.label).toBe("Kocioł zgazowujący na drewno");
    expect(parseAgreementNumber("MW/1/09/26/PC", rules).scope?.label).toBe("Pompa ciepła");
  });

  it("brak końcówki → brak zakresu (do wyjaśnienia)", () => {
    expect(parseAgreementNumber("MW/12/09/2026", rules)).toMatchObject({ suffix: null, scope: null });
    expect(parseAgreementNumber("MW/12/09/26", rules)).toMatchObject({ suffix: null, scope: null });
  });

  it("nieznana końcówka → brak zakresu, ale zapamiętana do wyjaśnienia", () => {
    expect(parseAgreementNumber("MW/12/09/26/TRMO", rules)).toMatchObject({ suffix: "TRMO", scope: null });
  });

  it("inicjały z pierwszego segmentu (2–3 litery, bez względu na wielkość)", () => {
    expect(parseAgreementNumber("mw/12/09/26/TERMO", rules).initials).toBe("MW");
    expect(parseAgreementNumber("ABC/12/09/26/TERMO", rules).initials).toBe("ABC");
    expect(parseAgreementNumber("12/09/26/TERMO", rules).initials).toBeNull();
  });

  it("tabela końcówek jest edytowalna", () => {
    const custom = { ...rules, scopeCodes: [...rules.scopeCodes, { codes: ["PV"], scope: "rek" as const, label: "Fotowoltaika" }] };
    expect(parseAgreementNumber("MW/1/09/26/pv", custom).scope?.label).toBe("Fotowoltaika");
  });
});

describe("status → kategoria", () => {
  it("handlowiec: zielona od „W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW” i dalej", () => {
    expect(statusCategory(PREF, "REALIZACJA AUDYTU - GWD", rules)).toBe("in_progress");
    expect(statusCategory(PREF, "WERYFIKACJA DOKUMENTÓW WFOŚ", rules)).toBe("in_progress");
    expect(statusCategory(PREF, "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", rules)).toBe("sales_earned");
    expect(statusCategory(PREF, "OCZEKIWANIE NA DECYZJĘ", rules)).toBe("sales_earned");
  });

  it("audytor: szara od „DOKUMENTACJA POMIAROWA”, zielona od „TWORZENIE OFERTY”", () => {
    expect(statusCategory(AUDIT, "W TRAKCIE POMIARÓW", rules)).toBe("in_progress");
    expect(statusCategory(AUDIT, "DOKUMENTACJA POMIAROWA", rules)).toBe("auditor_grey");
    expect(statusCategory(AUDIT, "WERYFIKACJA POMIAROWA", rules)).toBe("auditor_grey");
    expect(statusCategory(AUDIT, "TWORZENIE OFERTY", rules)).toBe("auditor_earned");
    expect(statusCategory(AUDIT, "PRZEKAZANA DO PH", rules)).toBe("auditor_earned");
    expect(statusCategory(AUDIT, "SUKCES", rules)).toBe("auditor_earned");
  });

  it("statusy negatywne zawsze „negatywny”, także dalej na ścieżce", () => {
    expect(statusCategory(PREF, "WERYFIKACJA DOKUMENTOWA NEGATYWNA", rules)).toBe("negative");
    expect(statusCategory(PREF, "NEGATYWNA WERYFIKACJA DOKUMENTOWA - WFOŚ", rules)).toBe("negative");
    expect(statusCategory(AUDIT, "NEGATYWNA WERYFIKACJA POMIAROWA", rules)).toBe("negative");
    expect(statusCategory(AUDIT, "WIN-BACK", rules)).toBe("negative");
    expect(statusCategory(PREF, "SPAD", rules)).toBe("negative");
    expect(statusCategory("OZE 2.0", "SPAD", rules)).toBe("negative");
    expect(statusCategory(PREF, "DZIAŁ PRAWNY", rules)).toBe("negative");
    expect(statusCategory(AUDIT, "DZIAŁ PRAWNY", rules)).toBe("negative");
  });

  it("ignoruje wielkość liter i podwójne spacje (np. „OCZEKIWANIE NA  GOPS/MOPS”)", () => {
    expect(statusCategory(AUDIT, "OCZEKIWANIE NA  GOPS/MOPS", rules)).toBe("in_progress");
    expect(statusCategory(PREF, "w trakcie składania wniosku do wfośigw", rules)).toBe("sales_earned");
  });

  it("„WYLICZENIE PROWIZJI” jest pomijany", () => {
    expect(statusCategory(PREF, "WYLICZENIE PROWIZJI", rules)).toBe("ignored");
  });

  it("status lub typ spoza tabeli → nieznany (do wyjaśnienia)", () => {
    expect(statusCategory(PREF, "NOWY STATUS W CRM", rules)).toBe("unknown");
    expect(statusCategory("NOWY TYP 3.0", "UMOWA PODPISANA", rules)).toBe("unknown");
  });
});

const agreement = (type: string, statuses: string[], number = "MW/01/09/26/TERMO"): CrmAgreement => ({
  id: "a1",
  clientId: "c1",
  number,
  type,
  statusHistory: statuses.map((status, i) => ({ status, at: new Date(Date.UTC(2026, 8, 1 + i, 10)).toISOString() })),
  userId: null,
  valueNet: 100_000,
});

describe("obecny status i daty z historii", () => {
  it("„WYLICZENIE PROWIZJI” jako obecny → liczy się poprzedni status", () => {
    const a = agreement(PREF, ["ZAWIERANIE UMOWY", "UMOWA PODPISANA", "W TRAKCIE FINANSOWANIA", "WYLICZENIE PROWIZJI"]);
    expect(effectiveStatus(a, rules)?.status).toBe("W TRAKCIE FINANSOWANIA");
    expect(agreementCategory(a, rules)).toBe("in_progress");
  });

  it("zniknięcie statusu z CRM nie psuje aplikacji — trafia do wyjaśnienia", () => {
    const a = agreement(PREF, ["ZAWIERANIE UMOWY", "STATUS USUNIĘTY Z CRM"]);
    expect(agreementCategory(a, rules)).toBe("unknown");
  });

  it("data zazielenienia = pierwsze wejście w kategorię zarobioną", () => {
    const a = agreement(PREF, ["UMOWA PODPISANA", "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", "OCZEKIWANIE NA DECYZJĘ"]);
    expect(reachedCategoryAt(a, ["sales_earned"], rules)?.toISOString()).toBe("2026-09-02T10:00:00.000Z");
  });

  it("KPI komplet dokumentów: „WERYFIKACJA DOKUMENTOWA NEGATYWNA” po drodze liczy się do czasu", () => {
    const a = agreement(PREF, ["UMOWA PODPISANA", "WERYFIKACJA UMOWY", "WERYFIKACJA DOKUMENTOWA NEGATYWNA", "REALIZACJA AUDYTU - GWD"]);
    // koniec okna = pierwszy pozytywny status po weryfikacji, czyli 4. wpis (nie negatywny)
    expect(reachedPathStatusAt(a, "REALIZACJA AUDYTU - GWD", rules)?.toISOString()).toBe("2026-09-04T10:00:00.000Z");
  });

  it("przeskok statusu dalej niż kamień milowy też go zalicza", () => {
    const a = agreement(PREF, ["UMOWA PODPISANA", "PRZYGOTOWANIE DOKUMENTÓW WFOŚ"]);
    expect(reachedPathStatusAt(a, "REALIZACJA AUDYTU - GWD", rules)?.toISOString()).toBe("2026-09-02T10:00:00.000Z");
  });
});

describe("inicjały — tylko podpowiedź, najdłuższy prefiks", () => {
  it.each([
    ["RS", "Rafał Szwed"],
    ["RSZ", "Rafał Szczypkowski"],
    ["rsz", "Rafał Szczypkowski"],
    ["WL", "Włodzimierz Lemański"],
    ["WŁ", "Włodzimierz Lemański"],
    ["ŁŁ", "Łukasz Łubkowski"],
    ["ŁB", "Łukasz Burliga"],
    ["MP", "nieznane"],
  ])("%s → %s", (code, name) => {
    expect(suggestFromInitials(code, rules)?.personName).toBe(name);
  });

  it("nieznane inicjały → brak podpowiedzi", () => {
    expect(suggestFromInitials("XY", rules)).toBeNull();
    expect(suggestFromInitials(null, rules)).toBeNull();
  });
});

describe("kto jest handlowcem przy kliencie", () => {
  const now = new Date("2026-10-01T10:00:00Z");
  const client = (overrides: Partial<CrmClient> = {}): CrmClient => ({
    id: "c1", displayName: "Jan K.", city: "Kielce", assignedEmployeeId: null, assignmentHistory: null, crmUrl: "", ...overrides,
  });
  const terms: ClientTerms[] = [{ clientId: "c1", incomeTier: "basic", surchargeNet: 0, samVatFromOffer: null }];
  const sale = (number: string, statuses = ["UMOWA PODPISANA"]) => ({ ...agreement(PREF, statuses, number), id: number, userId: "e-ola" });
  const audit = (userId: string | null) => ({ ...agreement(AUDIT, ["SUKCES"], "ON/01/09/26/A"), id: "aud", userId });
  type Attr = { clientId: string; employeeId: string; source: "radar" | "lead" | "admin"; at: string };
  const resolve = (c: CrmClient, list: CrmAgreement[], attributions: Attr[] = [], cfg = config) =>
    resolveClient(c, list, mockEmployees, cfg, { terms, attributions, leadExceptions: [], now });
  const kinds = (rc: ReturnType<typeof resolve>) => rc.issues.map((i) => i.kind);

  it("1. aplikacja (Radar / lead) — główne źródło prawdy", () => {
    const rc = resolve(client(), [sale("MW/1/09/26/TERMO")], [{ clientId: "c1", employeeId: "e-marek", source: "radar", at: "2026-09-01T10:00:00Z" }]);
    expect(rc).toMatchObject({ salesId: "e-marek", salesSource: "app" });
  });

  it("2. przypisany pracownik klienta w CRM", () => {
    expect(resolve(client({ assignedEmployeeId: "e-marek" }), [sale("MW/1/09/26/TERMO")])).toMatchObject({ salesId: "e-marek", salesSource: "client" });
  });

  it("3. historia przypisań klienta w CRM (gdy łącznik ją zwraca)", () => {
    const rc = resolve(client({ assignmentHistory: [{ employeeId: "e-ola", at: "2026-08-01T00:00:00Z" }, { employeeId: "e-anna", at: "2026-08-03T00:00:00Z" }] }), [sale("MW/1/09/26/TERMO")]);
    expect(rc).toMatchObject({ salesId: "e-anna", salesSource: "history" });
  });

  it("zgodne źródła → bez wyjaśniania", () => {
    const rc = resolve(client({ assignedEmployeeId: "e-marek" }), [sale("MW/1/09/26/TERMO")], [{ clientId: "c1", employeeId: "e-marek", source: "lead", at: "2026-08-01T10:00:00Z" }]);
    expect(rc.salesId).toBe("e-marek");
    expect(rc.issues).toEqual([]);
  });

  it("różne osoby w źródłach → „Do wyjaśnienia”, nigdy zgadywanie", () => {
    const rc = resolve(client({ assignedEmployeeId: "e-marek" }), [sale("MW/1/09/26/TERMO")], [{ clientId: "c1", employeeId: "e-anna", source: "lead", at: "2026-08-01T10:00:00Z" }]);
    expect(rc.salesId).toBeNull();
    expect(kinds(rc)).toEqual(["sales_conflict"]);
  });

  it("inicjały NIGDY nie przypisują prowizji — tylko podpowiedź w kolejce", () => {
    const rc = resolve(client(), [sale("MW/1/09/26/TERMO")]);
    expect(rc.salesId).toBeNull();
    expect(rc.issues).toMatchObject([{ kind: "no_sales_person", blocks: ["sales"], suggestion: { code: "MW", employeeId: "e-marek" } }]);
  });

  it("RSZ podpowiada Rafała Szczypkowskiego, nie Rafała Szweda", () => {
    const rc = resolve(client(), [sale("RSZ/1/09/26/TERMO")]);
    expect(rc.issues[0].suggestion?.personName).toBe("Rafał Szczypkowski");
  });

  it("decyzja admina (potwierdzenie podpowiedzi) rozstrzyga", () => {
    const rc = resolve(client({ assignedEmployeeId: "e-marek" }), [sale("MW/1/09/26/TERMO")], [
      { clientId: "c1", employeeId: "e-anna", source: "lead", at: "2026-08-01T10:00:00Z" },
      { clientId: "c1", employeeId: "e-anna", source: "admin", at: "2026-10-01T09:00:00Z" },
    ]);
    expect(rc).toMatchObject({ salesId: "e-anna", salesSource: "admin", issues: [] });
  });

  it("audytor = „user” z umowy /A; brak → do wyjaśnienia (blokuje tylko audytora)", () => {
    expect(resolve(client({ assignedEmployeeId: "e-marek" }), [sale("MW/1/09/26/TERMO"), audit("e-tomek")]).auditorId).toBe("e-tomek");
    expect(resolve(client(), [audit(null)]).issues).toMatchObject([{ kind: "no_auditor", blocks: ["auditor"] }]);
  });

  it("brak końcówki / nieznana końcówka / nieznany status → do wyjaśnienia", () => {
    const c = client({ assignedEmployeeId: "e-marek" });
    expect(kinds(resolve(c, [sale("MW/1/09/2026")]))).toContain("missing_suffix");
    expect(kinds(resolve(c, [sale("MW/1/09/26/TRMO")]))).toContain("unknown_suffix");
    expect(kinds(resolve(c, [sale("MW/1/09/26/TERMO", ["UMOWA PODPISANA", "NOWY STATUS W CRM"])]))).toContain("unknown_status");
  });

  it("brak progu dochodowego → do wyjaśnienia tylko, gdy potrzebny", () => {
    const noTier = (overrides: Partial<ClientTerms> = {}): ClientTerms[] => [{ ...terms[0], incomeTier: null, ...overrides }];
    const run = (t: ClientTerms[], list: CrmAgreement[]) =>
      resolveClient(client({ assignedEmployeeId: "e-marek" }), list, mockEmployees, config, { terms: t, attributions: [], leadExceptions: [], now }).issues;
    // audytor potrzebuje progu do stawki; handlowiec do reguły „sam VAT”
    expect(run(noTier(), [sale("MW/1/09/26/TERMO"), audit("e-tomek")])).toMatchObject([{ kind: "missing_income_tier", blocks: ["auditor", "sales"] }]);
    // oferta rozstrzyga „sam VAT” → handlowcowi próg niepotrzebny
    expect(run(noTier({ samVatFromOffer: false }), [sale("MW/1/09/26/TERMO")])).toEqual([]);
  });
});

describe("reguła „Nie ma w aplikacji = nie ma klienta”", () => {
  const signed = new Date("2026-10-20T10:00:00Z");
  const now = new Date("2026-10-25T10:00:00Z");
  const withRule = (enforceFrom: string | null) => ({ ...config, appLeadRule: { enforceFrom } });

  it("lead w aplikacji przed umową → OK", () => {
    expect(leadRuleState(true, signed, new Date("2026-10-18T10:00:00Z"), false, now, withRule("2026-10-15"))).toBe("ok");
  });

  it("przed datą włączenia → tylko ostrzeżenie", () => {
    expect(leadRuleState(true, signed, null, false, now, withRule(null))).toBe("warning");
    expect(leadRuleState(true, signed, null, false, now, withRule("2026-11-01"))).toBe("warning");
  });

  it("po włączeniu: brak leadu (albo lead po umowie) → blokada prowizji i awansu", () => {
    expect(leadRuleState(true, signed, null, false, now, withRule("2026-10-15"))).toBe("blocked");
    expect(leadRuleState(true, signed, new Date("2026-10-21T10:00:00Z"), false, now, withRule("2026-10-15"))).toBe("blocked");
  });

  it("umowy podpisane przed datą włączenia nie są blokowane wstecz", () => {
    expect(leadRuleState(true, new Date("2026-10-10T10:00:00Z"), null, false, now, withRule("2026-10-15"))).toBe("warning");
  });

  it("wyjątek zatwierdzony przez managera → OK", () => {
    expect(leadRuleState(true, signed, null, true, now, withRule("2026-10-15"))).toBe("ok");
  });

  it("klient bez umów sprzedażowych → nie dotyczy", () => {
    expect(leadRuleState(false, null, null, false, now, withRule("2026-10-15"))).toBe("not_applicable");
  });
});

describe("dane testowe przechodzą przez te same reguły", () => {
  const data = buildMockData(new Date("2026-10-01T10:00:00Z"));
  const squadrons = [{ id: "sq-lb", name: "Eskadra ŁB", prefix: "ŁB", leaderName: "Lider", rules: { perClient: 0, note: "" }, history: [{ at: "2026-01-01T00:00:00Z", active: true, by: "a" }] }];
  const resolveAll = (sq: typeof squadrons) =>
    data.clients.map((c) =>
      resolveClient(c, data.agreements, mockEmployees, config, { terms: data.terms, attributions: data.attributions, leadExceptions: data.leadExceptions, now: new Date("2026-10-01T10:00:00Z"), squadrons: sq }),
    );
  const resolved = resolveAll(squadrons);

  it("klienci z prefiksem aktywnej eskadry (ŁB) należą do eskadry — bez kolejki „Do wyjaśnienia”", () => {
    const lb = resolved.filter((r) => r.squadronId === "sq-lb").map((r) => r.client.displayName).sort();
    expect(lb).toEqual(["Alicja Z.", "Wojciech H."]);
    // eskadra wyłączona (albo jeszcze nieistniejąca) przy podpisaniu umowy → zwykła kolejka
    const off = resolveAll([{ ...squadrons[0], history: [{ at: "2026-12-01T00:00:00Z", active: true, by: "a" }] }]);
    expect(off.find((r) => r.client.displayName === "Wojciech H.")!.issues[0]).toMatchObject({ kind: "no_sales_person", suggestion: { code: "ŁB" } });
  });

  it("celowo błędni klienci trafiają do kolejki, reszta jest czysta", () => {
    const withIssues = resolved.filter((r) => r.issues.length > 0).map((r) => r.client.displayName).sort();
    expect(withIssues).toEqual(["Bogdan W.", "Elżbieta W.", "Halina W.", "Henryk Z.", "Kazimierz P.", "Leszek O.", "Renata S."]);
  });

  it("klient bez handlowca z inicjałami MW → podpowiedź, nie przypisanie", () => {
    const halina = resolved.find((r) => r.client.displayName === "Halina W.")!;
    expect(halina.salesId).toBeNull();
    expect(halina.issues[0]).toMatchObject({ kind: "no_sales_person", suggestion: { code: "MW" } });
  });

  it("dane testowe nie zawierają pól wrażliwych (RODO)", () => {
    const json = JSON.stringify(data).toLowerCase();
    for (const forbidden of ["pesel", "ksiega", "księga", "dzialka", "działka"]) expect(json).not.toContain(forbidden);
  });
});
