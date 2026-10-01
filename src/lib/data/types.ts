import type { AcademyProgress, AcademyStage, AcademyTrack, ExamAttempt, ExamDef, FormSubmission } from "@/lib/academy/types";
import type { AppUser } from "@/lib/auth/users";
import type { AppConfig, IncomeTier } from "@/lib/config/types";
import type { CrmProvider } from "@/lib/crm/types";
import type { ContractAcceptance, ContractTrack, ContractVersion } from "@/lib/contracts/types";
import type { PersonEvent } from "@/lib/domain/cards";
import type { FiveStarReview } from "@/lib/domain/reviews";
import type { PlanChange } from "@/lib/domain/safety";
import type { Squadron } from "@/lib/domain/squadron";

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

/** Dziennik pracy z aplikacji (Terytorium / Misje; dziś dane testowe). */
export interface WorkLog {
  /** Godziny pracy w bieżącym miesiącu (aktywne bloki) — minimum dla umowy zlecenia. */
  hoursThisMonth: number;
  /** Spotkania odbyte / nagrane w bieżącym miesiącu. */
  meetingsHeld: number;
  meetingsRecorded: number;
  /** Dni pracy i godzina „Zamknij dzień” (ISO, null = nie zamknięto). */
  days: { day: string; closedAt: string | null }[];
  /** Dzisiejszy postęp (umówione leady / odbyte spotkania). */
  today: { leads: number; meetings: number };
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
  /** Zmiana ustawień przez admina (np. motyw zwoju kontraktu). */
  updateConfig(patch: Partial<AppConfig>): Promise<void>;
  /** Kontrakty: wersje (edytowane przez admina) i rejestr akceptacji. */
  contractVersions(track?: ContractTrack): Promise<ContractVersion[]>;
  publishContract(version: ContractVersion): Promise<void>;
  contractAcceptances(): Promise<ContractAcceptance[]>;
  acceptContract(acceptance: ContractAcceptance): Promise<void>;
  crm(): CrmProvider;
  listUsers(): Promise<AppUser[]>;
  findUser(id: string): Promise<AppUser | null>;
  kpiInputs(employeeId: string): Promise<KpiInputs>;
  /** Realizacja targetu spółki w bieżącym miesiącu (%), target wpisuje admin. */
  companyTargetPct(): Promise<number>;
  /** Kartki i zdarzenia dyscyplinarne (żółte, spóźnienia, nieobecności) — historia osoby. */
  addDisciplineEvent(event: PersonEvent): Promise<void>;
  disciplineOf(personId: string): Promise<PersonEvent[]>;
  /** Historia systemu wynagrodzenia audytora (Safety / Next Level). */
  auditorPlanHistory(userId: string): Promise<PlanChange[]>;
  /** Zmiana systemu (decyzja managera w Wieży). */
  savePlanChange(userId: string, change: PlanChange): Promise<void>;
  /** Opinie 5★ (Wieża: zatwierdzanie). */
  fiveStarReviews(): Promise<FiveStarReview[]>;
  saveFiveStarReview(review: FiveStarReview): Promise<void>;
  /** Eskadry (zewnętrzne grupy sprzedażowe). */
  squadrons(): Promise<Squadron[]>;
  saveSquadron(squadron: Squadron): Promise<void>;
  workLog(employeeId: string): Promise<WorkLog>;
  appClientData(): Promise<AppClientData>;
  /** Admin potwierdza handlowca (np. podpowiedź z inicjałów) jednym kliknięciem. */
  confirmSalesPerson(decision: SalesDecision): Promise<void>;
  /** Historia potwierdzeń (najnowsze pierwsze). */
  salesDecisions(): Promise<SalesDecision[]>;
  /** Akademia: etapy ścieżki (treści), postęp osoby, zapis lekcji i podejść do egzaminu. */
  academyStages(track: AcademyTrack): Promise<AcademyStage[]>;
  /** Egzamin z kluczem — TYLKO serwer (nigdy do przeglądarki). */
  academyExam(examId: string): Promise<ExamDef | null>;
  academyProgress(userId: string): Promise<AcademyProgress>;
  markLessonDone(userId: string, lessonId: string): Promise<void>;
  /** Obejrzana część filmu (zapisujemy najwyższą). */
  saveVideoProgress(userId: string, lessonId: string, share: number): Promise<void>;
  saveExamAttempt(userId: string, attempt: ExamAttempt): Promise<void>;
  /** Zapis oceny managera (podmiana podejścia o tym samym id). */
  updateExamAttempt(userId: string, attempt: ExamAttempt): Promise<void>;
  saveFormSubmission(submission: FormSubmission): Promise<void>;
  /** Linki do filmów (klucz filmu → id filmu YouTube), przypisuje admin. */
  videoLinks(): Promise<Record<string, string>>;
  setVideoLink(key: string, youtubeId: string | null): Promise<void>;
}
