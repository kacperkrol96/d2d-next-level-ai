import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import {
  applyKpiMultiplier,
  auditorClientCommission,
  auditorDifferential,
  commissionAmount,
  differential,
  isSamVat,
  salesClientCommission,
  salesClientPayments,
  salesScope,
  type PaymentAgreement,
  type SalesAgreementInput,
} from "../commission";
import { computeSettlement } from "../settlement";

const sales = (level: number) => config.salesLevels.find((l) => l.level === level)!;
const auditor = (level: number) => config.auditorLevels.find((l) => l.level === level)!;

const earned = "sales_earned" as const;
const termo = (valueNet = 100_000, category: SalesAgreementInput["category"] = earned): SalesAgreementInput => ({ scope: "thermo", category, valueNet });
const zrodlo = (valueNet = 30_000, category: SalesAgreementInput["category"] = earned): SalesAgreementInput => ({ scope: "heatSource", category, valueNet });
const input = (agreements: SalesAgreementInput[], surchargeNet: number | null = 0, samVat = false) => ({ agreements, samVat, surchargeNet });

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
    expect(salesScope([termo(), zrodlo(30_000, "negative")])).toBe("solo");
  });
});

describe("„sam VAT” = najwyższy próg dochodowy i brak umowy REK", () => {
  const client = (incomeTier: "basic" | "elevated" | "highest" | null, samVatFromOffer: boolean | null = null) => ({ incomeTier, samVatFromOffer });

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
    expect(isSamVat(client(null, true), false, config)).toBe(true);
  });

  it("brak progu przy włączonej regule → nie wiadomo (do wyjaśnienia)", () => {
    expect(isSamVat(client(null), false, config)).toBeNull();
  });

  it("reguła wyłączona w panelu → tylko oznaczenie z oferty", () => {
    const off = { ...config, samVat: { ...config.samVat, enabled: false } };
    expect(isSamVat(client("highest"), false, off)).toBe(false);
    expect(isSamVat(client(null), false, off)).toBe(false);
  });
});

describe("prowizja handlowca (pełny zakres)", () => {
  it("stawka Solo i Duet wg poziomu, w całości dla handlowca", () => {
    expect(salesClientCommission(input([termo()]), sales(1), config)).toMatchObject({ scope: "solo", total: 3000 });
    expect(salesClientCommission(input([termo(), zrodlo()]), sales(1), config)).toMatchObject({ scope: "duo", total: 5000 });
    expect(salesClientCommission(input([termo()]), sales(10), config).total).toBe(8000);
    expect(salesClientCommission(input([termo(), zrodlo()]), sales(10), config).total).toBe(9500);
  });

  it("zielona, gdy którakolwiek aktywna umowa jest „prowizja handlowca zarobiona”", () => {
    expect(salesClientCommission(input([termo(100_000, "in_progress")]), sales(1), config).state).toBe("grey");
    expect(salesClientCommission(input([termo(), zrodlo(30_000, "in_progress")]), sales(1), config).state).toBe("green");
  });

  it("wszystkie umowy negatywne → anulowana; brak umów → brak prowizji", () => {
    expect(salesClientCommission(input([termo(100_000, "negative")]), sales(1), config).state).toBe("cancelled");
    expect(salesClientCommission(input([]), sales(1), config).state).toBe("none");
  });

  it("sam VAT = −75% stawki podstawowej", () => {
    expect(salesClientCommission(input([zrodlo(20_000)], 0, true), sales(2), config).base).toBe(875);
  });

  it("nadmarża klienta ograniczona do 10% wartości umów termo + źródło × udział wg poziomu", () => {
    const result = salesClientCommission(input([termo(50_000)], 9_000), sales(5), config);
    expect(result).toMatchObject({ surchargeCapped: 5000, surchargePart: 2500, total: 7500 });
  });

  it("umowa negatywna nie wlicza się do limitu nadmarży", () => {
    expect(salesClientCommission(input([termo(50_000), zrodlo(200_000, "negative")], 30_000), sales(1), config).surchargeCapped).toBe(5000);
  });

  it("brak nadmarży albo ujemna nadmarża = 0", () => {
    expect(salesClientCommission(input([termo(50_000)], null), sales(1), config).total).toBe(3000);
    expect(salesClientCommission(input([termo(50_000)], -2_000), sales(1), config).total).toBe(3000);
  });

  it("zmiana stawek w konfiguracji zmienia wynik (brak liczb na sztywno)", () => {
    const custom = { ...config, rules: { ...config.rules, samVatReduction: 0.5 } };
    expect(salesClientCommission(input([termo()], 0, true), { ...sales(1), soloRate: 1000 }, custom).base).toBe(500);
  });
});

