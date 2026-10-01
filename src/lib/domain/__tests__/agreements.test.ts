import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { buildMockData, mockEmployees } from "@/lib/crm/mock-data";
import type { CrmAgreement, CrmClient } from "@/lib/crm/types";
import {
  agreementCategory,
  effectiveStatus,
  parseAgreementNumber,
  reachedCategoryAt,
  reachedPathStatusAt,
  resolveClient,
  statusCategory,
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
  });

  it("ignoruje wielkość liter i podwójne spacje (np. „OCZEKIWANIE NA  GOPS/MOPS”)", () => {
    expect(statusCategory(AUDIT, "OCZEKIWANIE NA  GOPS/MOPS", rules)).toBe("in_progress");
    expect(statusCategory(PREF, "w trakcie składania wniosku do wfośigw", rules)).toBe("sales_earned");
  });

  it("„WYLICZENIE PROWIZJI” jest pomijany", () => {
    expect(statusCategory(PREF, "WYLICZENIE PROWIZJI", rules)).toBe("ignored");
  });

  it("status lub typ spoza tabeli → nieznany (do wyjaśnienia)", () => {
    expect(statusCategory(PREF, "DZIAŁ PRAWNY", rules)).toBe("unknown");
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
  surchargeNet: 0,
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

describe("przypisania i kolejka „Do wyjaśnienia”", () => {
  const client = (overrides: Partial<CrmClient> = {}): CrmClient => ({
    id: "c1", displayName: "Jan K.", city: "Kielce", incomeTier: "basic", assignedEmployeeId: "e-marek", samVatFromOffer: null, crmUrl: "", ...overrides,
  });
  const sale = (number: string, statuses = ["UMOWA PODPISANA"]) => ({ ...agreement(PREF, statuses, number), id: number, userId: "e-ola" });
  const audit = (userId: string | null) => ({ ...agreement(AUDIT, ["SUKCES"], "ON/01/09/26/A"), id: "aud", userId });

  it("handlowiec = przypisany pracownik klienta (pole „user” umowy ignorowane)", () => {
    const rc = resolveClient(client(), [sale("MW/1/09/26/TERMO")], mockEmployees, config);
    expect(rc).toMatchObject({ salesId: "e-marek", salesSource: "client", issues: [] });
  });

  it("brak przypisania → inicjały z numeru umowy", () => {
    const rc = resolveClient(client({ assignedEmployeeId: null }), [sale("AK/1/09/26/TERMO")], mockEmployees, config);
    expect(rc).toMatchObject({ salesId: "e-anna", salesSource: "initials" });
  });

  it("brak przypisania i nieznane inicjały → do wyjaśnienia, bez handlowca", () => {
    const rc = resolveClient(client({ assignedEmployeeId: null }), [sale("XY/1/09/26/TERMO")], mockEmployees, config);
    expect(rc.salesId).toBeNull();
    expect(rc.issues.map((i) => i.kind)).toEqual(["unknown_initials"]);
  });

  it("audytor = „user” z umowy /A", () => {
    const rc = resolveClient(client(), [sale("MW/1/09/26/TERMO"), audit("e-tomek")], mockEmployees, config);
    expect(rc.auditorId).toBe("e-tomek");
  });

  it("umowa /A bez audytora → do wyjaśnienia (blokuje tylko prowizję audytora)", () => {
    const rc = resolveClient(client(), [audit(null)], mockEmployees, config);
    expect(rc.issues).toMatchObject([{ kind: "no_auditor", blocks: ["auditor"] }]);
  });

  it("brak końcówki / nieznana końcówka / nieznany status → do wyjaśnienia", () => {
    const kinds = (list: CrmAgreement[]) => resolveClient(client(), list, mockEmployees, config).issues.map((i) => i.kind);
    expect(kinds([sale("MW/1/09/2026")])).toContain("missing_suffix");
    expect(kinds([sale("MW/1/09/26/TRMO")])).toContain("unknown_suffix");
    expect(kinds([sale("MW/1/09/26/TERMO", ["UMOWA PODPISANA", "DZIAŁ PRAWNY"])])).toContain("unknown_status");
  });
});

describe("dane testowe przechodzą przez te same reguły", () => {
  const { clients, agreements } = buildMockData(new Date("2026-10-01T10:00:00Z"));
  const resolved = clients.map((c) => resolveClient(c, agreements, mockEmployees, config));

  it("celowo błędni klienci trafiają do kolejki, reszta jest czysta", () => {
    const withIssues = resolved.filter((r) => r.issues.length > 0).map((r) => r.client.displayName).sort();
    expect(withIssues).toEqual(["Elżbieta W.", "Henryk Z.", "Kazimierz P.", "Renata S."]);
  });

  it("klient bez przypisania z inicjałami MW trafia do Marka", () => {
    expect(resolved.find((r) => r.client.displayName === "Halina W.")).toMatchObject({ salesId: "e-marek", salesSource: "initials" });
  });

  it("dane testowe nie zawierają pól wrażliwych (RODO)", () => {
    const json = JSON.stringify({ clients, agreements }).toLowerCase();
    for (const forbidden of ["pesel", "ksiega", "księga", "dzialka", "działka"]) expect(json).not.toContain(forbidden);
  });
});
