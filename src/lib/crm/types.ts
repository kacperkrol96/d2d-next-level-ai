import type { IncomeTier } from "@/lib/config/types";

/**
 * Model danych z CRM (RRUP) — TYLKO pola potrzebne aplikacji.
 * RODO: nigdy nie pobieramy ani nie zapisujemy PESEL, numerów ksiąg
 * wieczystych, numerów działek ani innych zbędnych danych osobowych.
 */

export interface CrmStatusChange {
  status: string;
  /** ISO 8601 — data wejścia w status (historia statusów: createdAt / stateAfter). */
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
  clientId: string;
  /** Numer umowy, np. „MW/12/09/26/TERMO” — zakres i inicjały odczytujemy z numeru. */
  number: string;
  /** Typ z CRM: PREFINANSOWANIE 2.0, OZE 2.0, AUDYT CP 2.0 (nie rozróżnia termo/kocioł). */
  type: string;
  /** Historia statusów (rosnąco po dacie); ostatni wpis = obecny status. */
  statusHistory: CrmStatusChange[];
  /** Pole „user” umowy — przy umowie audytowej (/A) to audytor; przy innych bywa przypadkowe. */
  userId: string | null;
  valueNet: number;
  /** Nadmarża netto (docelowo z Konfiguratora). */
  surchargeNet: number;
}

export interface CrmClient {
  id: string;
  /** Imię i inicjał nazwiska — wystarczy do rozpoznania klienta w aplikacji. */
  displayName: string;
  city: string;
  incomeTier: IncomeTier;
  /** Przypisany pracownik KLIENTA = handlowiec (w API bywa puste → inicjały z numeru). */
  assignedEmployeeId: string | null;
  /**
   * Oznaczenie „sam VAT” z oferty (Konfigurator). Gdy ustawione — ma
   * pierwszeństwo przed regułą (próg dochodowy + brak REK). null = brak oferty.
   */
  samVatFromOffer: boolean | null;
  /** Link do klienta w CRM. */
  crmUrl: string;
}

export interface CrmProvider {
  readonly source: "mock" | "rrup";
  listEmployees(): Promise<CrmEmployee[]>;
  listClients(): Promise<CrmClient[]>;
  listAgreements(): Promise<CrmAgreement[]>;
  /** Przycisk „zgłoś błąd przypisania klienta”. */
  reportAssignmentError(clientId: string, reporterId: string, note: string): Promise<void>;
}
