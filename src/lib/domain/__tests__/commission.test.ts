import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import {
  applyKpiMultiplier,
  auditorClientCommission,
  auditorDifferential,
  differential,
  salesClientCommission,
  salesScope,
  type SalesClientInput,
} from "../commission";

const sales = (level: number) => config.salesLevels.find((l) => l.level === level)!;
const auditor = (level: number) => config.auditorLevels.find((l) => l.level === level)!;

const termo = (valueNet = 100_000, surchargeNet = 0, samVat = false) => ({ kind: "Termomodernizacja", valueNet, surchargeNet, samVat });
const kociol = (valueNet = 30_000, surchargeNet = 0, samVat = false) => ({ kind: "Kocioł", valueNet, surchargeNet, samVat });
const pompa = (valueNet = 40_000, surchargeNet = 0, samVat = false) => ({ kind: "Pompa ciepła", valueNet, surchargeNet, samVat });

const client = (overrides: Partial<SalesClientInput> = {}): SalesClientInput => ({
  status: "Wysłanie wniosku do WFOŚ",
  agreements: [termo()],
  ...overrides,
});

describe("Solo / Duet — zakres umów u jednego klienta", () => {
  const cat = config.agreementCategories;

  it("samo termo albo samo źródło ciepła = Solo", () => {
    expect(salesScope([termo()], cat)).toBe("solo");
    expect(salesScope([kociol()], cat)).toBe("solo");
    expect(salesScope([pompa()], cat)).toBe("solo");
  });

  it("termo + źródło ciepła („prace po korek”) = Duet", () => {
    expect(salesScope([termo(), kociol()], cat)).toBe("duo");
    expect(salesScope([pompa(), termo()], cat)).toBe("duo");
  });

  it("dwie umowy z tej samej kategorii to nadal Solo", () => {
    expect(salesScope([termo(), termo()], cat)).toBe("solo");
    expect(salesScope([kociol(), pompa()], cat)).toBe("solo");
  });

  it("umowy spoza kategorii nie zmieniają zakresu", () => {
    expect(salesScope([termo(), { kind: "Fotowoltaika" }], cat)).toBe("solo");
  });

  it("kategorie pochodzą z konfiguracji (edytowalne przez admina)", () => {
    const custom = { thermo: ["Docieplenie"], heatSource: ["Kocioł"] };
    expect(salesScope([{ kind: "Docieplenie" }, kociol()], custom)).toBe("duo");
  });
});

describe("prowizja handlowca", () => {
  it("stawka Solo i Duet wg poziomu, w całości dla handlowca", () => {
    expect(salesClientCommission(client(), sales(1), config)).toMatchObject({ scope: "solo", total: 3000 });
    expect(salesClientCommission(client({ agreements: [termo(), kociol()] }), sales(1), config)).toMatchObject({ scope: "duo", total: 5000 });
    expect(salesClientCommission(client(), sales(10), config).total).toBe(8000);
    expect(salesClientCommission(client({ agreements: [termo(), pompa()] }), sales(10), config).total).toBe(9500);
  });

  it("jeden klient z termo + kocioł = JEDNA prowizja Duet (nie 2 × Solo)", () => {
    const result = salesClientCommission(client({ agreements: [termo(80_000, 2_000), kociol(30_000, 1_000)] }), sales(1), config);
    expect(result.base).toBe(5000);
    expect(result.surchargeCapped).toBe(3000);
    expect(result.surchargePart).toBe(900); // 30% z 3000
    expect(result.total).toBe(5900);
  });

  it("zielona od statusu „wysłanie wniosku do WFOŚ” i dalej", () => {
    expect(salesClientCommission(client({ status: "Komplet dokumentów" }), sales(1), config).state).toBe("grey");
    expect(salesClientCommission(client({ status: "Umowa podpisana" }), sales(1), config).state).toBe("grey");
    expect(salesClientCommission(client({ status: "Wysłanie wniosku do WFOŚ" }), sales(1), config).state).toBe("green");
    expect(salesClientCommission(client({ status: "Zakończona" }), sales(1), config).state).toBe("green");
  });

  it("rezygnacja = anulowana, nieznany status = szara", () => {
    expect(salesClientCommission(client({ status: "Rezygnacja" }), sales(1), config).state).toBe("cancelled");
    expect(salesClientCommission(client({ status: "Coś nowego w CRM" }), sales(1), config).state).toBe("grey");
  });

  it("umowa „sam VAT” = −75%", () => {
    const result = salesClientCommission(client({ agreements: [kociol(20_000, 0, true)] }), sales(2), config);
    expect(result.samVat).toBe(true);
    expect(result.base).toBe(875); // 3500 × 25%
  });

  it("Duet, w którym tylko jedna umowa jest „sam VAT” — bez obniżki (założenie nr 3, do decyzji)", () => {
    const result = salesClientCommission(client({ agreements: [termo(), kociol(30_000, 0, true)] }), sales(1), config);
    expect(result.samVat).toBe(false);
    expect(result.base).toBe(5000);
  });

  it("nadmarża ograniczona do 10% wartości umowy netto × udział wg poziomu", () => {
    const result = salesClientCommission(client({ agreements: [termo(50_000, 9_000)] }), sales(5), config);
    expect(result.surchargeCapped).toBe(5000); // limit 10% z 50 000
    expect(result.surchargePart).toBe(2500); // 50%
    expect(result.total).toBe(7500);
  });

  it("ujemna nadmarża nie obniża prowizji", () => {
    const result = salesClientCommission(client({ agreements: [termo(50_000, -2_000)] }), sales(1), config);
    expect(result.surchargePart).toBe(0);
    expect(result.total).toBe(3000);
  });
});

