import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { computeKpi } from "../kpi";
import { recordYellowCard, yellowCardFor } from "../yellow-card";

const weak = computeKpi(config.kpi.auditor, { unique_meetings: 2, leads_per_cycle: 5, company_target: 92, crm_reporting: 80, crm_task_time: 72 }, config.kpiBands);
const ok = computeKpi(config.kpi.auditor, { unique_meetings: 4, leads_per_cycle: 12, company_target: 110, crm_reporting: 100, crm_task_time: 0 }, config.kpiBands);
const period = new Date("2026-09-28T00:00:00Z");
const now = new Date("2026-09-30T12:00:00Z");

describe("KPI 0–29 pkt: mnożnik 75% + alert + żółta kartka", () => {
  it("wynik poniżej minimum → mnożnik 75%, alert i kartka", () => {
    expect(weak.score).toBeLessThan(30);
    expect(weak.multiplier).toBe(0.75);
    expect(weak.belowMinimum).toBe(true);
    expect(weak.yellowCard).toBe(true);
    expect(yellowCardFor("e-ola", weak, period, now)).toMatchObject({ personId: "e-ola", kpiScore: weak.score, periodStart: period.toISOString() });
  });

  it("wynik 30+ → bez kartki", () => {
    expect(ok.yellowCard).toBe(false);
    expect(yellowCardFor("e-ola", ok, period, now)).toBeNull();
  });

  it("kartka zapisuje się w historii osoby najwyżej raz na okres", () => {
    const card = yellowCardFor("e-ola", weak, period, now);
    let history = recordYellowCard([], card);
    history = recordYellowCard(history, card);
    expect(history).toHaveLength(1);
    const nextPeriod = yellowCardFor("e-ola", weak, new Date("2026-10-12T00:00:00Z"), now);
    expect(recordYellowCard(history, nextPeriod)).toHaveLength(2);
  });
});
