import type { CardReason, CardRules } from "@/lib/config/types";

/** Zdarzenia dyscyplinarne w historii osoby. */
export type DisciplineEvent =
  | {
      kind: "yellow";
      reason: CardReason;
      at: string;
      by: string;
      note?: string;
      automatic: boolean;
      /** Klucz kartki automatycznej (np. okres KPI, dzień bez raportu) — najwyżej jedna na klucz. */
      key?: string;
    }
  | { kind: "late"; at: string; by: string }
  | { kind: "absence"; at: string; by: string }
  | { kind: "red"; at: string; trigger: "lateness" | "absences" | "yellowCards" };

export type YellowEvent = Extract<DisciplineEvent, { kind: "yellow" }>;

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
export function yellowCard(reason: CardReason, by: string, at: Date, opts: { automatic?: boolean; note?: string; key?: string } = {}): YellowEvent {
  const automatic = opts.automatic ?? false;
  if (automatic && !AUTOMATIC_REASONS.includes(reason)) throw new Error(`Kartki „${reason}” nie nadaje się automatycznie`);
  if (!automatic && !by) throw new Error("Kartkę nadaje manager — podaj, kto");
  if (!automatic && !opts.note?.trim() && reason !== "late") throw new Error("Podaj uzasadnienie kartki");
  return { kind: "yellow", reason, at: at.toISOString(), by, note: opts.note, automatic, ...(opts.key ? { key: opts.key } : {}) };
}

/** Wpis w historii osoby. */
export type PersonEvent = DisciplineEvent & { personId: string };

/** Dopisuje zdarzenie — kartka automatyczna najwyżej raz na klucz (okres / dzień). */
export function recordEvent(history: readonly PersonEvent[], event: PersonEvent | null): PersonEvent[] {
  if (!event) return [...history];
  const key = event.kind === "yellow" ? event.key : undefined;
  const exists = key !== undefined && history.some((e) => e.personId === event.personId && e.kind === "yellow" && e.key === key);
  return exists ? [...history] : [...history, event];
}

/** Automatyczna kartka za KPI poniżej minimum (raz na okres rozliczeniowy). */
export function kpiYellowCard(personId: string, kpi: { yellowCard: boolean; score: number }, periodKey: string, now: Date): PersonEvent | null {
  if (!kpi.yellowCard) return null;
  return { personId, ...yellowCard("kpi_below_minimum", "system", now, { automatic: true, key: `kpi:${periodKey}`, note: `Wynik KPI ${kpi.score} pkt` }) };
}

/** Automatyczna kartka za dzień bez „Zamknij dzień” do terminu (raz na dzień). */
export function noReportYellowCard(personId: string, workDay: string, closedInTime: boolean, now: Date): PersonEvent | null {
  if (closedInTime) return null;
  return { personId, ...yellowCard("no_report", "system", now, { automatic: true, key: `day:${workDay}`, note: `Dzień ${workDay} bez „Zamknij dzień” do terminu — dzień niezaliczony` }) };
}