describe("prowizja audytora", () => {
  it("stawka wg progu dochodowego i poziomu", () => {
    const base = { auditStatus: "Po pomiarach", salesStatus: "Nowy klient" } as const;
    expect(auditorClientCommission({ ...base, incomeTier: "basic" }, auditor(1), config).rate).toBe(600);
    expect(auditorClientCommission({ ...base, incomeTier: "elevated" }, auditor(1), config).rate).toBe(800);
    expect(auditorClientCommission({ ...base, incomeTier: "highest" }, auditor(10), config).rate).toBe(2325);
  });

  it("zielona od statusu „po pomiarach”", () => {
    const input = { salesStatus: "Nowy klient", incomeTier: "basic" as const };
    expect(auditorClientCommission({ ...input, auditStatus: "W trakcie pomiarów" }, auditor(1), config).state).toBe("grey");
    expect(auditorClientCommission({ ...input, auditStatus: "Po pomiarach" }, auditor(1), config).state).toBe("green");
    expect(auditorClientCommission({ ...input, auditStatus: "Zakończony" }, auditor(1), config).state).toBe("green");
  });

  it("bonus za zamknięcie, gdy handlowiec zamknie klienta z audytu", () => {
    const open = auditorClientCommission({ auditStatus: "Po pomiarach", salesStatus: "Umowa podpisana", incomeTier: "basic" }, auditor(3), config);
    expect(open.closingBonus).toBe(0);
    expect(open.potentialClosingBonus).toBe(500);
    expect(open.total).toBe(750);

    const closed = auditorClientCommission({ auditStatus: "Po pomiarach", salesStatus: "Wysłanie wniosku do WFOŚ", incomeTier: "basic" }, auditor(3), config);
    expect(closed.closingBonus).toBe(500);
    expect(closed.total).toBe(1250);
  });

  it("brak bonusu przy rezygnacji po stronie sprzedaży; anulowany audyt = 0", () => {
    const resigned = auditorClientCommission({ auditStatus: "Po pomiarach", salesStatus: "Rezygnacja", incomeTier: "basic" }, auditor(1), config);
    expect(resigned.closingBonus).toBe(0);
    expect(resigned.state).toBe("green");
    const cancelled = auditorClientCommission({ auditStatus: "Rezygnacja", salesStatus: "Nowy klient", incomeTier: "basic" }, auditor(1), config);
    expect(cancelled).toMatchObject({ state: "cancelled", total: 0 });
  });
});

describe("dyferencja managera i mnożnik KPI", () => {
  it("dyferencja = różnica stawek, nigdy ujemna", () => {
    expect(auditorDifferential(auditor(6), auditor(2), "basic")).toBe(300);
    expect(auditorDifferential(auditor(2), auditor(6), "basic")).toBe(0);
    expect(differential(6000, 4500)).toBe(1500);
  });

  it("wypłata = prowizja × mnożnik KPI", () => {
    expect(applyKpiMultiplier(10_000, 1.1)).toBe(11_000);
    expect(applyKpiMultiplier(3_333, 0.9)).toBe(2999.7);
  });

  it("zmiana stawki w konfiguracji zmienia wynik (brak liczb na sztywno)", () => {
    const custom = { ...config, rules: { ...config.rules, samVatReduction: 0.5 } };
    const level = { ...sales(1), soloRate: 1000 };
    const result = salesClientCommission(client({ agreements: [termo(1, 0, true)] }), level, custom);
    expect(result.base).toBe(500);
  });
});
