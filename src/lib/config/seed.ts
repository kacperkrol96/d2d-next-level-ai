import type { AgreementTypeConfig, AppConfig, StatusCategory } from "./types";

/**
 * Buduje domyślną tabelę status → kategoria ze ścieżki: wszystko przed
 * pierwszym progiem = „w toku”, od progu = kategoria progu, a statusy
 * z „NEGATYWNA” / „WIN-BACK” / „SPAD” = „negatywny”. Admin może potem
 * zmienić każdą pozycję tabeli.
 */
function buildType(name: string, path: string[], thresholds: { from: string; category: StatusCategory }[]): AgreementTypeConfig {
  const categories: Record<string, StatusCategory> = {};
  let current: StatusCategory = "in_progress";
  for (const status of path) {
    const threshold = thresholds.find((t) => t.from === status);
    if (threshold) current = threshold.category;
    categories[status] = /NEGATYWNA|WIN-BACK|SPAD|DZIAŁ PRAWNY/.test(status) ? "negative" : current;
  }
  categories["WIN-BACK"] = "negative";
  categories["SPAD"] = "negative";
  categories["DZIAŁ PRAWNY"] = "negative";
  return { name, path, categories };
}

/**
 * DANE STARTOWE konfiguracji (ze specyfikacji docs/SPEC.md).
 *
 * To jest wyłącznie zawartość początkowa bazy — w Etapie 1 trafi do tabel
 * Supabase i od tego momentu admin edytuje ją w panelu. Kod aplikacji nigdy
 * nie importuje tych wartości bezpośrednio; zawsze przez getConfig().
 */
