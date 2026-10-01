import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import type { CrmAgreement } from "@/lib/crm/types";
import { buildTrajectory, statusChangesSince } from "../trajectory";

const rules = config.crm;
const at = (day: number, hour = 10) => new Date(Date.UTC(2026, 8, day, hour)).toISOString();
const agreement = (type: string, statuses: string[], number = "MW/01/09/26/TERMO"): CrmAgreement => ({
  id: number,
  clientId: "c1",
  number,
  type,
  statusHistory: statuses.map((status, i) => ({ status, at: at(1 + i) })),
  userId: null,
  valueNet: 0,
  surchargeNet: 0,
});

describe("Trajektoria umowy sprzedażowej", () => {
  const a = agreement("PREFINANSOWANIE 2.0", ["ZAWIERANIE UMOWY", "UMOWA PODPISANA", "W TRAKCIE FINANSOWANIA", "WYLICZENIE PROWIZJI", "WERYFIKACJA UMOWY"]);
  const t = buildTrajectory(a, "thermo", rules);

  it("obecny status podświetlony, kolejny krok wskazany", () => {
    expect(t.currentStatus).toBe("WERYFIKACJA UMOWY");
    expect(t.steps.find((s) => s.state === "current")?.status).toBe("WERYFIKACJA UMOWY");
    expect(t.nextStatus).toBe("REALIZACJA AUDYTU - GWD");
  });

  it("przebyte statusy z datami, pominięte bez daty", () => {
    expect(t.steps.find((s) => s.status === "UMOWA PODPISANA")).toMatchObject({ state: "done", enteredAt: at(2) });
    expect(t.steps.find((s) => s.status === "WELCOME CALL")).toMatchObject({ state: "skipped", enteredAt: null });
  });

  it("ścieżka bez statusów negatywnych i ignorowanych", () => {
    const names = t.steps.map((s) => s.status);
    expect(names).not.toContain("WYLICZENIE PROWIZJI");
    expect(names).not.toContain("WERYFIKACJA DOKUMENTOWA NEGATYWNA");
  });

  it("ile kroków do zielonej prowizji", () => {
    // WERYFIKACJA UMOWY → REALIZACJA → PRZYGOTOWANIE → WERYFIKACJA DOK. WFOŚ → W TRAKCIE SKŁADANIA
    expect(t.greenStatus).toBe("W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW");
    expect(t.stepsToGreen).toBe(4);
    expect(t.steps.find((s) => s.marker === "green")?.status).toBe("W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW");
  });

  it("po zazielenieniu: 0 kroków", () => {
    const green = buildTrajectory(agreement("PREFINANSOWANIE 2.0", ["UMOWA PODPISANA", "OCZEKIWANIE NA DECYZJĘ"]), "thermo", rules);
    expect(green.stepsToGreen).toBe(0);
  });
});

describe("Trajektoria audytu", () => {
  it("znacznik szarej i zielonej prowizji audytora", () => {
    const t = buildTrajectory(agreement("AUDYT CP 2.0", ["UMOWA PODPISANA", "W TRAKCIE POMIARÓW"], "ON/1/09/26/A"), "audit", rules);
    expect(t.steps.find((s) => s.marker === "grey")?.status).toBe("DOKUMENTACJA POMIAROWA");
    expect(t.greenStatus).toBe("TWORZENIE OFERTY");
    expect(t.stepsToGreen).toBe(3);
  });
});

describe("statusy negatywne i nieznane", () => {
  it("negatywny: brak kroków do zielonej, zdarzenie z datą", () => {
    const t = buildTrajectory(agreement("PREFINANSOWANIE 2.0", ["UMOWA PODPISANA", "W TRAKCIE FINANSOWANIA", "WIN-BACK"]), "thermo", rules);
    expect(t.negative).toBe(true);
    expect(t.stepsToGreen).toBeNull();
    expect(t.negativeEvents).toEqual([{ status: "WIN-BACK", at: at(3) }]);
    expect(t.steps.find((s) => s.status === "W TRAKCIE FINANSOWANIA")?.state).toBe("done");
  });

  it("nieznany status nie psuje widoku", () => {
    const t = buildTrajectory(agreement("PREFINANSOWANIE 2.0", ["UMOWA PODPISANA", "DZIAŁ PRAWNY"]), "thermo", rules);
    expect(t.unknown).toBe(true);
    expect(t.stepsToGreen).toBeNull();
  });
});

describe("powiadomienia o ruchach biura", () => {
  it("zmiany statusów po dacie, najnowsze pierwsze, bez statusów ignorowanych", () => {
    const a = agreement("PREFINANSOWANIE 2.0", ["UMOWA PODPISANA", "W TRAKCIE FINANSOWANIA", "WYLICZENIE PROWIZJI", "WERYFIKACJA UMOWY"]);
    const changes = statusChangesSince([a], new Date(at(1, 12)), rules);
    expect(changes.map((c) => [c.from, c.to])).toEqual([
      ["W TRAKCIE FINANSOWANIA", "WERYFIKACJA UMOWY"],
      ["UMOWA PODPISANA", "W TRAKCIE FINANSOWANIA"],
    ]);
  });
});
