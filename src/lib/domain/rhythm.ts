import type { WorkRhythm } from "@/lib/config/types";
import { localDay } from "./settlement";

const isoWeekday = (date: Date, timeZone: string) => {
  const [y, m, d] = localDay(date, timeZone).split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
};

export type AuditorDayType = "booking" | "meetings" | "off";

export interface DailyGoal {
  dayType: AuditorDayType | "sales";
  title: string;
  goals: { label: string; target: number }[];
  hint: string;
}

/**
 * Cele dnia w Kokpicie. Audytor: cykl 2-dniowy — dni umawiania (12 leadów, co godzinę 9–20)
 * i dni spotkań (6 audytów). Handlowiec: bez stałego rytmu — domyka oferty z Radaru.
 */
export function dailyGoals(role: "auditor" | "sales", date: Date, rhythm: WorkRhythm, timeZone: string): DailyGoal {
  if (role === "sales") {
    return { dayType: "sales", title: "Domykanie", goals: [], hint: "Bez stałego rytmu — domykasz, gdy oferta jest gotowa (Radar, zasada 3 dni)." };
  }
  const a = rhythm.auditor;
  const wd = isoWeekday(date, timeZone);
  if (a.bookingDays.includes(wd)) {
    return {
      dayType: "booking",
      title: "Dzień umawiania",
      goals: [{ label: "Umówione leady", target: a.cycle.leads }],
      hint: `Umawianie co godzinę ${a.bookingHours.from}:00–${a.bookingHours.to}:00`,
    };
  }
  if (a.meetingDays.includes(wd)) {
    return {
      dayType: "meetings",
      title: "Dzień spotkań",
      goals: [
        { label: "Odbyte spotkania", target: a.cycle.meetings },
        { label: "Umowy", target: a.cycle.agreements },
        { label: "Pomiar", target: a.cycle.measurements },
      ],
      hint: "Sam odbywasz audyty umówione wczoraj",
    };
  }
  return { dayType: "off", title: "Dzień wolny", goals: [], hint: "Odpoczynek — cykl rusza w poniedziałek" };
}

export interface Briefing {
  title: string;
  place: string;
  /** YYYY-MM-DD i HH:MM (czas polski). */
  day: string;
  time: string;
}

/** Najbliższe odprawy (stałe wydarzenia w Misjach). */
export function upcomingBriefings(from: Date, days: number, rhythm: WorkRhythm, timeZone: string): Briefing[] {
  const out: Briefing[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    const wd = isoWeekday(d, timeZone);
    for (const b of rhythm.briefings) if (b.days.includes(wd)) out.push({ title: b.title, place: b.place, day: localDay(d, timeZone), time: b.time });
  }
  return out.sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
}

const localTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);

/** „Zamknij dzień” do 21:00 (czas polski) tego samego dnia — inaczej dzień niezaliczony. */
export function dayClosedInTime(workDay: string, closedAt: Date | null, rhythm: WorkRhythm, timeZone: string): boolean {
  if (!closedAt) return false;
  return localDay(closedAt, timeZone) === workDay && localTime(closedAt, timeZone) <= rhythm.closeDayDeadline;
}

/** Udział nagranych spotkań i czy spełnia minimum (alert w Wieży). */
export function recordingShare(recorded: number, held: number, role: "auditor" | "sales", rhythm: WorkRhythm) {
  const share = held === 0 ? 1 : recorded / held;
  const min = rhythm.minRecordedShare[role];
  return { share, min, ok: share >= min, missing: Math.max(0, Math.ceil(min * held) - recorded) };
}