describe("płatności: Solo od razu + „Dopłata do Duetu”", () => {
  const day = (d: number) => new Date(Date.UTC(2026, 9, d, 12));
  const pa = (scope: "thermo" | "heatSource", category: PaymentAgreement["category"], greenAt: Date | null, droppedAt: Date | null = null, valueNet = 100_000): PaymentAgreement => ({
    scope, category, valueNet, greenAt, droppedAt,
  });
  const pay = (agreements: PaymentAgreement[], surchargeNet: number | null = 0) => salesClientPayments({ agreements, samVat: false, surchargeNet }, sales(1), config);

  it("zielone termo, źródło w toku → Solo zielone od razu + szara dopłata (różnica)", () => {
    const p = pay([pa("thermo", earned, day(2)), pa("heatSource", "in_progress", null)]);
    expect(p).toEqual([
      { kind: "base", state: "green", amount: 3000, greenAt: day(2), droppedAt: null },
      { kind: "duoTopUp", state: "grey", amount: 2000, greenAt: null, droppedAt: null },
    ]);
  });

  it("zazieleni się druga umowa → dopłata do Duetu zielona od tej chwili", () => {
    const p = pay([pa("thermo", earned, day(2)), pa("heatSource", earned, day(9))]);
    expect(p[1]).toEqual({ kind: "duoTopUp", state: "green", amount: 2000, greenAt: day(9), droppedAt: null });
    expect(p[0].amount + p[1].amount).toBe(5000);
  });

  it("obie zielone naraz → Solo + dopłata = stawka Duet", () => {
    const p = pay([pa("thermo", earned, day(3)), pa("heatSource", earned, day(3))]);
    expect(p.map((x) => [x.kind, x.state, x.amount])).toEqual([["base", "green", 3000], ["duoTopUp", "green", 2000]]);
  });

  it("nadmarża: Solo liczy limit od pierwszej umowy, dopłata dolicza resztę", () => {
    const p = pay([pa("thermo", earned, day(2), null, 50_000), pa("heatSource", earned, day(5), null, 30_000)], 7_000);
    // Solo: 3000 + 30% × min(7000, 5000) = 4500; Duet: 5000 + 30% × min(7000, 8000) = 7100 → dopłata 2600
    expect(p.map((x) => x.amount)).toEqual([4500, 2600]);
  });

  it("samo termo (bez źródła) → tylko Solo, bez dopłaty", () => {
    expect(pay([pa("thermo", earned, day(2))])).toHaveLength(1);
  });

  it("nic jeszcze zielone, Duet w grze → szare Solo + szara dopłata", () => {
    const p = pay([pa("thermo", "in_progress", null), pa("heatSource", "in_progress", null)]);
    expect(p.map((x) => [x.kind, x.state, x.amount])).toEqual([["base", "grey", 3000], ["duoTopUp", "grey", 2000]]);
  });

  it("źródło ciepła spadło w status negatywny przed zazielenieniem → brak dopłaty", () => {
    const p = pay([pa("thermo", earned, day(2)), pa("heatSource", "negative", null)]);
    expect(p).toHaveLength(1);
  });

  it("utrata źródła po wypłacie dopłaty → potrącenie samej dopłaty", () => {
    const p = pay([pa("thermo", earned, day(2)), pa("heatSource", "negative", day(5), day(20))]);
    expect(p).toEqual([
      { kind: "base", state: "green", amount: 3000, greenAt: day(2), droppedAt: null },
      { kind: "duoTopUp", state: "clawback", amount: -2000, greenAt: day(5), droppedAt: day(20) },
    ]);
  });

  it("utrata wszystkich umów po wypłacie → potrącenie Solo i dopłaty", () => {
    const p = pay([pa("thermo", "negative", day(2), day(20)), pa("heatSource", "negative", day(5), day(21))]);
    expect(p.map((x) => [x.kind, x.state, x.amount])).toEqual([["base", "clawback", -3000], ["duoTopUp", "clawback", -2000]]);
    expect(p[0].droppedAt).toEqual(day(21));
  });

  it("wszystko negatywne, nic nie było zielone → anulowana bez potrącenia", () => {
    expect(pay([pa("thermo", "negative", null)])).toEqual([{ kind: "base", state: "cancelled", amount: 0, greenAt: null, droppedAt: null }]);
  });
});

