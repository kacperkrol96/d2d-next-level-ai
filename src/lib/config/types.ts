/**
 * Typy konfiguracji biznesowej. Wszystkie stawki, progi, wagi i procenty
 * pochodzą z bazy (edytowalne przez admina) — kod liczy wyłącznie na
 * obiektach tego typu i nigdy nie zawiera liczb biznesowych na sztywno.
 */

export type Role = "auditor" | "sales" | "manager" | "admin";

/** Próg dochodowy klienta w programie Czyste Powietrze. */
export type IncomeTier = "basic" | "elevated" | "highest";

export interface SalesLevel {
  level: number;
  title: string;
  /** Prowizja za klienta, gdy handlowiec zamyka sam. */
  soloRate: number;
  /** Prowizja za klienta w trybie duet. */
  duoRate: number;
  /** Łączna liczba klientów potrzebna do osiągnięcia poziomu. */
  clientsToReach: number;
  /** Udział handlowca w nadmarży (0–1). */
  surchargeShare: number;
  /** Wynagrodzenie za opiekę nad zespołem (od poziomu 5, wpisuje admin). */
  teamCareFee: number | null;
}

export interface AuditorLevel {
  level: number;
  title: string;
  rates: Record<IncomeTier, number>;
  /** Bonus, gdy handlowiec zamknie klienta z audytu tego audytora. */
  closingBonus: number;
  /** Łączna liczba klientów potrzebna do osiągnięcia poziomu. */
  clientsToReach: number;
  /** Wymagana liczba aktywnych osób w strukturze. */
  activePeopleToReach: number;
  /** Czy do progu liczą się klienci całej struktury. */
  countsStructure: boolean;
}

/** Kierunek oceny KPI: więcej = lepiej albo mniej = lepiej (np. czas). */
export type KpiDirection = "higher" | "lower";

export interface KpiDefinition {
  key: string;
  label: string;
  weight: number;
  /** Progi poziomów I–V, w kolejności od I do V. */
  thresholds: [number, number, number, number, number];
  direction: KpiDirection;
  unit: "%" | "pkt" | "dni" | "h" | "szt";
  description?: string;
}

export interface KpiBand {
  /** Minimalny wynik (0–100 pkt), od którego obowiązuje przedział. */
  minScore: number;
  /** Mnożnik wypłaty (np. 0.9 = 90%). */
  multiplier: number;
  label: string;
  /** Wynik poniżej minimum — alert do managera. */
  belowMinimum: boolean;
  /** Wynik w tym przedziale zapisuje żółtą kartkę w historii osoby. */
  yellowCard: boolean;
}

export interface FleetBand {
  minClients: number;
  /** null = bez górnej granicy */
  maxClients: number | null;
  /** Miesięczny koszt auta firmowego dla handlowca. */
  cost: number;
}

export interface CommissionRules {
  /** Obniżka prowizji dla klienta „sam VAT” (0.75 = −75%). */
  samVatReduction: number;
  /** Limit nadmarży jako udział wartości netto umów termo + źródło ciepła (0.10 = 10%). */
  surchargeCapShare: number;
  /** Oferta niepodpisana po tylu dniach wchodzi do średniej z tą wartością. */
  offerSignCapDays: number;
  /** Okno (godziny) na komplet dokumentów od podpisania umowy — KPI handlowiec + biuro. */
  documentsDeadlineHours: number;
  /**
   * Od tego poziomu handlowca do progów awansu wliczają się klienci
   * całego zespołu (jego + podległych). Edytowalne przez admina.
   */
  salesStructureCountsFromLevel: number;
}

/** Reguła „sam VAT”: klient na wskazanym progu dochodowym i bez umowy REK. */
export interface SamVatRule {
  enabled: boolean;
  incomeTier: IncomeTier;
}

/** Termin liczony od miesiąca, w którym kończy się okres (0 = ten sam, 1 = następny). */
export interface MonthDay {
  monthOffset: number;
  day: number;
}

/** Okres rozliczeniowy w miesiącu, np. 1–15 i 16–koniec. */
export interface SettlementPeriodRule {
  fromDay: number;
  /** null = ostatni dzień miesiąca */
  toDay: number | null;
  /** Termin rozliczenia/akceptacji. */
  settleBy: MonthDay;
  /** Dzień wypłaty. */
  payoutOn: MonthDay;
}

