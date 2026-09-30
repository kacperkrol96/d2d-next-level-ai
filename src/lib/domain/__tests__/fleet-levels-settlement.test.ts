import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { fleetCost } from "../fleet";
import { auditorLevelFor, salesLevelFor } from "../levels";
import { computeSettlement, settlementPeriodFor } from "../settlement";

describe("flota", () => {
  it.each([
    [0, 1500],
    [1, 1500],
    [2, 750],
    [3, 750],
    [4, 0],
    [12, 0],
  ])("%d klientów w miesiącu → %d zł", (clients, cost) => {
    expect(fleetCost(clients, config.fleetBands).cost).toBe(cost);
  });

  it("pasek 0/4 i ile brakuje do tańszego progu", () => {
    const result = fleetCost(1, config.fleetBands);
    expect(result.freeFrom).toBe(4);
    expect(result.clientsToNextBand).toBe(1);
    expect(result.nextBandCost).toBe(750);
    expect(fleetCost(5, config.fleetBands).clientsToNextBand).toBe(0);
  });
});

describe("awanse handlowca", () => {
  it("poziom wg liczby klientów", () => {
    expect(salesLevelFor(0, config.salesLevels).current.level).toBe(1);
    expect(salesLevelFor(3, config.salesLevels).current.level).toBe(2);
    expect(salesLevelFor(9, config.salesLevels).current.level).toBe(3);
    expect(salesLevelFor(1000, config.salesLevels).current.level).toBe(10);
  });

  it("klienci do awansu i postęp", () => {
    const p = salesLevelFor(8, config.salesLevels);
    expect(p.current.level).toBe(3);
    expect(p.next?.level).toBe(4);
    expect(p.clientsMissing).toBe(2);
    expect(p.progress).toBeCloseTo(0.5);
  });

  it("brak minimum do utrzymania — poziom nie spada", () => {
    expect(salesLevelFor(2, config.salesLevels, 4).current.level).toBe(4);
  });

  it("maksymalny poziom", () => {
    const p = salesLevelFor(5000, config.salesLevels);
    expect(p.next).toBeNull();
    expect(p.progress).toBe(1);
  });
});

describe("awanse audytora", () => {
  it("do poziomu 4 liczą się tylko własni klienci", () => {
    expect(auditorLevelFor({ ownClients: 10, structureClients: 500, activePeople: 20 }, config.auditorLevels).current.level).toBe(3);
    expect(auditorLevelFor({ ownClients: 30, structureClients: 0, activePeople: 0 }, config.auditorLevels).current.level).toBe(4);
  });

  it("od poziomu 5: klienci struktury + aktywne osoby", () => {
    expect(auditorLevelFor({ ownClients: 30, structureClients: 20, activePeople: 1 }, config.auditorLevels).current.level).toBe(4);
    expect(auditorLevelFor({ ownClients: 30, structureClients: 20, activePeople: 2 }, config.auditorLevels).current.level).toBe(5);
    expect(auditorLevelFor({ ownClients: 40, structureClients: 70, activePeople: 4 }, config.auditorLevels).current.level).toBe(6);
  });

  it("brakujące osoby do awansu", () => {
    const p = auditorLevelFor({ ownClients: 40, structureClients: 70, activePeople: 3 }, config.auditorLevels);
    expect(p.current.level).toBe(5);
    expect(p.clientsMissing).toBe(0);
    expect(p.peopleMissing).toBe(1);
  });

  it("poziom zdobyty raz zostaje na zawsze", () => {
    expect(auditorLevelFor({ ownClients: 5, structureClients: 0, activePeople: 0, previousLevel: 6 }, config.auditorLevels).current.level).toBe(6);
  });
});

describe("rozliczenia co 2 tygodnie", () => {
  it("okres zawiera datę i ma 14 dni", () => {
    const p = settlementPeriodFor(new Date("2026-09-30T15:00:00Z"), config.rules.settlementAnchorDate, config.rules.settlementPeriodDays);
    expect(p.start.toISOString().slice(0, 10)).toBe("2026-09-28");
    expect(p.end.toISOString().slice(0, 10)).toBe("2026-10-12");
  });

  it("pierwszy dzień okresu należy do nowego okresu", () => {
    const a = settlementPeriodFor(new Date("2026-01-18T23:59:00Z"), "2026-01-05", 14);
    const b = settlementPeriodFor(new Date("2026-01-19T00:00:00Z"), "2026-01-05", 14);
    expect(b.index).toBe(a.index + 1);
  });

  it("wypłata = prowizja × KPI + dodatki − potrącenia − flota", () => {
    const s = computeSettlement({ commissions: 10_000, kpiMultiplier: 0.9, additions: 500, deductions: 1_000, fleetCost: 750 });
    expect(s.afterKpi).toBe(9_000);
    expect(s.payable).toBe(7_750);
    expect(s.carryOver).toBe(0);
  });

  it("korekta większa niż wypłata przechodzi na kolejny okres", () => {
    const s = computeSettlement({ commissions: 1_000, kpiMultiplier: 1, deductions: 3_000 });
    expect(s.payable).toBe(0);
    expect(s.carryOver).toBe(2_000);
  });
});
