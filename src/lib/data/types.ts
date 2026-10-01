import type { AppUser } from "@/lib/auth/users";
import type { AppConfig } from "@/lib/config/types";
import type { CrmProvider } from "@/lib/crm/types";
import type { YellowCard } from "@/lib/domain/yellow-card";

/** Dane do KPI, których nie liczymy z CRM (opinie 5★ z Wieży, aktywność audytora). */
export interface KpiInputs {
  approvedFiveStarReviews: number;
  auditorKpi: {
    unique_meetings: number;
    leads_per_cycle: number;
    crm_reporting: number;
    crm_task_time: number;
  } | null;
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
  yellowCardsOf(personId: string): Promise<YellowCard[]>;
}
