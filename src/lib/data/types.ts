import type { AcademyProgress, AcademyStage, AcademyTrack, ExamAttempt } from "@/lib/academy/types";
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
  /** Kiedy admin wpisał nadmarżę (ISO). Wpis po zazielenieniu → „Dopłata nadmarży”. */
  surchargeSetAt?: string | null;
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

/** Wpis w historii potwierdzeń handlowca (Zarząd / Admin): kto, kiedy, poprzednia wartość. */
export interface SalesDecision {
  clientId: string;
  employeeId: string;
  /** Handlowiec przypisany wcześniej (null = nierozpoznany). */
  previousEmployeeId: string | null;
  by: string;
  at: string;
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
  confirmSalesPerson(decision: SalesDecision): Promise<void>;
  /** Historia potwierdzeń (najnowsze pierwsze). */
  salesDecisions(): Promise<SalesDecision[]>;
  /** Akademia: etapy ścieżki (treści), postęp osoby, zapis lekcji i podejść do egzaminu. */
  academyStages(track: AcademyTrack): Promise<AcademyStage[]>;
  academyProgress(userId: string): Promise<AcademyProgress>;
  markLessonDone(userId: string, lessonId: string): Promise<void>;
  saveExamAttempt(userId: string, attempt: ExamAttempt): Promise<void>;
  yellowCardsOf(personId: string): Promise<YellowCard[]>;
}