export const seedConfig: AppConfig = {
  salesLevels: [
    { level: 1, title: "Młodszy Doradca Energetyczny", soloRate: 3000, duoRate: 5000, clientsToReach: 0, surchargeShare: 0.3, teamCareFee: null },
    { level: 2, title: "Doradca Energetyczny", soloRate: 3500, duoRate: 5500, clientsToReach: 3, surchargeShare: 0.35, teamCareFee: null },
    { level: 3, title: "Starszy Doradca Klienta", soloRate: 4000, duoRate: 6000, clientsToReach: 6, surchargeShare: 0.4, teamCareFee: null },
    { level: 4, title: "Młodszy Specjalista", soloRate: 4500, duoRate: 6500, clientsToReach: 10, surchargeShare: 0.45, teamCareFee: null },
    { level: 5, title: "Specjalista ds. Energii", soloRate: 5000, duoRate: 7000, clientsToReach: 15, surchargeShare: 0.5, teamCareFee: null },
    { level: 6, title: "Lider Zespołu", soloRate: 5500, duoRate: 7500, clientsToReach: 50, surchargeShare: 0.55, teamCareFee: null },
    { level: 7, title: "Kierownik Okręgu", soloRate: 6000, duoRate: 8000, clientsToReach: 125, surchargeShare: 0.6, teamCareFee: null },
    { level: 8, title: "Dyrektor Regionalny", soloRate: 6500, duoRate: 8500, clientsToReach: 250, surchargeShare: 0.65, teamCareFee: null },
    { level: 9, title: "Dyrektor Krajowy", soloRate: 7500, duoRate: 9000, clientsToReach: 500, surchargeShare: 0.7, teamCareFee: null },
    { level: 10, title: "Dyrektor Generalny", soloRate: 8000, duoRate: 9500, clientsToReach: 1000, surchargeShare: 0.75, teamCareFee: null },
  ],

  auditorLevels: [
    { level: 1, title: "Młodszy Audytor Energetyczny", rates: { basic: 600, elevated: 800, highest: 1200 }, closingBonus: 250, clientsToReach: 0, activePeopleToReach: 0, countsStructure: false },
    { level: 2, title: "Audytor Energetyczny", rates: { basic: 675, elevated: 900, highest: 1325 }, closingBonus: 375, clientsToReach: 3, activePeopleToReach: 0, countsStructure: false },
    { level: 3, title: "Starszy Audytor Energetyczny", rates: { basic: 750, elevated: 1000, highest: 1450 }, closingBonus: 500, clientsToReach: 10, activePeopleToReach: 0, countsStructure: false },
    { level: 4, title: "Ekspert Audytu", rates: { basic: 825, elevated: 1100, highest: 1575 }, closingBonus: 625, clientsToReach: 30, activePeopleToReach: 0, countsStructure: false },
    { level: 5, title: "Starszy Ekspert Audytu", rates: { basic: 900, elevated: 1200, highest: 1700 }, closingBonus: 750, clientsToReach: 50, activePeopleToReach: 2, countsStructure: true },
    { level: 6, title: "Lider Zespołu Audytu", rates: { basic: 975, elevated: 1300, highest: 1825 }, closingBonus: 875, clientsToReach: 100, activePeopleToReach: 4, countsStructure: true },
    { level: 7, title: "Kierownik Okręgu Audytu", rates: { basic: 1050, elevated: 1400, highest: 1950 }, closingBonus: 1000, clientsToReach: 200, activePeopleToReach: 6, countsStructure: true },
    { level: 8, title: "Dyrektor Regionalny Audytu", rates: { basic: 1125, elevated: 1500, highest: 2075 }, closingBonus: 1125, clientsToReach: 350, activePeopleToReach: 8, countsStructure: true },
    { level: 9, title: "Dyrektor Krajowy Audytu", rates: { basic: 1200, elevated: 1600, highest: 2200 }, closingBonus: 1250, clientsToReach: 600, activePeopleToReach: 10, countsStructure: true },
    { level: 10, title: "Dyrektor Generalny Audytu", rates: { basic: 1275, elevated: 1700, highest: 2325 }, closingBonus: 1375, clientsToReach: 1000, activePeopleToReach: 15, countsStructure: true },
  ],

  kpi: {
    auditor: [
      { key: "unique_meetings", label: "Liczba unikalnych spotkań", weight: 6, thresholds: [3, 3.25, 3.5, 3.75, 4], direction: "higher", unit: "szt" },
      { key: "leads_per_cycle", label: "Komplet leadów na cykl", weight: 4, thresholds: [9, 9.5, 10, 11, 11.5], direction: "higher", unit: "szt" },
      { key: "company_target", label: "Realizacja targetu spółki", weight: 4, thresholds: [90, 95, 100, 105, 110], direction: "higher", unit: "%" },
      { key: "reporting", label: "Raportowanie (z aplikacji)", weight: 4, thresholds: [85, 90, 92.5, 95, 100], direction: "higher", unit: "%", description: "% aktywnych bloków w czasie pracy" },
      { key: "crm_task_time", label: "Termin realizacji zadań w CRM", weight: 2, thresholds: [48, 36, 24, 12, 0], direction: "lower", unit: "h" },
    ],
    sales: [
      { key: "team_auditors_kpi", label: "Średni wynik KPI audytorów", weight: 5, thresholds: [30, 46, 59, 70, 90], direction: "higher", unit: "pkt" },
      { key: "offer_sign_time", label: "Czas podpisania oferty", weight: 5, thresholds: [6, 5, 4, 3.5, 3], direction: "lower", unit: "dni", description: "Średni czas od „PRZEKAZANA DO PH” do podpisania umowy" },
      { key: "documents_24h", label: "Komplet dokumentów (handlowiec + biuro)", weight: 4, thresholds: [70, 80, 90, 95, 100], direction: "higher", unit: "%", description: "% klientów, u których od podpisania umowy do pierwszego pozytywnego statusu po weryfikacji minęło ≤ okno (domyślnie 24h)" },
      { key: "five_star_reviews", label: "Opinie 5★", weight: 2, thresholds: [70, 75, 80, 90, 95], direction: "higher", unit: "%", description: "% klientów z ofertą, którzy mają zaliczoną opinię 5★" },
      { key: "reporting", label: "Raportowanie (z aplikacji)", weight: 2, thresholds: [85, 90, 92.5, 95, 100], direction: "higher", unit: "%", description: "% aktywnych bloków w czasie pracy" },
      { key: "company_result", label: "Wynik spółki", weight: 2, thresholds: [90, 95, 100, 105, 110], direction: "higher", unit: "%" },
    ],
  },

  kpiBands: [
    { minScore: 0, multiplier: 0.75, label: "Poniżej minimum", belowMinimum: true, yellowCard: true },
    { minScore: 30, multiplier: 0.75, label: "75%", belowMinimum: false, yellowCard: false },
    { minScore: 46, multiplier: 0.8, label: "80%", belowMinimum: false, yellowCard: false },
    { minScore: 59, multiplier: 0.9, label: "90%", belowMinimum: false, yellowCard: false },
    { minScore: 70, multiplier: 1.0, label: "100%", belowMinimum: false, yellowCard: false },
    { minScore: 90, multiplier: 1.1, label: "110%", belowMinimum: false, yellowCard: false },
  ],

  fleetBands: [
    { minClients: 0, maxClients: 1, cost: 1500 },
    { minClients: 2, maxClients: 3, cost: 750 },
    { minClients: 4, maxClients: null, cost: 0 },
  ],

  rules: {
    samVatReduction: 0.75,
    surchargeCapShare: 0.1,
    offerSignCapDays: 7,
    documentsDeadlineHours: 24,
    salesStructureCountsFromLevel: 5,
  },

  samVat: { enabled: true, incomeTier: "highest" },

  timeZone: "Europe/Warsaw",

  settlementPeriods: [
    { fromDay: 1, toDay: 15, settleBy: { monthOffset: 0, day: 20 }, payoutOn: { monthOffset: 0, day: 25 } },
    { fromDay: 16, toDay: null, settleBy: { monthOffset: 1, day: 5 }, payoutOn: { monthOffset: 1, day: 10 } },
  ],

  crm: {
    scopeCodes: [
      { codes: ["TERMO", "TERM"], scope: "thermo", label: "Termomodernizacja" },
      { codes: ["KOT"], scope: "heatSource", label: "Kocioł" },
      { codes: ["PC"], scope: "heatSource", label: "Pompa ciepła" },
      { codes: ["ZGAZ"], scope: "heatSource", label: "Kocioł zgazowujący na drewno" },
      { codes: ["REK"], scope: "rek", label: "Rekuperacja" },
      { codes: ["A"], scope: "audit", label: "Audyt" },
    ],
    // Tylko podpowiedzi w kolejce „Do wyjaśnienia”; konta (employeeId) podepnie admin.
    initials: [
      { code: "ŁŁ", personName: "Łukasz Łubkowski", employeeId: null },
      { code: "WL", personName: "Włodzimierz Lemański", employeeId: null },
      { code: "WŁ", personName: "Włodzimierz Lemański", employeeId: null },
      { code: "ŁB", personName: "Łukasz Burliga", employeeId: null, note: "eskadra zewnętrzna" },
      { code: "DK", personName: "Dawid Kubowicz", employeeId: null },
      { code: "KS", personName: "Kacper Szymanek", employeeId: null },
      { code: "RS", personName: "Rafał Szwed", employeeId: null },
      { code: "RSZ", personName: "Rafał Szczypkowski", employeeId: null },
      { code: "PK", personName: "Piotr Kaszyński", employeeId: null },
      { code: "DH", personName: "Damian Harasiuk", employeeId: null },
      { code: "ES", personName: "Ewelina Sroka", employeeId: null },
      { code: "MN", personName: "Marcin Nowakowski", employeeId: null },
      { code: "MP", personName: "nieznane", employeeId: null },
      // osoby testowe (dane demo)
      { code: "MW", personName: "Marek Wiśniewski (test)", employeeId: "e-marek" },
      { code: "AK", personName: "Anna Kowalska (test)", employeeId: "e-anna" },
    ],
    agreementTypes: [
      buildType("PREFINANSOWANIE 2.0", [
        "ZAWIERANIE UMOWY",
        "UMOWA PODPISANA",
        "WELCOME CALL",
        "W TRAKCIE FINANSOWANIA",
        "WYLICZENIE PROWIZJI",
        "WERYFIKACJA UMOWY",
        "WERYFIKACJA DOKUMENTOWA NEGATYWNA",
        "REALIZACJA AUDYTU - GWD",
        "PRZYGOTOWANIE DOKUMENTÓW WFOŚ",
        "WERYFIKACJA DOKUMENTÓW WFOŚ",
        "NEGATYWNA WERYFIKACJA DOKUMENTOWA - WFOŚ",
        "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW",
        "OCZEKIWANIE NA DECYZJĘ",
      ], [{ from: "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", category: "sales_earned" }]),
      buildType("AUDYT CP 2.0", [
        "ZAWIERANIE UMOWY",
        "UMOWA PODPISANA",
        "WERYFIKACJA FORMALNA",
        "WELCOME CALL",
        "WYLICZENIE PROWIZJI",
        "OCZEKIWANIE NA GOPS/MOPS",
        "WERYFIKACJA UMOWY",
        "NEGATYWNA WERYFIKACJA DOKUMENTACYJNA",
        "W TRAKCIE POMIARÓW",
        "DOKUMENTACJA POMIAROWA",
        "WERYFIKACJA POMIAROWA",
        "NEGATYWNA WERYFIKACJA POMIAROWA",
        "TWORZENIE OFERTY",
        "PRZEKAZANA DO PH",
        "SUKCES",
      ], [
        { from: "DOKUMENTACJA POMIAROWA", category: "auditor_grey" },
        { from: "TWORZENIE OFERTY", category: "auditor_earned" },
      ]),
      // OZE 2.0 = umowy REK; ścieżka z obserwacji API (pisownia „ZAMAWANIE” jak w CRM).
      buildType("OZE 2.0", [
        "ZAWIERANIE UMOWY",
        "UMOWA PODPISANA",
        "W TRAKCIE FINANSOWANIA",
        "WELCOME CALL",
        "WERYFIKACJA UMOWY",
        "ZAMAWANIE TOWARU",
      ], []),
    ],
    negativeMarkers: ["NEGATYWNA", "WIN-BACK", "SPAD", "DZIAŁ PRAWNY"],
    ignoredStatuses: ["WYLICZENIE PROWIZJI"],
    milestones: {
      contractSigned: "UMOWA PODPISANA",
      documentsComplete: "REALIZACJA AUDYTU - GWD",
      offerHandedOver: "PRZEKAZANA DO PH",
    },
    refreshMinutes: 15,
  },

  badges: [
    { key: "first_client", label: "Pierwszy klient", description: "Pierwsza zarobiona prowizja", metric: "clients", min: 1 },
    { key: "five_clients", label: "Piątka", description: "5 klientów na koncie", metric: "clients", min: 5 },
    { key: "kpi_100", label: "Pełna moc", description: "Mnożnik KPI 100% lub więcej", metric: "kpiMultiplier", min: 1 },
    { key: "kpi_110", label: "Ponad normę", description: "Mnożnik KPI 110%", metric: "kpiMultiplier", min: 1.1 },
    { key: "ten_clients", label: "Dziesiątka", description: "10 klientów na koncie", metric: "clients", min: 10 },
    { key: "structure", label: "Lider", description: "Poziom 5 — własna struktura", metric: "level", min: 5 },
  ],


  kpiWeightRules: { total: 20, min: 2 },

  // Data włączenia reguły ustawi admin (2 tygodnie po starcie pilota).
  appLeadRule: { enforceFrom: null },

  academy: { passThreshold: 0.8, examPassThresholds: { d1: 0.8, d2: 0.8, manager: 0.7 },
    // Klucze odtworzone z treści (PDF zgubił zaznaczenia) — do weryfikacji: docs/tresci/KLUCZE_DO_WERYFIKACJI.md
    verifiedExams: { d1: false, d2: false, manager: false },
    scenkaRecommendedMin: 50, retryCooldownMinutes: 30, requireLessonsBeforeExam: true, videoWatchedShare: 0.9 },

  safety: {
    tiers: [
      { minMeasurements: 0, base: 0, perExtra: 0 },
      { minMeasurements: 5, base: 3750, perExtra: 200 },
      { minMeasurements: 10, base: 7000, perExtra: 250 },
      { minMeasurements: 15, base: 10000, perExtra: 300 },
    ],
    // Minimalna stawka godzinowa (umowa zlecenia) na 2026 — decyzja Kacpra.
    minHourlyRate: 31.4,
    applyKpiMultiplier: true,
  },

  cards: {
    yellowReasons: {
      late: "Spóźnienie",
      no_report: "Brak raportu w CRM / aplikacji",
      no_gops: "Brak GOPS",
      amount_before_measurement: "Obietnica kwoty przed pomiarem",
      client_pressure: "Presja na kliencie",
      kpi_below_minimum: "Wynik KPI poniżej 30 pkt",
    },
    red: { lateness: 3, absences: 2, yellowCards: 2, windowDays: 90 },
  },

  rhythm: {
    auditor: {
      bookingDays: [1, 3, 5],
      meetingDays: [2, 4, 6],
      bookingHours: { from: 9, to: 20 },
      cycle: { leads: 12, meetings: 6, agreements: 2, measurements: 1 },
      week: { booked: 36, held: 18 },
    },
    briefings: [
      { days: [1, 3, 5], time: "08:30", title: "Odprawa", place: "online" },
      { days: [1], time: "08:00", title: "Odprawa w biurze (wszyscy)", place: "biuro" },
    ],
    closeDayDeadline: "21:00",
    minRecordedShare: { auditor: 0.2, sales: 0.2 },
  },

  field: { areaCooldownDays: 30, areaCooldownMode: "warning", maxQualifyingQuestions: 3, maxRebuttalsPerObjection: 3 },

  contractScrollTheme: "parchment",

  reviews: { requiredStars: 5, fileRetentionDays: 90 },
};
