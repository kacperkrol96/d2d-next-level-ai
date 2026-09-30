import type { FleetBand } from "@/lib/config/types";

export interface FleetResult {
  clients: number;
  cost: number;
  /** Liczba klientów, od której auto jest bezpłatne (cel paska postępu). */
  freeFrom: number;
  /** Ilu klientów brakuje do obniżenia kosztu (0, gdy już 0 zł). */
  clientsToNextBand: number;
  nextBandCost: number | null;
}

/** Koszt auta firmowego w miesiącu wg liczby klientów (status jak przy prowizji). */
export function fleetCost(clients: number, bands: readonly FleetBand[]): FleetResult {
  const sorted = [...bands].sort((a, b) => a.minClients - b.minClients);
  if (sorted.length === 0) throw new Error("Brak progów floty w konfiguracji");

  const index = sorted.findIndex((b) => clients >= b.minClients && (b.maxClients === null || clients <= b.maxClients));
  const bandIndex = index === -1 ? sorted.length - 1 : index;
  const band = sorted[bandIndex];
  const next = sorted[bandIndex + 1] ?? null;
  const freeBand = sorted.find((b) => b.cost === 0) ?? sorted[sorted.length - 1];

  return {
    clients,
    cost: band.cost,
    freeFrom: freeBand.minClients,
    clientsToNextBand: next ? next.minClients - clients : 0,
    nextBandCost: next ? next.cost : null,
  };
}
