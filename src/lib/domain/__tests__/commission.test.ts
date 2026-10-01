import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import {
  applyKpiMultiplier,
  auditorClientCommission,
  auditorDifferential,
  differential,
  isSamVat,
  salesClientCommission,
  salesScope,
  type SalesAgreementInput,
} from "../commission";

const sales = (level: number) => config.salesLevels.find((l) => l.level === level)!;
const auditor = (level: number) => config.auditorLevels.find((l) => l.level === level)!;

const earned = "sales_earned" as const;
const termo = (valueNet = 100_000, surchargeNet = 0, category: SalesAgreementInput["category"] = earned): SalesAgreementInput => ({ scope: "thermo", category, valueNet, surchargeNet });
const zrodlo = (valueNet = 30_000, surchargeNet = 0, category: SalesAgreementInput["category"] = earned): SalesAgreementInput => ({ scope: "heatSource", category, valueNet, surchargeNet });

describe("Solo / Duet — zakres umów u jednego klienta", () => {
  it("samo termo albo samo źródło ciepła = Solo", () => {
    expect(salesScope([termo()])).toBe("solo");
    expect(salesScope([zrodlo()])).toBe("solo");
  });

  it("termo + co najmniej jedno źródło ciepła = Duet", () => {
    expect(salesScope([termo(), zrodlo()])).toBe("duo");
    expect(salesScope([zrodlo(), termo(), zrodlo()])).toBe("duo");
  });

  it("dwa źródła ciepła bez termo to nadal Solo", () => {
    expect(salesScope([zrodlo(), zrodlo()])).toBe("solo");
  });

  it("REK nie wpływa na zakres", () => {
    expect(salesScope([termo(), { scope: "rek" }])).toBe("solo");
  });

  it("umowa w statusie negatywnym się nie liczy", () => {
    expect(salesScope([termo(), zrodlo(30_000, 0, "negative")])).toBe("solo");
  });
});

describe("„sam VAT” = najwyższy próg dochodowy i brak umowy REK", () => {
  const client = (incomeTier: "basic" | "elevated" | "highest", samVatFromOffer: boolean | null = null) => ({ incomeTier, samVatFromOffer });

  it("najwyższy próg bez REK → sam VAT", () => {
    expect(isSamVat(client("highest"), false, config)).toBe(true);
  });

  it("najwyższy próg z REK → pełna prowizja", () => {
    expect(isSamVat(client("highest"), true, config)).toBe(false);
  });

  it("inne progi → nigdy sam VAT z reguły", () => {
    expect(isSamVat(client("basic"), false, config)).toBe(false);
    expect(isSamVat(client("elevated"), false, config)).toBe(false);
  });

  it("oznaczenie z oferty (Konfigurator) ma pierwszeństwo", () => {
    expect(isSamVat(client("basic", true), false, config)).toBe(true);
    expect(isSamVat(client("highest", false), false, config)).toBe(false);
  });

  it("reguła wyłączona w panelu → tylko oznaczenie z oferty", () => {
    const off = { ...config, samVat: { ...config.samVat, enabled: false } };
    expect(isSamVat(client("highest"), false, off)).toBe(false);
  });
});

