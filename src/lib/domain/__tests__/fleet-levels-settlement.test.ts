import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { fleetCost } from "../fleet";
import { auditorLevelFor, levelTimeline, salesLevelFor, type ClientEvent } from "../levels";
import { computeSettlement, daysUntil, fleetDeductionForPeriod, previousPeriod, settlementPeriodFor } from "../settlement";

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
  const from = config.rules.salesStructureCountsFromLevel;
  const own = (ownClients: number, previousLevel?: number) => ({ ownClients, structureClients: 0, previousLevel });

  it("poziom wg liczby klientów", () => {
    expect(salesLevelFor(own(0), config.salesLevels, from).current.level).toBe(1);
    expect(salesLevelFor(own(3), config.salesLevels, from).current.level).toBe(2);
    expect(salesLevelFor(own(9), config.salesLevels, from).current.level).toBe(3);
    expect(salesLevelFor(own(1000), config.salesLevels, from).current.level).toBe(10);
  });

  it("klienci do awansu i postęp", () => {
    const p = salesLevelFor(own(8), config.salesLevels, from);
    expect(p.current.level).toBe(3);
    expect(p.next?.level).toBe(4);
    expect(p.clientsMissing).toBe(2);
    expect(p.progress).toBeCloseTo(0.5);
  });

  it("do poziomu 4 klienci zespołu się nie liczą", () => {
    const p = salesLevelFor({ ownClients: 8, structureClients: 200 }, config.salesLevels, from);
    expect(p.current.level).toBe(3);
    expect(p.clientsMissing).toBe(2);
  });

  it("od poziomu 5 liczą się klienci całego zespołu (jego + podległych)", () => {
    expect(salesLevelFor({ ownClients: 12, structureClients: 3 }, config.salesLevels, from).current.level).toBe(5);
    expect(salesLevelFor({ ownClients: 12, structureClients: 38 }, config.salesLevels, from).current.level).toBe(6);
    const p = salesLevelFor({ ownClients: 20, structureClients: 90 }, config.salesLevels, from);
    expect(p.current.level).toBe(6);
    expect(p.clientsMissing).toBe(15); // 125 − 110
  });

  it("próg „od którego poziomu” jest edytowalny", () => {
    // gdyby admin ustawił 3: od poziomu 3 wliczamy zespół
    expect(salesLevelFor({ ownClients: 4, structureClients: 2 }, config.salesLevels, 3).current.level).toBe(3);
    expect(salesLevelFor({ ownClients: 4, structureClients: 2 }, config.salesLevels, 5).current.level).toBe(2);
  });

  it("brak minimum do utrzymania — poziom nie spada", () => {
    expect(salesLevelFor(own(2, 4), config.salesLevels, from).current.level).toBe(4);
  });

  it("maksymalny poziom", () => {
    const p = salesLevelFor(own(5000), config.salesLevels, from);
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

describe("okresy rozliczeniowe 1–15 i 16–koniec miesiąca", () => {
  const P = (iso: string) => settlementPeriodFor(new Date(iso), config.settlementPeriods, config.timeZone);

  it("1–15: rozliczenie do 20., wypłata 25.", () => {
    expect(P("2026-10-01T10:00:00Z")).toEqual({ key: "2026-10/1", startDay: "2026-10-01", endDay: "2026-10-15", settleBy: "2026-10-20", payoutOn: "2026-10-25" });
    expect(P("2026-10-15T12:00:00Z").key).toBe("2026-10/1");
  });

  it("16–koniec: akceptacja do 5. następnego miesiąca, wypłata 10.", () => {
    expect(P("2026-10-16T08:00:00Z")).toEqual({ key: "2026-10/2", startDay: "2026-10-16", endDay: "2026-10-31", settleBy: "2026-11-05", payoutOn: "2026-11-10" });
    expect(P("2026-02-20T08:00:00Z").endDay).toBe("2026-02-28");
  });

  it("grudzień przechodzi na styczeń kolejnego roku", () => {
    expect(P("2026-12-20T08:00:00Z")).toMatchObject({ settleBy: "2027-01-05", payoutOn: "2027-01-10" });
  });

  it("granica liczona w czasie polskim (00:30 16-go w Polsce = 22:30 UTC 15-go)", () => {
    expect(P("2026-10-15T22:30:00Z").key).toBe("2026-10/2");
    expect(P("2026-10-15T21:30:00Z").key).toBe("2026-10/1");
  });

  it("poprzedni okres", () => {
    expect(previousPeriod(P("2026-10-03T10:00:00Z"), config.settlementPeriods, config.timeZone).key).toBe("2026-09/2");
    expect(previousPeriod(P("2026-10-20T10:00:00Z"), config.settlementPeriods, config.timeZone).key).toBe("2026-10/1");
  });

  it("odliczanie dni do terminu (Mennica)", () => {
    expect(daysUntil(new Date("2026-10-01T10:00:00Z"), "2026-10-20", config.timeZone)).toBe(19);
    expect(daysUntil(new Date("2026-10-21T10:00:00Z"), "2026-10-20", config.timeZone)).toBe(-1);
  });

  it("daty w ustawieniach admina — inne terminy działają bez zmian w kodzie", () => {
    const custom = [{ fromDay: 1, toDay: null, settleBy: { monthOffset: 1, day: 7 }, payoutOn: { monthOffset: 1, day: 12 } }];
    expect(settlementPeriodFor(new Date("2026-04-10T10:00:00Z"), custom, "Europe/Warsaw")).toMatchObject({ endDay: "2026-04-30", settleBy: "2026-05-07" });
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

describe("flota w rozliczeniu", () => {
  const period = (iso: string) => settlementPeriodFor(new Date(iso), config.settlementPeriods, config.timeZone);

  it("koszt auta za miesiąc potrącany w najbliższym rozliczeniu po jego końcu", () => {
    // okres 1–15.10 zawiera 1 października → potrącamy wrzesień
    const costs = [
      { month: "2026-08", cost: 1500 },
      { month: "2026-09", cost: 750 },
      { month: "2026-10", cost: 0 },
    ];
    expect(fleetDeductionForPeriod(period("2026-10-03T12:00:00Z"), costs)).toEqual({ total: 750, months: ["2026-09"] });
    // okres 16–31.10 nie zawiera 1. dnia miesiąca → brak potrącenia
    expect(fleetDeductionForPeriod(period("2026-10-20T12:00:00Z"), costs)).toEqual({ total: 0, months: [] });
  });

  it("„Flota” jest osobną pozycją rozliczenia", () => {
    const s = computeSettlement({ commissions: 10_000, kpiMultiplier: 1, fleetCost: 1500 });
    expect(s.lines.map((l) => l.label)).toEqual(["Prowizje", "Flota"]);
    expect(s.lines.find((l) => l.key === "fleet")?.amount).toBe(-1500);
    expect(s.payable).toBe(8500);
  });

  it("pozycje rozliczenia sumują się do kwoty do wypłaty", () => {
    const s = computeSettlement({ commissions: 10_000, kpiMultiplier: 0.9, additions: 500, deductions: 1_000, fleetCost: 750 });
    expect(s.lines.map((l) => l.key)).toEqual(["commissions", "kpi", "additions", "deductions", "fleet"]);
    expect(s.lines.reduce((sum, l) => sum + l.amount, 0)).toBe(s.payable);
  });
});

describe("poziom w chwili zazielenienia prowizji", () => {
  const from = config.rules.salesStructureCountsFromLevel;
  const levelFor = (own: number, structure: number) =>
    salesLevelFor({ ownClients: own, structureClients: structure }, config.salesLevels, from).current.level;
  const d = (day: number) => new Date(Date.UTC(2026, 8, day, 12));
  const own = (day: number, dropDay?: number): ClientEvent => ({ at: d(day), droppedAt: dropDay ? d(dropDay) : null, structure: false });

  it("stawka wg poziomu sprzed danego klienta (3. klient płatny jeszcze wg poziomu 1)", () => {
    const tl = levelTimeline([own(1), own(2), own(3), own(4)], levelFor);
    expect(tl(d(3))).toBe(1); // przed 3. klientem: 2 klientów
    expect(tl(d(4))).toBe(2); // po 3. kliencie: poziom 2
  });

  it("rezygnacja odejmuje klienta z licznika, ale zdobyty poziom zostaje", () => {
    const tl = levelTimeline([own(1), own(2), own(3, 5), own(10)], levelFor);
    expect(tl(d(4))).toBe(2);
    expect(tl(d(10))).toBe(2); // po rezygnacji 2 klientów, ale poziom 2 zostaje
  });

  it("od poziomu 5 liczą się klienci zespołu", () => {
    const events: ClientEvent[] = [
      ...Array.from({ length: 10 }, (_, i) => own(1 + i)),
      ...Array.from({ length: 5 }, (_, i) => ({ at: d(12 + i), structure: true })),
    ];
    const tl = levelTimeline(events, levelFor);
    expect(tl(d(12))).toBe(4);
    expect(tl(d(20))).toBe(5);
  });

  it("brak zdarzeń = poziom startowy", () => {
    expect(levelTimeline([], levelFor, 3)(d(1))).toBe(3);
  });
});

describe("„Dopłata do Duetu” w rozliczeniu", () => {
  it("osobna pozycja, objęta mnożnikiem KPI", () => {
    const s = computeSettlement({ commissions: 3000, duoTopUps: 2000, kpiMultiplier: 0.9 });
    expect(s.lines).toEqual([
      { key: "commissions", label: "Prowizje", amount: 3000 },
      { key: "duoTopUps", label: "Dopłaty do Duetu", amount: 2000 },
      { key: "kpi", label: "Mnożnik KPI 90%", amount: -500 },
    ]);
    expect(s.payable).toBe(4500);
  });
});
