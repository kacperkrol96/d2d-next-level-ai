import type { CrmAgreement, CrmClient, CrmEmployee, CrmStatusChange } from "./types";

/**
 * DANE TESTOWE — fikcyjni klienci i pracownicy. Daty liczone względem
 * „dziś”, żeby demo zawsze wyglądało aktualnie.
 */

const SALES_FLOW = [
  "Nowy klient",
  "Oferta przekazana do handlowca",
  "Umowa podpisana",
  "Komplet dokumentów",
  "Wysłanie wniosku do WFOŚ",
  "Wniosek zatwierdzony",
  "Realizacja",
  "Zakończona",
];
const AUDIT_FLOW = ["Umówiony audyt", "W trakcie pomiarów", "Po pomiarach", "Audyt przekazany", "Zakończony"];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const mockEmployees: CrmEmployee[] = [
  { id: "e-anna", name: "Anna Kowalska", role: "sales", managerId: null },
  { id: "e-marek", name: "Marek Wiśniewski", role: "sales", managerId: "e-anna" },
  { id: "e-ola", name: "Ola Nowak", role: "auditor", managerId: "e-marek" },
  { id: "e-tomek", name: "Tomek Zieliński", role: "auditor", managerId: "e-marek" },
];

interface ClientSeed {
  name: string;
  city: string;
  tier: CrmClient["incomeTier"];
  mode: CrmClient["mode"];
  auditor: string;
  sales: string;
  /** Ile dni temu był audyt. */
  startDaysAgo: number;
  /** Indeks osiągniętego statusu sprzedażowego (-1 = rezygnacja). */
  salesStep: number;
  auditStep: number;
  /** Godziny od podpisania do kompletu dokumentów. */
  docsHours?: number;
  /** Dni od przekazania oferty do podpisania. */
  signDays?: number;
  agreements: Omit<CrmAgreement, "id" | "signedAt">[];
}

const termo = (valueNet: number, surchargeNet: number, samVat = false) => ({ kind: "termomodernizacja" as const, valueNet, surchargeNet, samVat });
const kociol = (valueNet: number, surchargeNet: number, samVat = false) => ({ kind: "kocioł" as const, valueNet, surchargeNet, samVat });

