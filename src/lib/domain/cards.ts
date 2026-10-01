import type { CardReason, CardRules } from "@/lib/config/types";

/** Zdarzenia dyscyplinarne w historii osoby. */
export type DisciplineEvent =
  | { kind: "yellow"; reason: CardReason; at: string; by: string; note?: string; automatic: boolean }
  | { kind: "late"; at: string; by: string }
  | { kind: "absence"; at: string; by: string }
  | { kind: "red"; at: string; trigger: "lateness" | "absences" | "yellowCards" };

/** Kartki nadawane automatycznie przez aplikację. */
export const AUTOMATIC_REASONS: CardReason[] = ["no_report", "kpi_below_minimum"];

export interface RedCardCheck {
  red: boolean;
  trigger: "lateness" | "absences" | "yellowCards" | null;
  counts: { lateness: number; absences: number; yellowCards: number };
}

/**
 * Czerwona kartka: 3 spóźnienia, 2 nieobecności albo 2 żółte kartki w oknie czasu
 * (liczba dni w ustawieniach). Spóźnienie z żółtą kartką „Spóźnienie” liczy się raz.
 */
export function checkRedCard(events: readonly DisciplineEvent[], rules: CardRules, now: Date): RedCardCheck {
  const since = now.getTime() - rules.red.windowDays * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => Date.parse(e.at) >= since && Date.parse(e.at) <= now.getTime());
  const lateEvents = recent.filter((e) => e.kind === "late").length;
  const lateYellows = recent.filter((e) => e.kind === "yellow" && e.reason === "late").length;
  const counts = {
    lateness: Math.max(lateEvents, lateYellows),
    absences: recent.filter((e) => e.kind === "absence").length,
    yellowCards: recent.filter((e) => e.kind === "yellow").length,
  };
  const trigger =
    counts.yellowCards >= rules.red.yellowCards ? "yellowCards" : counts.lateness >= rules.red.lateness ? "lateness" : counts.absences >= rules.red.absences ? "absences" : null;
  return { red: trigger !== null, trigger, counts };
}

/** Nadanie żółtej kartki: manager zawsze z powodem; automatyczne tylko dla powodów automatycznych. */
export function yellowCard(reason: CardReason, by: string, at: Date, opts: { automatic?: boolean; note?: string } = {}): DisciplineEvent {
  const automatic = opts.automatic ?? false;
  if (automatic && !AUTOMATIC_REASONS.includes(reason)) throw new Error(`Kartki „${reason}” nie nadaje się automatycznie`);
  if (!automatic && !by) throw new Error("Kartkę nadaje manager — podaj, kto");
  return { kind: "yellow", reason, at: at.toISOString(), by, note: opts.note, automatic };
}
