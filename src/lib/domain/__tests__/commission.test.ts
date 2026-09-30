import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import {
  applyKpiMultiplier,
  auditorClientCommission,
  auditorDifferential,
  differential,
  salesClientCommission,
  type SalesClientInput,
} from "../commission";

const sales = (level: number) => config.salesLevels.find((l) => l.level === level)!;
const auditor = (level: number) => config.auditorLevels.find((l) => l.level === level)!;

const client = (overrides: Partial<SalesClientInput> = {}): SalesClientInput => ({
  status: "Wysłanie wniosku do WFOŚ",
  mode: "solo",
  agreements: [{ valueNet: 100_000, surchargeNet: 0, samVat: false }],
  ...overrides,
});

describe("prowizja handlowca", () => {
  it("solo i duet wg poziomu", () => {
    expect(salesClientCommission(client(), sales(1), config).total).toBe(3000);
    expect(salesClientCommission(client({ mode: "duo" }), sales(1), config).total).toBe(5000);
    expect(salesClientCommission(client(), sales(10), config).total).toBe(8000);
    expect(salesClientCommission(client({ mode: "duo" }), sales(10), config).total).toBe(9500);
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
    const result = salesClientCommission(client({ agreements: [{ valueNet: 20_000, surchargeNet: 0, samVat: true }] }), sales(2), config);
    expect(result.samVat).toBe(true);
    expect(result.base).toBe(875); // 3500 × 25%
  });

  it("jeden klient z dwiema umowami (termo + kocioł) = jedna prowizja", () => {
    const result = salesClientCommission(
      client({
        agreements: [
          { valueNet: 80_000, surchargeNet: 2_000, samVat: false },
          { valueNet: 30_000, surchargeNet: 1_000, samVat: true },
        ],
      }),
      sales(1),
      config,
    );
    expect(result.base).toBe(3000); // nie 2 × 3000; nie „sam VAT”, bo tylko jedna umowa jest sam VAT
    expect(result.surchargeCapped).toBe(3000);
    expect(result.surchargePart).toBe(900); // 30% z 3000
    expect(result.total).toBe(3900);
  });

  it("nadmarża ograniczona do 10% wartości umowy netto × udział wg poziomu", () => {
    const result = salesClientCommission(client({ agreements: [{ valueNet: 50_000, surchargeNet: 9_000, samVat: false }] }), sales(5), config);
    expect(result.surchargeCapped).toBe(5000); // limit 10% z 50 000
    expect(result.surchargePart).toBe(2500); // 50%
    expect(result.total).toBe(7500);
  });

  it("ujemna nadmarża nie obniża prowizji", () => {
    const result = salesClientCommission(client({ agreements: [{ valueNet: 50_000, surchargeNet: -2_000, samVat: false }] }), sales(1), config);
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
    const result = salesClientCommission(client({ agreements: [{ valueNet: 1, surchargeNet: 0, samVat: true }] }), level, custom);
    expect(result.base).toBe(500);
  });
});
