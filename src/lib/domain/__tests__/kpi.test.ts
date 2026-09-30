import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { averageOfferSignDays, bandForScore, computeKpi, documentsOnTimeRate, fiveStarReviewRate, kpiLevel } from "../kpi";

const def = (role: "auditor" | "sales", key: string) => config.kpi[role].find((k) => k.key === key)!;

const d = (iso: string) => new Date(iso);

describe("poziom pojedynczego KPI", () => {
  it("więcej = lepiej", () => {
    const meetings = def("auditor", "unique_meetings");
    expect(kpiLevel(2.9, meetings)).toBe(0);
    expect(kpiLevel(3, meetings)).toBe(1);
    expect(kpiLevel(3.3, meetings)).toBe(2);
    expect(kpiLevel(3.75, meetings)).toBe(4);
    expect(kpiLevel(5, meetings)).toBe(5);
  });

  it("mniej = lepiej (termin zadań w CRM, czas podpisania oferty)", () => {
    const tasks = def("auditor", "crm_task_time");
    expect(kpiLevel(60, tasks)).toBe(0);
    expect(kpiLevel(48, tasks)).toBe(1);
    expect(kpiLevel(20, tasks)).toBe(3);
    expect(kpiLevel(0, tasks)).toBe(5);

    const sign = def("sales", "offer_sign_time");
    expect(kpiLevel(7, sign)).toBe(0);
    expect(kpiLevel(5.5, sign)).toBe(1);
    expect(kpiLevel(3.5, sign)).toBe(4);
    expect(kpiLevel(2, sign)).toBe(5);
  });
});

describe("przedziały i mnożnik", () => {
  it.each([
    [0, 0.75, true],
    [29, 0.75, true],
    [30, 0.75, false],
    [45, 0.75, false],
    [46, 0.8, false],
    [58, 0.8, false],
    [59, 0.9, false],
    [69, 0.9, false],
    [70, 1.0, false],
    [89, 1.0, false],
    [90, 1.1, false],
    [100, 1.1, false],
  ])("wynik %d pkt → mnożnik %d", (score, multiplier, below) => {
    const band = bandForScore(score, config.kpiBands);
    expect(band.multiplier).toBe(multiplier);
    expect(band.belowMinimum).toBe(below);
  });
});

describe("wynik KPI audytora (suma wag 20 → max 100 pkt)", () => {
  it("wszystko na poziomie V = 100 pkt i 110%", () => {
    const result = computeKpi(
      config.kpi.auditor,
      { unique_meetings: 4, leads_per_cycle: 12, company_target: 115, crm_reporting: 100, crm_task_time: 0 },
      config.kpiBands,
    );
    expect(result.score).toBe(100);
    expect(result.multiplier).toBe(1.1);
  });

  it("wynik mieszany", () => {
    const result = computeKpi(
      config.kpi.auditor,
      // spotkania III (3×6=18), leady II (2×4=8), target I (1×4=4), CRM IV (4×4=16), zadania III (3×2=6) = 52
      { unique_meetings: 3.5, leads_per_cycle: 9.5, company_target: 92, crm_reporting: 96, crm_task_time: 24 },
      config.kpiBands,
    );
    expect(result.score).toBe(52);
    expect(result.multiplier).toBe(0.8);
    expect(result.belowMinimum).toBe(false);
  });

  it("poniżej minimum → alert", () => {
    const result = computeKpi(
      config.kpi.auditor,
      { unique_meetings: 2, leads_per_cycle: 5, company_target: 80, crm_reporting: 80, crm_task_time: 72 },
      config.kpiBands,
    );
    expect(result.score).toBe(0);
    expect(result.belowMinimum).toBe(true);
  });

  it("brak danych dla KPI → pomijane, wynik przeskalowany do 100", () => {
    const result = computeKpi(
      config.kpi.sales,
      { five_star_reviews: 100, documents_24h: 100, team_auditors_kpi: null, offer_sign_time: 3, company_result: 110 },
      config.kpiBands,
    );
    expect(result.score).toBe(100);
    expect(result.items.find((i) => i.key === "team_auditors_kpi")?.maxPoints).toBe(0);
  });
});

describe("surowe wartości KPI handlowca z historii statusów", () => {
  const now = d("2026-09-30T12:00:00Z");

  it("średni czas podpisania oferty; niepodpisana po 7 dniach liczy się jako 7", () => {
    const avg = averageOfferSignDays(
      [
        { handedOverAt: d("2026-09-01T12:00:00Z"), signedAt: d("2026-09-03T12:00:00Z") }, // 2 dni
        { handedOverAt: d("2026-09-10T12:00:00Z"), signedAt: d("2026-09-14T12:00:00Z") }, // 4 dni
        { handedOverAt: d("2026-09-15T12:00:00Z"), signedAt: null }, // >7 dni → 7
        { handedOverAt: d("2026-09-28T12:00:00Z"), signedAt: null }, // 2 dni, jeszcze się nie liczy
      ],
      now,
      config.rules.offerSignCapDays,
    );
    expect(avg).toBe(4.33);
  });

  it("brak ofert = brak danych", () => {
    expect(averageOfferSignDays([], now, 7)).toBeNull();
  });

  it("komplet dokumentów w 24h", () => {
    const rate = documentsOnTimeRate(
      [
        { signedAt: d("2026-09-01T10:00:00Z"), documentsCompleteAt: d("2026-09-02T09:00:00Z") }, // 23h ✔
        { signedAt: d("2026-09-01T10:00:00Z"), documentsCompleteAt: d("2026-09-02T10:00:00Z") }, // 24h ✔
        { signedAt: d("2026-09-05T10:00:00Z"), documentsCompleteAt: d("2026-09-07T10:00:00Z") }, // 48h ✘
        { signedAt: d("2026-09-20T10:00:00Z"), documentsCompleteAt: null }, // termin minął ✘
        { signedAt: d("2026-09-30T08:00:00Z"), documentsCompleteAt: null }, // jeszcze trwa — pomijany
      ],
      now,
      config.rules.documentsDeadlineHours,
    );
    expect(rate).toBe(50);
  });

  it("opinie 5★", () => {
    expect(fiveStarReviewRate(20, 17)).toBe(85);
    expect(fiveStarReviewRate(0, 0)).toBeNull();
    expect(fiveStarReviewRate(5, 9)).toBe(100);
  });
});
