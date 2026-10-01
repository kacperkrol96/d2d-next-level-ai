import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { activePlan, nextSafetyTier, safetyPay, validatePlanChange, type PlanChange } from "../safety";
import { checkRedCard, yellowCard, type DisciplineEvent } from "../cards";
import { dailyGoals, dayClosedInTime, recordingShare, upcomingBriefings } from "../rhythm";
import { areaAssignmentCheck, leadMissingFields, type LeadDraft } from "../field";

const tz = config.timeZone;
const b2b = { contractType: "B2B" as const, hoursWorked: 0, kpiMultiplier: 1 };

describe("Safety — wypłata audytora wg pomiarów w miesiącu", () => {
  it("progi i stawki za pomiary ponad próg", () => {
    expect(safetyPay(0, config.safety, b2b).total).toBe(0);
    expect(safetyPay(4, config.safety, b2b).total).toBe(0);
    expect(safetyPay(5, config.safety, b2b).total).toBe(3750);
    expect(safetyPay(7, config.safety, b2b).total).toBe(4150);
    expect(safetyPay(9, config.safety, b2b).total).toBe(4550);
    expect(safetyPay(10, config.safety, b2b).total).toBe(7000);
    expect(safetyPay(12, config.safety, b2b).total).toBe(7500);
    expect(safetyPay(15, config.safety, b2b).total).toBe(10000);
    expect(safetyPay(17, config.safety, b2b).total).toBe(10600);
  });

  it("umowa zlecenia: nie mniej niż stawka minimalna × godziny z aplikacji", () => {
    const r = safetyPay(3, config.safety, { contractType: "Umowa zlecenia", hoursWorked: 100, kpiMultiplier: 1 });
    expect(r.tierPay).toBe(0);
    expect(r.hourlyMinimum).toBe(3050);
    expect(r.total).toBe(3050);
    expect(safetyPay(3, config.safety, { ...b2b, hoursWorked: 100 }).total).toBe(0);
  });

  it("mnożnik KPI na całą wypłatę Safety (ustawienie, domyślnie włączone)", () => {
    expect(safetyPay(10, config.safety, { ...b2b, kpiMultiplier: 0.75 }).total).toBe(5250);
    expect(safetyPay(10, { ...config.safety, applyKpiMultiplier: false }, { ...b2b, kpiMultiplier: 0.75 }).total).toBe(7000);
  });

  it("pasek do kolejnego progu", () => {
    expect(nextSafetyTier(8, config.safety)).toEqual({ missing: 2, base: 7000 });
    expect(nextSafetyTier(0, config.safety)).toEqual({ missing: 5, base: 3750 });
    expect(nextSafetyTier(15, config.safety)).toBeNull();
  });

  it("aktywny system wg historii zmian", () => {
    const history: PlanChange[] = [
      { plan: "nextLevel", from: "2026-08-01T00:00:00Z", by: "m", reason: "Awans" },
      { plan: "safety", from: "2026-09-10T00:00:00Z", by: "m", reason: "Choroba", temporary: true },
      { plan: "nextLevel", from: "2026-09-30T00:00:00Z", by: "m", reason: "Powrót" },
    ];
    expect(activePlan(history, new Date("2026-07-01T00:00:00Z"))).toBe("safety");
    expect(activePlan(history, new Date("2026-08-15T00:00:00Z"))).toBe("nextLevel");
    expect(activePlan(history, new Date("2026-09-15T00:00:00Z"))).toBe("safety");
    expect(activePlan(history, new Date("2026-10-01T00:00:00Z"))).toBe("nextLevel");
  });

  it("zmiana: Safety → Next Level tak; powrót na Safety tylko czasowo, zawsze z powodem", () => {
    expect(validatePlanChange("safety", { plan: "nextLevel", by: "m", reason: "Gotowy" })).toBeNull();
    expect(validatePlanChange("nextLevel", { plan: "safety", by: "m", reason: "Chcę" })).toMatch(/czasowo/);
    expect(validatePlanChange("nextLevel", { plan: "safety", by: "m", reason: "Wypadek", temporary: true })).toBeNull();
    expect(validatePlanChange("safety", { plan: "nextLevel", by: "m", reason: " " })).toMatch(/powód/);
    expect(validatePlanChange("safety", { plan: "safety", by: "m", reason: "x" })).toMatch(/aktywny/);
  });
});

