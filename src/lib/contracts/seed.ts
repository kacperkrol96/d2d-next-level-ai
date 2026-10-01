import type { ContractVersion } from "./types";
import { auditorContract, salesContract } from "./texts";

/** Wersje startowe (1) — dalej edytuje admin w Mennicy → Ustawienia. */
export function seedContracts(): ContractVersion[] {
  const at = "2026-09-01T08:00:00.000Z";
  return [
    { track: "auditor", version: 1, title: "Kontrakt audytora", body: auditorContract, publishedAt: at, publishedBy: "u-kacper" },
    { track: "sales", version: 1, title: "Kontrakt handlowca", body: salesContract, publishedAt: at, publishedBy: "u-kacper" },
  ];
}
