import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { salesDifferential, structureTotal, teamCareFee } from "../structure";
import { squadronActiveAt, squadronFor, squadronPayout, toggleSquadron, type Squadron } from "../squadron";
import { approvedCount, decideReview, filesExpired, purgeExpiredFiles, reviewChecks, type FiveStarReview } from "../reviews";

const lvl = (n: number) => config.salesLevels.find((l) => l.level === n)!;

describe("Konstelacja: dyferencja i opieka nad zespołem", () => {
  it("Solo: różnica stawek Solo managera i osoby", () => {
    // poziom 6 (5 500) vs poziom 2 (3 500)
    expect(salesDifferential({ kind: "base", samVat: false, state: "green" }, lvl(6), lvl(2), config)).toBe(2000);
  });
  it("Dopłata do Duetu: różnica dopłat (Duet − Solo)", () => {
    // 7 500−5 500 = 2 000 vs 5 500−3 500 = 2 000 → 0
    expect(salesDifferential({ kind: "duoTopUp", samVat: false, state: "green" }, lvl(6), lvl(2), config)).toBe(0);
  });
  it("sam VAT obniża dyferencję; nigdy ujemna; potrącenie ze znakiem minus", () => {
    expect(salesDifferential({ kind: "base", samVat: true, state: "green" }, lvl(6), lvl(2), config)).toBe(500);
    expect(salesDifferential({ kind: "base", samVat: false, state: "green" }, lvl(2), lvl(6), config)).toBe(0);
    expect(salesDifferential({ kind: "base", samVat: false, state: "clawback" }, lvl(6), lvl(2), config)).toBe(-2000);
    expect(salesDifferential({ kind: "surchargeTopUp", samVat: false, state: "green" }, lvl(6), lvl(2), config)).toBe(0);
  });
  it("opieka nad zespołem z poziomu (kwota admina), tylko gdy jest zespół", () => {
    expect(teamCareFee({ ...lvl(6), teamCareFee: 1200 }, 2)).toBe(1200);
    expect(teamCareFee({ ...lvl(6), teamCareFee: 1200 }, 0)).toBe(0);
    expect(teamCareFee(lvl(6), 3)).toBe(0); // nieuzupełniona
    expect(structureTotal([2000, 500, -2000], 1200)).toBe(1700);
  });
});

describe("Eskadry", () => {
  const sq: Squadron = {
    id: "lb",
    name: "Eskadra ŁB",
    prefix: "ŁB",
    leaderName: "Lider",
    rules: { perClient: 1000, note: "" },
    history: [{ at: "2026-08-01T00:00:00Z", active: true, by: "admin" }],
  };
  it("aktywna od włączenia; wyłączenie zapisuje historię, nie kasuje", () => {
    expect(squadronActiveAt(sq, new Date("2026-07-01T00:00:00Z"))).toBe(false);
    expect(squadronActiveAt(sq, new Date("2026-09-01T00:00:00Z"))).toBe(true);
    const off = toggleSquadron(sq, false, "admin", new Date("2026-09-15T00:00:00Z"));
    expect(off.history).toHaveLength(2);
    expect(squadronActiveAt(off, new Date("2026-09-10T00:00:00Z"))).toBe(true);
    expect(squadronActiveAt(off, new Date("2026-09-20T00:00:00Z"))).toBe(false);
    expect(toggleSquadron(off, false, "admin", new Date("2026-09-21T00:00:00Z"))).toBe(off);
  });
  it("klient należy do eskadry po inicjałach — tylko gdy była aktywna przy podpisaniu umowy", () => {
    expect(squadronFor("łb", [sq], new Date("2026-09-01T00:00:00Z"))?.id).toBe("lb");
    expect(squadronFor("ŁB", [sq], new Date("2026-07-01T00:00:00Z"))).toBeNull();
    expect(squadronFor("MW", [sq], new Date("2026-09-01T00:00:00Z"))).toBeNull();
  });
  it("rozliczenie eskadry: klienci zieleni w okresie × stawka z pakietu", () => {
    const d = (s: string) => new Date(s);
    expect(squadronPayout(sq, [d("2026-09-02T10:00:00Z"), d("2026-09-20T10:00:00Z"), null, d("2026-08-30T10:00:00Z")], d("2026-09-01T00:00:00Z"), d("2026-09-30T23:59:59Z"))).toEqual({ clients: 2, amount: 2000 });
  });
});

describe("Opinie 5★", () => {
  const rules = config.reviews;
  const r: FiveStarReview = {
    id: "r1",
    employeeId: "e-marek",
    clientId: "c1",
    clientName: "Jan K.",
    submittedAt: "2026-09-30T10:00:00Z",
    ai: { stars: 5, reviewerName: "Jan K.", date: "2026-09-29" },
    photoConsent: true,
    screenshot: "data:image/png;base64,x",
    photo: "data:image/png;base64,y",
    status: "pending",
    decidedBy: null,
    decidedAt: null,
    rejectReason: null,
  };
  const now = new Date("2026-10-01T10:00:00Z");

  it("zatwierdzenie jednym kliknięciem; bez zgody na zdjęcie — zablokowane", () => {
    expect(decideReview(r, "approved", "u-anna", now, rules)).toMatchObject({ status: "approved", decidedBy: "u-anna" });
    expect(decideReview({ ...r, photoConsent: false }, "approved", "u-anna", now, rules)).toEqual({ error: "Brak zgody klienta na zdjęcie" });
  });
  it("odczyt AI poniżej 5★ — ostrzeżenie dla managera; odrzucenie wymaga powodu", () => {
    expect(reviewChecks({ ...r, ai: { ...r.ai, stars: 4 } }, rules).warnings[0]).toMatch(/4★/);
    expect(decideReview(r, "rejected", "u-anna", now, rules)).toEqual({ error: "Podaj powód odrzucenia" });
    expect(decideReview(r, "rejected", "u-anna", now, rules, "To nie ten klient")).toMatchObject({ status: "rejected", rejectReason: "To nie ten klient" });
  });
  it("pliki usuwane po 90 dniach od decyzji; licznik zatwierdzonych do KPI", () => {
    const approved = decideReview(r, "approved", "u-anna", now, rules) as FiveStarReview;
    expect(filesExpired(approved, new Date("2026-12-29T09:00:00Z"), rules)).toBe(false);
    expect(filesExpired(approved, new Date("2026-12-30T10:00:00Z"), rules)).toBe(true);
    expect(purgeExpiredFiles([approved], new Date("2027-01-01T00:00:00Z"), rules)[0]).toMatchObject({ screenshot: null, photo: null, status: "approved" });
    expect(approvedCount([approved, r], "e-marek")).toBe(1);
  });
});
