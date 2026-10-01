import type { ContractAcceptance, ContractTrack, ContractVersion } from "@/lib/contracts/types";

/** Najnowsza opublikowana wersja kontraktu dla ścieżki. */
export function currentContract(versions: readonly ContractVersion[], track: ContractTrack): ContractVersion | null {
  return versions.filter((v) => v.track === track).sort((a, b) => b.version - a.version)[0] ?? null;
}

/**
 * Czy osoba musi (ponownie) zaakceptować kontrakt: brak akceptacji najnowszej wersji.
 * Nowa wersja = ponowna akceptacja.
 */
export function needsAcceptance(
  userId: string,
  track: ContractTrack,
  versions: readonly ContractVersion[],
  acceptances: readonly ContractAcceptance[],
): ContractVersion | null {
  const current = currentContract(versions, track);
  if (!current) return null;
  const accepted = acceptances.some((a) => a.userId === userId && a.track === track && a.version === current.version);
  return accepted ? null : current;
}

/** Nowa wersja od admina: numer o 1 wyższy; treść nie może być pusta ani identyczna. */
export function nextContractVersion(
  versions: readonly ContractVersion[],
  track: ContractTrack,
  draft: { title: string; body: string; by: string; at: Date },
): ContractVersion | { error: string } {
  const current = currentContract(versions, track);
  if (!draft.body.trim() || !draft.title.trim()) return { error: "Tytuł i treść nie mogą być puste" };
  if (current && current.body.trim() === draft.body.trim() && current.title.trim() === draft.title.trim()) return { error: "Treść się nie zmieniła" };
  return { track, version: (current?.version ?? 0) + 1, title: draft.title.trim(), body: draft.body, publishedAt: draft.at.toISOString(), publishedBy: draft.by };
}

/** Akceptacja ważna tylko z podpisem i dla aktualnej wersji. */
export function validateAcceptance(current: ContractVersion | null, input: { version: number; signature: string }): string | null {
  if (!current) return "Brak kontraktu do akceptacji";
  if (input.version !== current.version) return "Kontrakt został zmieniony — przeczytaj nową wersję";
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]{100,}$/.test(input.signature)) return "Złóż podpis palcem";
  return null;
}