describe("kartki", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const y = (reason: Parameters<typeof yellowCard>[0], at: string) => yellowCard(reason, "manager", new Date(at));

  it("2 żółte kartki = czerwona", () => {
    const events: DisciplineEvent[] = [y("no_gops", "2026-09-01T10:00:00Z")];
    expect(checkRedCard(events, config.cards, now).red).toBe(false);
    const r = checkRedCard([...events, y("client_pressure", "2026-09-20T10:00:00Z")], config.cards, now);
    expect(r).toMatchObject({ red: true, trigger: "yellowCards" });
  });

  it("3 spóźnienia albo 2 nieobecności = czerwona; spóźnienie z kartką liczone raz", () => {
    const late = (at: string): DisciplineEvent => ({ kind: "late", at, by: "m" });
    const lates = [late("2026-09-01T08:00:00Z"), late("2026-09-02T08:00:00Z"), late("2026-09-03T08:00:00Z")];
    expect(checkRedCard(lates, config.cards, now)).toMatchObject({ red: true, trigger: "lateness" });
    expect(checkRedCard(lates.slice(0, 2), config.cards, now).red).toBe(false);
    // jedno spóźnienie zapisane i jako zdarzenie, i jako żółta kartka → nadal 1 spóźnienie
    expect(checkRedCard([late("2026-09-01T08:00:00Z"), y("late", "2026-09-01T08:05:00Z")], config.cards, now).counts.lateness).toBe(1);
    const abs = (at: string): DisciplineEvent => ({ kind: "absence", at, by: "m" });
    expect(checkRedCard([abs("2026-09-01T08:00:00Z"), abs("2026-09-05T08:00:00Z")], config.cards, now)).toMatchObject({ red: true, trigger: "absences" });
  });

  it("zdarzenia spoza okna (dni w ustawieniach) się nie liczą", () => {
    const events = [y("no_gops", "2026-05-01T10:00:00Z"), y("no_gops", "2026-09-20T10:00:00Z")];
    expect(checkRedCard(events, config.cards, now).red).toBe(false);
    expect(checkRedCard(events, { ...config.cards, red: { ...config.cards.red, windowDays: 365 } }, now).red).toBe(true);
  });

  it("automatycznie tylko „brak raportu” i „KPI < 30”; ręcznie zawsze z osobą", () => {
    expect(yellowCard("kpi_below_minimum", "system", now, { automatic: true })).toMatchObject({ automatic: true });
    expect(yellowCard("no_report", "system", now, { automatic: true }).kind).toBe("yellow");
    expect(() => yellowCard("client_pressure", "system", now, { automatic: true })).toThrow();
    expect(() => yellowCard("late", "", now)).toThrow();
  });
});

describe("rytm pracy", () => {
  // 2026-10-05 = poniedziałek
  const day = (d: number) => new Date(`2026-10-${String(d).padStart(2, "0")}T10:00:00Z`);

  it("audytor: pon/śr/pt umawianie 12 leadów, wt/czw/sob 6 spotkań, niedziela wolna", () => {
    expect(dailyGoals("auditor", day(5), config.rhythm, tz)).toMatchObject({ dayType: "booking", goals: [{ target: 12 }] });
    expect(dailyGoals("auditor", day(7), config.rhythm, tz).dayType).toBe("booking");
    const tue = dailyGoals("auditor", day(6), config.rhythm, tz);
    expect(tue.dayType).toBe("meetings");
    expect(tue.goals.map((g) => g.target)).toEqual([6, 2, 1]);
    expect(dailyGoals("auditor", day(10), config.rhythm, tz).dayType).toBe("meetings");
    expect(dailyGoals("auditor", day(11), config.rhythm, tz).dayType).toBe("off");
  });

  it("handlowiec bez stałego rytmu", () => {
    expect(dailyGoals("sales", day(5), config.rhythm, tz).dayType).toBe("sales");
  });

  it("odprawy: pon/śr/pt 8:30 + poniedziałek 8:00 w biurze", () => {
    const list = upcomingBriefings(day(5), 7, config.rhythm, tz);
    expect(list.map((b) => `${b.day} ${b.time}`)).toEqual([
      "2026-10-05 08:00",
      "2026-10-05 08:30",
      "2026-10-07 08:30",
      "2026-10-09 08:30",
    ]);
  });

  it("„Zamknij dzień” do 21:00 czasu polskiego tego samego dnia", () => {
    // październik: UTC+2
    expect(dayClosedInTime("2026-10-05", new Date("2026-10-05T18:59:00Z"), config.rhythm, tz)).toBe(true);
    expect(dayClosedInTime("2026-10-05", new Date("2026-10-05T19:00:00Z"), config.rhythm, tz)).toBe(true);
    expect(dayClosedInTime("2026-10-05", new Date("2026-10-05T19:01:00Z"), config.rhythm, tz)).toBe(false);
    expect(dayClosedInTime("2026-10-05", new Date("2026-10-06T07:00:00Z"), config.rhythm, tz)).toBe(false);
    expect(dayClosedInTime("2026-10-05", null, config.rhythm, tz)).toBe(false);
  });

  it("nagrania: minimum 20% odbytych spotkań", () => {
    expect(recordingShare(4, 18, "auditor", config.rhythm)).toMatchObject({ ok: true, missing: 0 });
    expect(recordingShare(2, 18, "auditor", config.rhythm)).toMatchObject({ ok: false, missing: 2 });
    expect(recordingShare(0, 0, "sales", config.rhythm).ok).toBe(true);
  });
});

describe("teren i leady", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  const ago = (days: number) => new Date(now.getTime() - days * 86400000);

  it("ten sam rejon raz na 30 dni — ostrzeżenie albo blokada", () => {
    expect(areaAssignmentCheck(null, now, config.field).status).toBe("ok");
    expect(areaAssignmentCheck(ago(31), now, config.field).status).toBe("ok");
    expect(areaAssignmentCheck(ago(10), now, config.field)).toEqual({ status: "warning", daysLeft: 20 });
    expect(areaAssignmentCheck(ago(10), now, { ...config.field, areaCooldownMode: "block" }).status).toBe("blocked");
  });

  it("lead bez podpisu RODO i potwierdzenia jest niekompletny", () => {
    const lead: LeadDraft = { name: "Jan K.", phone: "500100200", email: null, address: "Lipowa 1", rodoSignature: null, confirmationChannel: null };
    expect(leadMissingFields(lead)).toEqual(["podpis zgody RODO", "potwierdzenie dla klienta (SMS lub e-mail)"]);
    expect(leadMissingFields({ ...lead, rodoSignature: "data:image/png;base64,x", confirmationChannel: "sms" })).toEqual([]);
    expect(leadMissingFields({ ...lead, rodoSignature: "x", confirmationChannel: "email" })).toEqual(["e-mail do potwierdzenia"]);
  });
});