// ------------------------------------------------------------------ CRM (RRUP)

/** Zakres umowy rozpoznany z końcówki numeru. */
export type AgreementScope = "thermo" | "heatSource" | "rek" | "audit";

/** Tabela: końcówka numeru → zakres (bez względu na wielkość liter). */
export interface ScopeCode {
  codes: string[];
  scope: AgreementScope;
  label: string;
}

/** Tabela: inicjały z numeru umowy → osoba (awaryjne źródło handlowca). */
/**
 * Tabela: inicjały z numeru umowy → osoba. TYLKO podpowiedź w kolejce
 * „Do wyjaśnienia” (inicjały są zawodne: RS ≠ RSZ) — nigdy automatyczne
 * przypisanie prowizji. Dopasowanie najdłuższego prefiksu.
 */
export interface InitialsCode {
  code: string;
  personName: string;
  /** Konto w aplikacji (null = osoba jeszcze bez konta / nieznana). */
  employeeId: string | null;
  note?: string;
}

export type StatusCategory = "in_progress" | "sales_earned" | "auditor_grey" | "auditor_earned" | "negative";

/** Ścieżka statusów jednego typu umowy + tabela status → kategoria. */
export interface AgreementTypeConfig {
  name: string;
  /** Statusy w kolejności procesu (z negatywnymi w miejscu, w którym występują). */
  path: string[];
  /** Status → kategoria (edytuje admin). */
  categories: Record<string, StatusCategory>;
}

export interface CrmRules {
  scopeCodes: ScopeCode[];
  initials: InitialsCode[];
  agreementTypes: AgreementTypeConfig[];
  /** Status zawierający którykolwiek znacznik = zawsze „negatywny”. */
  negativeMarkers: string[];
  /** Statusy pomijane (np. „WYLICZENIE PROWIZJI” — znika z CRM). */
  ignoredStatuses: string[];
  /** Kamienie milowe do KPI i Radaru (nazwy jak w CRM). */
  milestones: {
    /** Podpisanie umowy sprzedażowej. */
    contractSigned: string;
    /** Pierwszy pozytywny status po weryfikacji — koniec okna „komplet dokumentów”. */
    documentsComplete: string;
    /** Wejście umowy audytowej (/A) w ten status = start Radaru i KPI czasu podpisania. */
    offerHandedOver: string;
  };
  /** Co ile minut odświeżać dane z CRM w otwartej aplikacji. */
  refreshMinutes: number;
}

export interface BadgeDefinition {
  key: string;
  label: string;
  description: string;
  /** Miara, od której zależy zdobycie odznaki. */
  metric: "clients" | "kpiMultiplier" | "level";
  min: number;
}

/** Walidacja wag KPI w panelu admina. */
export interface KpiWeightRules {
  /** Wymagana suma wag (np. 20 → max 100 pkt). */
  total: number;
  /** Minimalna waga pojedynczego KPI. */
  min: number;
}

/**
 * Reguła „Nie ma w aplikacji = nie ma klienta”: prowizja i awans tylko dla klientów
 * z leadem założonym w aplikacji przed umową. Przed datą — tylko ostrzeżenie.
 */
export interface AppLeadRule {
  /** Data (YYYY-MM-DD), od której reguła blokuje; null = tylko ostrzeżenia. */
  enforceFrom: string | null;
}

export interface AppConfig {
  salesLevels: SalesLevel[];
  auditorLevels: AuditorLevel[];
  kpi: {
    auditor: KpiDefinition[];
    sales: KpiDefinition[];
  };
  kpiBands: KpiBand[];
  fleetBands: FleetBand[];
  rules: CommissionRules;
  badges: BadgeDefinition[];
  kpiWeightRules: KpiWeightRules;
  appLeadRule: AppLeadRule;
  samVat: SamVatRule;
  /** Strefa czasowa firmy — daty okresów liczymy w czasie polskim. */
  timeZone: string;
  settlementPeriods: SettlementPeriodRule[];
  crm: CrmRules;
}
