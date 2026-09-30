import type { IncomeTier } from "@/lib/config/types";

/**
 * Model danych z CRM (RRUP) — TYLKO pola potrzebne aplikacji.
 * RODO: nigdy nie pobieramy ani nie zapisujemy PESEL, numerów ksiąg
 * wieczystych, numerów działek ani innych zbędnych danych osobowych.
 */

export interface CrmStatusChange {
  status: string;
  /** ISO 8601 — data wejścia w status (moduł czasu trwania statusu w CRM). */
  at: string;
}

export interface CrmAssignmentChange {
  employeeId: string;
  at: string;
}

export type CrmEmployeeRole = "auditor" | "sales";

export interface CrmEmployee {
  id: string;
  name: string;
  role: CrmEmployeeRole;
  /** Przełożony w strukturze (handlowiec jest managerem audytorów). */
  managerId: string | null;
}

export interface CrmAgreement {
  id: string;
  /** Rodzaj umowy jak w CRM (np. „Termomodernizacja”, „Kocioł”) — Solo/Duet liczymy z tego pola. */
  kind: string;
  valueNet: number;
  surchargeNet: number;
  samVat: boolean;
  signedAt: string | null;
}

export interface CrmClient {
  id: string;
  /** Imię i inicjał nazwiska — wystarczy do rozpoznania klienta w aplikacji. */
  displayName: string;
  city: string;
  incomeTier: IncomeTier;
  salesStatusHistory: CrmStatusChange[];
  auditStatusHistory: CrmStatusChange[];
  /**
   * Historia przypisań (pole „przypisany pracownik” w API wraca puste),
   * przypisanie zmienia się z audytora na handlowca.
   */
  assignmentHistory: CrmAssignmentChange[];
  agreements: CrmAgreement[];
  /** Link do klienta w CRM. */
  crmUrl: string;
}

export interface CrmProvider {
  readonly source: "mock" | "rrup";
  listEmployees(): Promise<CrmEmployee[]>;
  listClients(): Promise<CrmClient[]>;
  getClient(id: string): Promise<CrmClient | null>;
  /** Przycisk „zgłoś błąd przypisania klienta”. */
  reportAssignmentError(clientId: string, reporterId: string, note: string): Promise<void>;
}
