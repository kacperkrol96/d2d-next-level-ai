import type { AppUser } from "@/lib/auth/users";
import type { AppConfig, IncomeTier } from "@/lib/config/types";
import type { CrmProvider } from "@/lib/crm/types";
import type { YellowCard } from "@/lib/domain/yellow-card";

/** Dane do KPI, których nie liczymy z CRM (opinie 5★ z Wieży, aktywność audytora). */
export interface KpiInputs {
  approvedFiveStarReviews: number;
  /** % aktywnych bloków w czasie pracy (z Terytorium; dziś dane testowe). */
  reportingPct: number | null;
  auditorKpi: {
    unique_meetings: number;
    leads_per_cycle: number;
    crm_task_time: number;
  } | null;
}

/**
 * Dane handlowe klienta prowadzone w aplikacji. Docelowo z Konfiguratora
 * (oferta), do tego czasu ręczne pola uzupełniane przez admina.
 */
export interface ClientTerms {
  clientId: string;
  incomeTier: IncomeTier | null;
  /** Nadmarża netto klienta (null = nieuzupełniona). */
  surchargeNet: number | null;
  /** „Sam VAT” z oferty — ma pierwszeństwo przed regułą (null = brak oferty). */
  samVatFromOffer: boolean | null;
}

/**
 * Źródło prawdy o handlowcu z aplikacji: przyjęcie oferty w Radarze, lead
 * założony w aplikacji albo decyzja admina (potwierdzenie podpowiedzi z kolejki).
 */
export interface SalesAttribution {
  clientId: string;
  employeeId: string;
  source: "radar" | "lead" | "admin";
  /** ISO — kiedy (dla leadu: data założenia, ważna dla reguły „Nie ma w aplikacji…”). */
  at: string;
  note?: string;
}

/** Wyjątek managera od reguły „Nie ma w aplikacji = nie ma klienta”. */
export interface LeadRuleException {
  clientId: string;
  approvedBy: string;
  reason: string;
  at: string;
}

/** Dane z aplikacji potrzebne do rozpoznania klientów. */
export interface AppClientData {
  terms: ClientTerms[];
  attributions: SalesAttribution[];
  leadExceptions: LeadRuleException[];
}

/**
 * Źródło danych aplikacji — JEDYNE miejsce do podmiany przy podłączeniu Supabase.
 * Ekrany i serwisy korzystają wyłącznie z tego interfejsu (przez getDataSource()).
 */
export interface DataSource {
  readonly kind: "mock" | "supabase";
  getConfig(): Promise<AppConfig>;
  crm(): CrmProvider;
  listUsers(): Promise<AppUser[]>;
  findUser(id: string): Promise<AppUser | null>;
  kpiInputs(employeeId: string): Promise<KpiInputs>;
  /** Realizacja targetu spółki w bieżącym miesiącu (%), target wpisuje admin. */
  companyTargetPct(): Promise<number>;
  saveYellowCard(card: YellowCard): Promise<void>;
  appClientData(): Promise<AppClientData>;
  /** Admin potwierdza handlowca (np. podpowiedź z inicjałów) jednym kliknięciem. */
  confirmSalesPerson(clientId: string, employeeId: string, adminId: string): Promise<void>;
  yellowCardsOf(personId: string): Promise<YellowCard[]>;
}
