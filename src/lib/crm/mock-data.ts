import { seedConfig } from "@/lib/config/seed";
import type { IncomeTier } from "@/lib/config/types";
import type { AppClientData, ClientTerms, LeadRuleException, SalesAttribution } from "@/lib/data/types";
import type { CrmAgreement, CrmClient, CrmEmployee, CrmStatusChange } from "./types";

/**
 * DANE TESTOWE w kształcie prawdziwego RRUP: numery INICJAŁY/NR/MM/RR/ZAKRES,
 * typy PREFINANSOWANIE 2.0 / OZE 2.0 / AUDYT CP 2.0, prawdziwe nazwy statusów.
 * Daty liczone względem „teraz”, żeby demo zawsze wyglądało aktualnie.
 * Część klientów celowo ma błędy (brak końcówki, nieznany status, nieznane
 * inicjały) — trafiają do kolejki „Do wyjaśnienia”.
 */

const HOUR = 60 * 60 * 1000;

const PREF = "PREFINANSOWANIE 2.0";
const AUDIT = "AUDYT CP 2.0";
const OZE = "OZE 2.0";

export const mockEmployees: CrmEmployee[] = [
  { id: "e-anna", name: "Anna Kowalska", role: "sales", managerId: null },
  { id: "e-marek", name: "Marek Wiśniewski", role: "sales", managerId: "e-anna" },
  { id: "e-ola", name: "Ola Nowak", role: "auditor", managerId: "e-marek" },
  { id: "e-tomek", name: "Tomek Zieliński", role: "auditor", managerId: "e-marek" },
];

const pathOf = (type: string) => seedConfig.crm.agreementTypes.find((t) => t.name === type)!.path;
const isSideStatus = (s: string) => /NEGATYWNA|WIN-BACK|SPAD|DZIAŁ PRAWNY/.test(s);

/**
 * Historia statusów: przejście głównej ścieżki od początku do `to`
 * (bez negatywnych), kolejne kroki co `gapHours`, ostatni krok o `endAt`.
 */
function walk(type: string, to: string, endAt: number, gapHours: number | number[], skip: string[] = []): CrmStatusChange[] {
  const path = pathOf(type).filter((s) => !isSideStatus(s) && !skip.includes(s));
  const target = path.indexOf(to);
  if (target === -1) throw new Error(`Status ${to} nie istnieje na ścieżce ${type}`);
  const steps = path.slice(0, target + 1);
  const gaps = steps.map((_, i) => (Array.isArray(gapHours) ? (gapHours[i] ?? gapHours[gapHours.length - 1]) : gapHours));
  let t = endAt;
  const out: CrmStatusChange[] = [];
  for (let i = steps.length - 1; i >= 0; i--) {
    out.unshift({ status: steps[i], at: new Date(t).toISOString() });
    t -= gaps[i] * HOUR;
  }
  return out;
}

interface SalesSpec {
  suffix: string | null;
  to: string;
  /** Ostatnia zmiana statusu: ile godzin temu. */
  endHoursAgo: number;
  gapHours?: number | number[];
  valueNet: number;
  surchargeNet: number;
  /** Dopisany na końcu status spoza ścieżki (negatywny lub nieznany). */
  thenStatus?: { status: string; hoursAgo: number };
  initials?: string;
}

interface ClientSpec {
  name: string;
  city: string;
  /** Próg dochodowy (ręczne pole admina; null = nieuzupełniony). */
  tier: IncomeTier | null;
  /** Przypisany pracownik klienta w CRM (dziś łącznik zwraca puste → null). */
  assigned: string | null;
  /** Źródło w aplikacji: oferta przyjęta w Radarze albo lead założony w aplikacji. */
  app?: { source: "radar" | "lead"; employeeId: string };
  /** Ostatni handlowiec z historii przypisań w CRM (null = 422 / brak). */
  history?: string;
  initials: string;
  auditor: { id: string | null; to: string; endHoursAgo: number; initials: string } | null;
  sales: SalesSpec[];
  rek?: { to: string; endHoursAgo: number; thenStatus?: string };
  samVatFromOffer?: boolean | null;
}

const D = (days: number) => days * 24;

/** Szybka ścieżka dokumentów: podpis → … → REALIZACJA AUDYTU - GWD w ok. 20h. */
const FAST_DOCS = [0, 30, 4, 4, 4, 4, 4, 60];
/** Wolna ścieżka dokumentów: ok. 3 dni od podpisu do REALIZACJA AUDYTU - GWD. */
const SLOW_DOCS = [0, 30, 20, 20, 20, 20, 20, 60];

