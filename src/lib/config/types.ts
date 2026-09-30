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
}

export interface FleetBand {
  minClients: number;
  /** null = bez górnej granicy */
  maxClients: number | null;
  /** Miesięczny koszt auta firmowego dla handlowca. */
  cost: number;
}

export interface CommissionRules {
  /** Status sprzedażowy, od którego prowizja handlowca jest zielona. */
  salesGreenFromStatus: string;
  /** Status umowy audytowej, od którego prowizja audytora jest zielona. */
  auditorGreenFromStatus: string;
  /** Status sprzedażowy, od którego audytor dostaje bonus za zamknięcie. */
  auditorClosingBonusFromStatus: string;
  /** Obniżka prowizji dla umowy „sam VAT” (0.75 = −75%). */
  samVatReduction: number;
  /** Limit nadmarży jako udział wartości umowy netto (0.10 = 10%). */
  surchargeCapShare: number;
  /** Długość okresu rozliczeniowego w dniach. */
  settlementPeriodDays: number;
  /** Data startu pierwszego okresu rozliczeniowego (YYYY-MM-DD). */
  settlementAnchorDate: string;
  /** Oferta niepodpisana po tylu dniach wchodzi do średniej z tą wartością. */
  offerSignCapDays: number;
  /** Limit godzin na komplet dokumentów od podpisania umowy. */
  documentsDeadlineHours: number;
}

export interface Pipelines {
  /** Statusy sprzedażowe klienta w kolejności procesu. */
  sales: string[];
  /** Statusy umowy audytowej w kolejności procesu. */
  audit: string[];
  /** Statusy kończące współpracę (rezygnacja itp.). */
  cancelled: string[];
  /** Statusy-kamienie milowe używane w KPI (nazwy jak w CRM). */
  milestones: {
    offerHandedOver: string;
    contractSigned: string;
    documentsComplete: string;
  };
}

export interface BadgeDefinition {
  key: string;
  label: string;
  description: string;
  /** Miara, od której zależy zdobycie odznaki. */
  metric: "clients" | "kpiMultiplier" | "level";
  min: number;
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
  pipelines: Pipelines;
  badges: BadgeDefinition[];
}