describe("„Dopłata nadmarży” — nadmarża uzupełniona po wypłacie", () => {
  const d = (day: number) => new Date(Date.UTC(2026, 8, day, 12));
  const pa = (category: PaymentAgreement["category"], greenAt: Date | null, droppedAt: Date | null = null): PaymentAgreement => ({
    scope: "thermo",
    category,
    valueNet: 100_000,
    greenAt,
    droppedAt,
  });
  const lvl = sales(1);
  const plain = commissionAmount("solo", [100_000], false, null, lvl, config).total;
  const full = commissionAmount("solo", [100_000], false, 5_000, lvl, config).total;
  const run = (agreements: PaymentAgreement[], setAt: Date | null) =>
    salesClientPayments({ agreements, samVat: false, surchargeNet: 5_000, surchargeSetAt: setAt }, lvl, config);

  it("wpis przed zazielenieniem — jedna płatność z nadmarżą", () => {
    expect(run([pa(earned, d(10))], d(5))).toEqual([expect.objectContaining({ kind: "base", amount: full })]);
    expect(run([pa(earned, d(10))], null)).toHaveLength(1);
  });

  it("wpis po zazieleniu — prowizja bez nadmarży + osobna „Dopłata nadmarży” od chwili wpisu", () => {
    const r = run([pa(earned, d(10))], d(20));
    expect(full).toBeGreaterThan(plain);
    expect(r).toEqual([
      expect.objectContaining({ kind: "base", state: "green", amount: plain }),
      expect.objectContaining({ kind: "surchargeTopUp", state: "green", amount: full - plain, greenAt: d(20) }),
    ]);
  });

  it("szara prowizja — nadmarża od razu w kwocie, bez dopłaty", () => {
    const r = run([pa("in_progress", null)], d(20));
    expect(r).toEqual([expect.objectContaining({ kind: "base", state: "grey", amount: full })]);
  });

  it("potrącenie zwraca to, co faktycznie wypłacono", () => {
    // spadek po wpisie nadmarży: wypłacono prowizję + dopłatę → potrącenie pełnej kwoty
    const after = run([pa("negative", d(10), d(25))], d(20));
    expect(after).toEqual([
      expect.objectContaining({ kind: "base", state: "clawback", amount: -full }),
      expect.objectContaining({ kind: "surchargeTopUp", state: "green", amount: full - plain }),
    ]);
    // spadek przed wpisem: dopłaty nie było → potrącenie bez nadmarży
    expect(run([pa("negative", d(10), d(15))], d(20))).toEqual([expect.objectContaining({ kind: "base", state: "clawback", amount: -plain })]);
  });

  it("rozliczenie: osobna pozycja „Dopłaty nadmarży” z mnożnikiem KPI", () => {
    const s = computeSettlement({ commissions: 1000, surchargeTopUps: 200, kpiMultiplier: 0.75 });
    expect(s.lines.map((l) => l.key)).toEqual(["commissions", "surchargeTopUps", "kpi"]);
    expect(s.payable).toBe(900);
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
