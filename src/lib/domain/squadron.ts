import { normalize } from "./agreements";
import { roundMoney } from "./money";

/**
 * Eskadra = zewnętrzna grupa sprzedażowa (np. umowy z prefiksem ŁB) z własnym liderem
 * i pakietem zasad rozliczeń. Włączana / wyłączana przez admina; historia zostaje.
 */
export interface Squadron {
  id: string;
  name: string;
  /** Inicjały w numerze umowy (np. „ŁB”). */
  prefix: string;
  leaderName: string;
  /** Pakiet zasad: kwota dla lidera za klienta z zieloną prowizją (wpisuje admin). */
  rules: { perClient: number; note: string };
  /** Historia przełącznika (kto, kiedy, włączona / wyłączona). */
  history: { at: string; active: boolean; by: string }[];
}

export function squadronActiveAt(sq: Squadron, at: Date): boolean {
  const past = sq.history.filter((h) => Date.parse(h.at) <= at.getTime()).sort((a, b) => a.at.localeCompare(b.at));
  return past.at(-1)?.active ?? false;
}

/** Eskadra dla inicjałów z numeru umowy — tylko jeśli była aktywna w chwili podpisania umowy. */
export function squadronFor(initials: string | null, squadrons: readonly Squadron[], at: Date): Squadron | null {
  if (!initials) return null;
  const code = normalize(initials);
  return squadrons.find((s) => normalize(s.prefix) === code && squadronActiveAt(s, at)) ?? null;
}

/** Rozliczenie eskadry za okres: klienci z zieloną prowizją w okresie × stawka z pakietu zasad. */
export function squadronPayout(sq: Squadron, greenDates: readonly (Date | null)[], from: Date, to: Date): { clients: number; amount: number } {
  const clients = greenDates.filter((d) => d && d >= from && d <= to).length;
  return { clients, amount: roundMoney(clients * sq.rules.perClient) };
}

/** Przełącznik admina — zapis w historii (wyłączenie nie kasuje klientów ani rozliczeń). */
export function toggleSquadron(sq: Squadron, active: boolean, by: string, at: Date): Squadron {
  if (squadronActiveAt(sq, at) === active) return sq;
  return { ...sq, history: [...sq.history, { at: at.toISOString(), active, by }] };
}