describe("prowizja handlowca", () => {
  it("stawka Solo i Duet wg poziomu, w całości dla handlowca", () => {
    expect(salesClientCommission({ agreements: [termo()], samVat: false }, sales(1), config)).toMatchObject({ scope: "solo", total: 3000 });
    expect(salesClientCommission({ agreements: [termo(), zrodlo()], samVat: false }, sales(1), config)).toMatchObject({ scope: "duo", total: 5000 });
    expect(salesClientCommission({ agreements: [termo()], samVat: false }, sales(10), config).total).toBe(8000);
    expect(salesClientCommission({ agreements: [termo(), zrodlo()], samVat: false }, sales(10), config).total).toBe(9500);
  });

  it("zielona, gdy którakolwiek aktywna umowa jest „prowizja handlowca zarobiona”", () => {
    expect(salesClientCommission({ agreements: [termo(100_000, 0, "in_progress")], samVat: false }, sales(1), config).state).toBe("grey");
    expect(salesClientCommission({ agreements: [termo(), zrodlo(30_000, 0, "in_progress")], samVat: false }, sales(1), config).state).toBe("green");
  });

  it("wszystkie umowy negatywne → anulowana; brak umów → brak prowizji", () => {
    expect(salesClientCommission({ agreements: [termo(100_000, 0, "negative")], samVat: false }, sales(1), config).state).toBe("cancelled");
    expect(salesClientCommission({ agreements: [], samVat: false }, sales(1), config).state).toBe("none");
  });

  it("sam VAT = −75% stawki podstawowej", () => {
    const result = salesClientCommission({ agreements: [zrodlo(20_000)], samVat: true }, sales(2), config);
    expect(result.base).toBe(875); // 3500 × 25%
  });

  it("nadmarża ograniczona do 10% wartości umów termo + źródło × udział wg poziomu", () => {
    const result = salesClientCommission({ agreements: [termo(50_000, 9_000)], samVat: false }, sales(5), config);
    expect(result.surchargeCapped).toBe(5000);
    expect(result.surchargePart).toBe(2500);
    expect(result.total).toBe(7500);
  });

  it("Duet: limit nadmarży z sumy obu umów", () => {
    const result = salesClientCommission({ agreements: [termo(80_000, 2_000), zrodlo(30_000, 1_000)], samVat: false }, sales(1), config);
    expect(result.base).toBe(5000);
    expect(result.surchargeCapped).toBe(3000);
    expect(result.surchargePart).toBe(900);
    expect(result.total).toBe(5900);
  });

  it("umowa negatywna nie wlicza się do limitu nadmarży", () => {
    const result = salesClientCommission({ agreements: [termo(50_000, 1_000), zrodlo(200_000, 30_000, "negative")], samVat: false }, sales(1), config);
    expect(result.surchargeCapped).toBe(1000);
  });

  it("ujemna nadmarża nie obniża prowizji", () => {
    const result = salesClientCommission({ agreements: [termo(50_000, -2_000)], samVat: false }, sales(1), config);
    expect(result.surchargePart).toBe(0);
    expect(result.total).toBe(3000);
  });

  it("zmiana stawek w konfiguracji zmienia wynik (brak liczb na sztywno)", () => {
    const custom = { ...config, rules: { ...config.rules, samVatReduction: 0.5 } };
    const result = salesClientCommission({ agreements: [termo()], samVat: true }, { ...sales(1), soloRate: 1000 }, custom);
    expect(result.base).toBe(500);
  });
});

describe("prowizja audytora", () => {
  it("stawka wg progu dochodowego i poziomu", () => {
    expect(auditorClientCommission({ auditCategory: "auditor_earned", salesClosed: false, incomeTier: "basic" }, auditor(1)).rate).toBe(600);
    expect(auditorClientCommission({ auditCategory: "auditor_earned", salesClosed: false, incomeTier: "elevated" }, auditor(1)).rate).toBe(800);
    expect(auditorClientCommission({ auditCategory: "auditor_earned", salesClosed: false, incomeTier: "highest" }, auditor(10)).rate).toBe(2325);
  });

  it("szara od „DOKUMENTACJA POMIAROWA”, zielona od „TWORZENIE OFERTY”, wcześniej brak", () => {
    const at = (auditCategory: "in_progress" | "auditor_grey" | "auditor_earned" | "negative") =>
      auditorClientCommission({ auditCategory, salesClosed: false, incomeTier: "basic" }, auditor(1)).state;
    expect(at("in_progress")).toBe("none");
    expect(at("auditor_grey")).toBe("grey");
    expect(at("auditor_earned")).toBe("green");
    expect(at("negative")).toBe("cancelled");
  });

  it("bonus za zamknięcie, gdy handlowiec zamknie klienta z audytu", () => {
    const open = auditorClientCommission({ auditCategory: "auditor_earned", salesClosed: false, incomeTier: "basic" }, auditor(3));
    expect(open).toMatchObject({ closingBonus: 0, potentialClosingBonus: 500, total: 750 });
    const closed = auditorClientCommission({ auditCategory: "auditor_earned", salesClosed: true, incomeTier: "basic" }, auditor(3));
    expect(closed).toMatchObject({ closingBonus: 500, total: 1250 });
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
});