const specs: ClientSpec[] = [
  // ---------------- Marek (handlowiec), audytorzy Ola i Tomek ----------------
  { name: "Jan K.", city: "Kielce", tier: "basic", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(70), initials: "ON" },
    sales: [
      { suffix: "TERMO", to: "OCZEKIWANIE NA DECYZJĘ", endHoursAgo: D(30), gapHours: FAST_DOCS, valueNet: 98_000, surchargeNet: 6_000 },
      { suffix: "KOT", to: "OCZEKIWANIE NA DECYZJĘ", endHoursAgo: D(30), gapHours: FAST_DOCS, valueNet: 32_000, surchargeNet: 1_500 },
    ] },
  { name: "Barbara M.", city: "Radom", tier: "elevated", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(55), initials: "ON" },
    sales: [
      { suffix: "Termo", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: D(20), gapHours: SLOW_DOCS, valueNet: 112_000, surchargeNet: 14_000 },
      { suffix: "PC", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: D(20), gapHours: SLOW_DOCS, valueNet: 41_000, surchargeNet: 2_200 },
    ],
    rek: { to: "ZAMAWANIE TOWARU", endHoursAgo: D(10) } },
  { name: "Piotr S.", city: "Sandomierz", tier: "highest", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(45), initials: "TZ" },
    sales: [{ suffix: "TERMO", to: "OCZEKIWANIE NA DECYZJĘ", endHoursAgo: D(12), gapHours: FAST_DOCS, valueNet: 135_000, surchargeNet: 9_000 }],
    rek: { to: "WERYFIKACJA UMOWY", endHoursAgo: D(25) } },
  { name: "Halina W.", city: "Ostrowiec", tier: "highest", assigned: null, initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(35), initials: "ON" },
    sales: [{ suffix: "KOT", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: D(9), gapHours: FAST_DOCS, valueNet: 28_000, surchargeNet: 800 }] },
  { name: "Krzysztof D.", city: "Kielce", tier: "elevated", assigned: null, app: { source: "radar", employeeId: "e-marek" }, initials: "MW",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(25), initials: "TZ" },
    sales: [{ suffix: "TERM", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: 5, gapHours: SLOW_DOCS, valueNet: 89_000, surchargeNet: 4_500 }] },
  { name: "Ewa P.", city: "Busko-Zdrój", tier: "highest", assigned: null, app: { source: "lead", employeeId: "e-marek" }, initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(22), initials: "ON" },
    sales: [
      { suffix: "TERMO", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: 3, gapHours: FAST_DOCS, valueNet: 121_000, surchargeNet: 11_000 },
      { suffix: "ZGAZ", to: "WERYFIKACJA DOKUMENTÓW WFOŚ", endHoursAgo: D(2), gapHours: FAST_DOCS, valueNet: 35_000, surchargeNet: 2_000 },
    ],
    rek: { to: "W TRAKCIE FINANSOWANIA", endHoursAgo: D(8) } },
  { name: "Wiesław N.", city: "Opatów", tier: "basic", assigned: null, history: "e-marek", initials: "MW",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(90), initials: "TZ" },
    sales: [{ suffix: "TERMO", to: "OCZEKIWANIE NA DECYZJĘ", endHoursAgo: D(40), gapHours: SLOW_DOCS, valueNet: 88_000, surchargeNet: 5_500 }] },
  { name: "Danuta K.", city: "Staszów", tier: "elevated", assigned: null, history: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(75), initials: "ON" },
    sales: [{ suffix: "KOT", to: "OCZEKIWANIE NA DECYZJĘ", endHoursAgo: D(35), gapHours: FAST_DOCS, valueNet: 104_000, surchargeNet: 8_000 }] },
  { name: "Grażyna T.", city: "Włoszczowa", tier: "basic", assigned: null, app: { source: "lead", employeeId: "e-marek" }, initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(60), initials: "ON" },
    sales: [{ suffix: "TERMO", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: D(25), gapHours: SLOW_DOCS, valueNet: 70_000, surchargeNet: 2_000,
      thenStatus: { status: "WIN-BACK", hoursAgo: 3 } }] },
  { name: "Tadeusz B.", city: "Końskie", tier: "basic", assigned: null, app: { source: "radar", employeeId: "e-marek" }, initials: "MW",
    auditor: { id: "e-ola", to: "PRZEKAZANA DO PH", endHoursAgo: D(9), initials: "ON" },
    sales: [{ suffix: "TERMO", to: "PRZYGOTOWANIE DOKUMENTÓW WFOŚ", endHoursAgo: 26, gapHours: SLOW_DOCS, valueNet: 76_000, surchargeNet: 3_000 }] },
  { name: "Zofia L.", city: "Jędrzejów", tier: "elevated", assigned: null, app: { source: "radar", employeeId: "e-marek" }, initials: "MW",
    auditor: { id: "e-tomek", to: "PRZEKAZANA DO PH", endHoursAgo: D(6), initials: "TZ" },
    sales: [{ suffix: "TERMO", to: "WERYFIKACJA UMOWY", endHoursAgo: 6, gapHours: [0, 30, 20, 20, 10], valueNet: 94_000, surchargeNet: 5_000 }] },
  { name: "Andrzej G.", city: "Starachowice", tier: "basic", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "PRZEKAZANA DO PH", endHoursAgo: D(2), initials: "ON" },
    sales: [] },
  { name: "Maria J.", city: "Skarżysko", tier: "highest", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-tomek", to: "PRZEKAZANA DO PH", endHoursAgo: D(8), initials: "TZ" },
    sales: [] },
  { name: "Stanisław R.", city: "Pińczów", tier: "elevated", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "W TRAKCIE POMIARÓW", endHoursAgo: D(1), initials: "ON" },
    sales: [] },
  { name: "Leszek O.", city: "Chęciny", tier: null, assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "DOKUMENTACJA POMIAROWA", endHoursAgo: 8, initials: "ON" },
    sales: [] },
  // ---- przypadki do wyjaśnienia ----
  { name: "Henryk Z.", city: "Kazimierza Wielka", tier: "basic", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(30), initials: "TZ" },
    sales: [{ suffix: null, to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: D(4), gapHours: SLOW_DOCS, valueNet: 81_000, surchargeNet: 3_000 }] },
  { name: "Elżbieta W.", city: "Daleszyce", tier: "elevated", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(28), initials: "ON" },
    sales: [{ suffix: "TERMO", to: "REALIZACJA AUDYTU - GWD", endHoursAgo: D(6), gapHours: SLOW_DOCS, valueNet: 92_000, surchargeNet: 4_000,
      thenStatus: { status: "NOWY STATUS W CRM", hoursAgo: D(1) } }] },
  { name: "Kazimierz P.", city: "Bodzentyn", tier: "basic", assigned: null, initials: "XY",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(26), initials: "TZ" },
    sales: [{ suffix: "TERMO", to: "WERYFIKACJA DOKUMENTÓW WFOŚ", endHoursAgo: D(3), gapHours: SLOW_DOCS, valueNet: 77_000, surchargeNet: 2_500 }] },
  { name: "Renata S.", city: "Morawica", tier: "basic", assigned: "e-marek", initials: "MW",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(18), initials: "ON" },
    sales: [{ suffix: "TRMO", to: "WERYFIKACJA UMOWY", endHoursAgo: D(5), gapHours: SLOW_DOCS, valueNet: 86_000, surchargeNet: 3_500 }] },
  { name: "Bogdan W.", city: "Suchedniów", tier: "elevated", assigned: "e-marek", app: { source: "lead", employeeId: "e-anna" }, initials: "MW",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(24), initials: "TZ" },
    sales: [{ suffix: "TERMO", to: "WERYFIKACJA UMOWY", endHoursAgo: D(4), gapHours: SLOW_DOCS, valueNet: 90_000, surchargeNet: 3_000 }] },
  // ---------------- Anna (manager) ----------------
  { name: "Roman F.", city: "Kraków", tier: "elevated", assigned: "e-anna", initials: "AK",
    auditor: { id: "e-tomek", to: "SUKCES", endHoursAgo: D(30), initials: "TZ" },
    sales: [{ suffix: "TERMO", to: "OCZEKIWANIE NA DECYZJĘ", endHoursAgo: D(10), gapHours: FAST_DOCS, valueNet: 140_000, surchargeNet: 12_000 }] },
  { name: "Irena C.", city: "Tarnów", tier: "basic", assigned: "e-anna", initials: "AK",
    auditor: { id: "e-ola", to: "SUKCES", endHoursAgo: D(20), initials: "ON" },
    sales: [
      { suffix: "TERMO", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: 30, gapHours: FAST_DOCS, valueNet: 99_000, surchargeNet: 7_000 },
      { suffix: "KOT", to: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", endHoursAgo: 30, gapHours: FAST_DOCS, valueNet: 29_000, surchargeNet: 1_200 },
    ] },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export interface MockCrmData extends AppClientData {
  clients: CrmClient[];
  agreements: CrmAgreement[];
}

/**
 * Stała chwila odniesienia dla danych testowych (start serwera) — dzięki temu daty
 * statusów nie „przesuwają się” przy każdym odczycie i powiadomienia nie wracają.
 */
export const MOCK_EPOCH = new Date();

export function buildMockData(now: Date = MOCK_EPOCH): MockCrmData {
  const nowMs = now.getTime();
  const clients: CrmClient[] = [];
  const agreements: CrmAgreement[] = [];
  const terms: ClientTerms[] = [];
  const attributions: SalesAttribution[] = [];
  const leadExceptions: LeadRuleException[] = [];
  let seq = 0;

  const number = (initials: string, at: number, suffix: string | null) => {
    seq++;
    const d = new Date(at);
    const base = `${initials}/${pad(seq % 100)}/${pad(d.getUTCMonth() + 1)}/${String(d.getUTCFullYear()).slice(seq % 3 === 0 ? 0 : 2)}`;
    return suffix ? `${base}/${suffix}` : base;
  };

  specs.forEach((spec, index) => {
    const clientId = `c-${String(index + 1).padStart(3, "0")}`;
    clients.push({
      id: clientId,
      displayName: spec.name,
      city: spec.city,
      assignedEmployeeId: spec.assigned,
      assignmentHistory: spec.history ? [{ employeeId: spec.history, at: new Date(nowMs - 60 * 24 * HOUR).toISOString() }] : null,
      crmUrl: `https://funduszremontowy.rrcrm.pl/customers/${clientId}`,
    });

    terms.push({
      clientId,
      incomeTier: spec.tier,
      surchargeNet: spec.sales.length ? spec.sales.reduce((sum, s) => sum + s.surchargeNet, 0) : null,
      samVatFromOffer: spec.samVatFromOffer ?? null,
    });

    if (spec.auditor) {
      const end = nowMs - spec.auditor.endHoursAgo * HOUR;
      const history = walk(AUDIT, spec.auditor.to, end, 40);
      agreements.push({
        id: `${clientId}-a`, clientId, number: number(spec.auditor.initials, Date.parse(history[0].at), "A"), type: AUDIT,
        statusHistory: history, userId: spec.auditor.id, valueNet: 0,
      });
    }

    spec.sales.forEach((s, i) => {
      const end = nowMs - s.endHoursAgo * HOUR;
      const history = walk(PREF, s.to, end, s.gapHours ?? 30);
      if (s.thenStatus) history.push({ status: s.thenStatus.status, at: new Date(nowMs - s.thenStatus.hoursAgo * HOUR).toISOString() });
      agreements.push({
        id: `${clientId}-s${i + 1}`, clientId, number: number(s.initials ?? spec.initials, Date.parse(history[0].at), s.suffix), type: PREF,
        // pole „user” na umowie sprzedażowej często wskazuje audytora — nie używamy go do ustalenia handlowca
        statusHistory: history, userId: spec.auditor?.id ?? null, valueNet: s.valueNet,
      });
    });

    if (spec.app) {
      // Lead/Radar: tuż przed podpisaniem pierwszej umowy (albo teraz, gdy umów brak).
      const signed = agreements
        .filter((a) => a.clientId === clientId && a.type === PREF)
        .flatMap((a) => a.statusHistory.filter((h) => h.status === "UMOWA PODPISANA").map((h) => Date.parse(h.at)));
      const at = (signed.length ? Math.min(...signed) : nowMs) - 48 * HOUR;
      attributions.push({ clientId, employeeId: spec.app.employeeId, source: spec.app.source, at: new Date(at).toISOString() });
    }

    if (spec.rek) {
      const end = nowMs - spec.rek.endHoursAgo * HOUR;
      const history = walk(OZE, spec.rek.to, end, 48);
      if (spec.rek.thenStatus) history.push({ status: spec.rek.thenStatus, at: new Date(nowMs - 2 * HOUR).toISOString() });
      agreements.push({
        id: `${clientId}-r`, clientId, number: number(spec.initials, Date.parse(history[0].at), "REK"), type: OZE,
        statusHistory: history, userId: spec.assigned, valueNet: 18_000,
      });
    }
  });

  return { clients, agreements, terms, attributions, leadExceptions };
}

/** Historia z dodanym „WYLICZENIE PROWIZJI” — do testów pomijania statusu. */
export function withIgnoredStatus(history: CrmStatusChange[], afterIndex: number): CrmStatusChange[] {
  const at = new Date(Date.parse(history[afterIndex].at) + HOUR).toISOString();
  return [...history.slice(0, afterIndex + 1), { status: "WYLICZENIE PROWIZJI", at }, ...history.slice(afterIndex + 1)];
}