const seeds: ClientSeed[] = [
  { name: "Jan K.", city: "Kielce", tier: "basic", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 60, salesStep: 7, auditStep: 4, docsHours: 20, signDays: 2, agreements: [termo(98_000, 6_000), kociol(32_000, 1_500)] },
  { name: "Barbara M.", city: "Radom", tier: "elevated", mode: "duo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 48, salesStep: 6, auditStep: 4, docsHours: 30, signDays: 4, agreements: [termo(112_000, 14_000)] },
  { name: "Piotr S.", city: "Sandomierz", tier: "highest", mode: "solo", auditor: "e-tomek", sales: "e-marek", startDaysAgo: 40, salesStep: 5, auditStep: 4, docsHours: 12, signDays: 3, agreements: [termo(135_000, 9_000)] },
  { name: "Halina W.", city: "Ostrowiec", tier: "basic", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 30, salesStep: 5, auditStep: 3, docsHours: 22, signDays: 3, agreements: [kociol(28_000, 800, true)] },
  { name: "Krzysztof D.", city: "Kielce", tier: "elevated", mode: "solo", auditor: "e-tomek", sales: "e-marek", startDaysAgo: 10, salesStep: 4, auditStep: 3, docsHours: 18, signDays: 5, agreements: [termo(89_000, 4_500)] },
  { name: "Ewa P.", city: "Busko-Zdrój", tier: "highest", mode: "duo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 7, salesStep: 4, auditStep: 3, docsHours: 10, signDays: 2, agreements: [termo(121_000, 11_000), kociol(35_000, 2_000)] },
  { name: "Tadeusz B.", city: "Końskie", tier: "basic", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 12, salesStep: 3, auditStep: 2, docsHours: 40, signDays: 6, agreements: [termo(76_000, 3_000)] },
  { name: "Zofia L.", city: "Jędrzejów", tier: "elevated", mode: "solo", auditor: "e-tomek", sales: "e-marek", startDaysAgo: 9, salesStep: 2, auditStep: 2, signDays: 3, agreements: [termo(94_000, 5_000)] },
  { name: "Andrzej G.", city: "Starachowice", tier: "basic", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 5, salesStep: 1, auditStep: 2, agreements: [termo(82_000, 4_000)] },
  { name: "Maria J.", city: "Skarżysko", tier: "highest", mode: "duo", auditor: "e-tomek", sales: "e-marek", startDaysAgo: 3, salesStep: 1, auditStep: 2, agreements: [termo(128_000, 10_000)] },
  { name: "Stanisław R.", city: "Pińczów", tier: "elevated", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 2, salesStep: 0, auditStep: 1, agreements: [] },
  { name: "Wiesław N.", city: "Opatów", tier: "basic", mode: "solo", auditor: "e-tomek", sales: "e-marek", startDaysAgo: 75, salesStep: 7, auditStep: 4, docsHours: 26, signDays: 4, agreements: [termo(88_000, 5_500)] },
  { name: "Danuta K.", city: "Staszów", tier: "elevated", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 55, salesStep: 6, auditStep: 4, docsHours: 16, signDays: 3, agreements: [termo(104_000, 8_000)] },
  { name: "Grażyna T.", city: "Włoszczowa", tier: "basic", mode: "solo", auditor: "e-ola", sales: "e-marek", startDaysAgo: 35, salesStep: -1, auditStep: 3, agreements: [termo(70_000, 2_000)] },
  // klienci Anny (manager) — do jej Orbity i struktury
  { name: "Roman F.", city: "Kraków", tier: "elevated", mode: "solo", auditor: "e-tomek", sales: "e-anna", startDaysAgo: 20, salesStep: 5, auditStep: 4, docsHours: 8, signDays: 2, agreements: [termo(140_000, 12_000)] },
  { name: "Irena C.", city: "Tarnów", tier: "basic", mode: "duo", auditor: "e-ola", sales: "e-anna", startDaysAgo: 10, salesStep: 4, auditStep: 3, docsHours: 15, signDays: 3, agreements: [termo(99_000, 7_000)] },
];

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function buildClient(seed: ClientSeed, index: number, now: number): CrmClient {
  const id = `c-${String(index + 1).padStart(3, "0")}`;
  const start = now - seed.startDaysAgo * DAY;

  const auditHistory: CrmStatusChange[] = [];
  for (let step = 0; step <= seed.auditStep; step++) {
    auditHistory.push({ status: AUDIT_FLOW[step], at: iso(start + step * 0.5 * DAY) });
  }

  const salesHistory: CrmStatusChange[] = [{ status: SALES_FLOW[0], at: iso(start - DAY) }];
  const handedOver = start + 1 * DAY;
  const signed = handedOver + (seed.signDays ?? 3) * DAY;
  const docs = signed + (seed.docsHours ?? 24) * HOUR;
  const times = [start - DAY, handedOver, signed, docs];
  const lastStep = seed.salesStep === -1 ? 2 : seed.salesStep;
  for (let step = 1; step <= lastStep; step++) {
    const at = times[step] ?? docs + (step - 3) * 3 * DAY;
    salesHistory.push({ status: SALES_FLOW[step], at: iso(Math.min(at, now - HOUR)) });
  }
  if (seed.salesStep === -1) salesHistory.push({ status: "Rezygnacja", at: iso(signed + 2 * DAY) });

  return {
    id,
    displayName: seed.name,
    city: seed.city,
    incomeTier: seed.tier,
    mode: seed.mode,
    salesStatusHistory: salesHistory,
    auditStatusHistory: auditHistory,
    assignmentHistory: [
      { employeeId: seed.auditor, at: iso(start - DAY) },
      { employeeId: seed.sales, at: iso(handedOver) },
    ],
    agreements: seed.agreements.map((a, i) => ({ ...a, id: `${id}-u${i + 1}`, signedAt: lastStep >= 2 ? iso(signed) : null })),
    crmUrl: `https://funduszremontowy.rrcrm.pl/customers/${id}`,
  };
}

export function buildMockClients(now: Date = new Date()): CrmClient[] {
  return seeds.map((seed, index) => buildClient(seed, index, now.getTime()));
}
