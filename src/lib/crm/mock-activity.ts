/**
 * DANE TESTOWE aktywności, których nie liczymy jeszcze z CRM:
 * zatwierdzone opinie 5★ (Etap 2 — Wieża), surowe KPI audytorów
 * i realizacja targetu spółki (target wpisuje admin).
 */
export interface MockActivity {
  approvedFiveStarReviews: number;
  auditorKpi?: {
    unique_meetings: number;
    leads_per_cycle: number;
    crm_reporting: number;
    crm_task_time: number;
  };
}

export const mockActivity: Record<string, MockActivity> = {
  "e-anna": { approvedFiveStarReviews: 2 },
  "e-marek": { approvedFiveStarReviews: 8 },
  "e-ola": { approvedFiveStarReviews: 0, auditorKpi: { unique_meetings: 3.6, leads_per_cycle: 10.2, crm_reporting: 96, crm_task_time: 14 } },
  "e-tomek": { approvedFiveStarReviews: 0, auditorKpi: { unique_meetings: 3.1, leads_per_cycle: 9.4, crm_reporting: 91, crm_task_time: 30 } },
};

/** Realizacja targetu spółki w bieżącym miesiącu (%). */
export const mockCompanyTargetPct = 103;
