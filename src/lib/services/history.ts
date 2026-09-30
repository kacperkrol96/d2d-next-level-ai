import "server-only";
import { recordYellowCard, type YellowCard } from "@/lib/domain/yellow-card";

/**
 * Historia osoby (Etap 0: w pamięci serwera, znika po restarcie).
 * Etap 1: tabela w Supabase. Zasady żółtych kartek zdefiniujemy później —
 * na razie kartka jest tylko zapisywana.
 */
let yellowCards: YellowCard[] = [];

export function saveYellowCard(card: YellowCard | null): void {
  yellowCards = recordYellowCard(yellowCards, card);
}

export function yellowCardsOf(personId: string): YellowCard[] {
  return yellowCards.filter((c) => c.personId === personId);
}
