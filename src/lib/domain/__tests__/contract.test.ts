import { describe, expect, it } from "vitest";
import type { ContractAcceptance, ContractVersion } from "@/lib/contracts/types";
import { currentContract, needsAcceptance, nextContractVersion, validateAcceptance } from "../contract";

const v = (track: ContractVersion["track"], version: number, body = `treść ${version}`): ContractVersion => ({
  track,
  version,
  title: "Kontrakt",
  body,
  publishedAt: "2026-09-01T10:00:00Z",
  publishedBy: "u-kacper",
});
const acc = (userId: string, track: ContractAcceptance["track"], version: number): ContractAcceptance => ({
  userId,
  track,
  version,
  acceptedAt: "2026-09-02T10:00:00Z",
  signature: "data:image/png;base64,x",
});
const signature = `data:image/png;base64,${"A".repeat(200)}`;

describe("kontrakt — akceptacja przy pierwszym uruchomieniu", () => {
  const versions = [v("auditor", 1), v("auditor", 2), v("sales", 1)];

  it("aktualna wersja to najwyższy numer dla ścieżki", () => {
    expect(currentContract(versions, "auditor")?.version).toBe(2);
    expect(currentContract(versions, "sales")?.version).toBe(1);
    expect(currentContract([], "sales")).toBeNull();
  });

  it("bez akceptacji → trzeba przeczytać i zaakceptować", () => {
    expect(needsAcceptance("u-ola", "auditor", versions, [])?.version).toBe(2);
  });

  it("nowa wersja wymaga ponownej akceptacji", () => {
    expect(needsAcceptance("u-ola", "auditor", versions, [acc("u-ola", "auditor", 1)])?.version).toBe(2);
    expect(needsAcceptance("u-ola", "auditor", versions, [acc("u-ola", "auditor", 2)])).toBeNull();
  });

  it("akceptacja innej osoby albo innej ścieżki się nie liczy", () => {
    expect(needsAcceptance("u-ola", "auditor", versions, [acc("u-marek", "auditor", 2), acc("u-ola", "sales", 2)])).not.toBeNull();
  });

  it("admin publikuje nową wersję (numer +1), pusta lub identyczna treść odrzucona", () => {
    const at = new Date("2026-10-01T10:00:00Z");
    expect(nextContractVersion(versions, "auditor", { title: "Kontrakt", body: "nowe", by: "u-kacper", at })).toMatchObject({ version: 3, publishedBy: "u-kacper" });
    expect(nextContractVersion([], "sales", { title: "K", body: "x", by: "a", at })).toMatchObject({ version: 1 });
    expect(nextContractVersion(versions, "auditor", { title: "Kontrakt", body: "treść 2", by: "a", at })).toEqual({ error: "Treść się nie zmieniła" });
    expect(nextContractVersion(versions, "auditor", { title: "Kontrakt", body: "  ", by: "a", at })).toHaveProperty("error");
  });

  it("akceptacja wymaga podpisu i aktualnej wersji", () => {
    const current = currentContract(versions, "auditor");
    expect(validateAcceptance(current, { version: 2, signature })).toBeNull();
    expect(validateAcceptance(current, { version: 1, signature })).toMatch(/nową wersję/);
    expect(validateAcceptance(current, { version: 2, signature: "" })).toMatch(/podpis/);
  });
});
