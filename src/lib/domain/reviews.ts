import type { ReviewRules } from "@/lib/config/types";

/**
 * Opinia 5★ do KPI handlowca: screenshot opinii z Google + zdjęcie z klientem.
 * AI wstępnie odczytuje gwiazdki, nazwisko i datę; manager zatwierdza lub odrzuca w Wieży.
 */
export interface FiveStarReview {
  id: string;
  employeeId: string;
  clientId: string;
  clientName: string;
  submittedAt: string;
  /** Odczyt AI ze screena (do sprawdzenia przez managera). */
  ai: { stars: number | null; reviewerName: string | null; date: string | null };
  /** Checkbox „klient zgodził się na zdjęcie”. */
  photoConsent: boolean;
  /** Pliki (obrazki) — null po usunięciu. */
  screenshot: string | null;
  photo: string | null;
  status: "pending" | "approved" | "rejected";
  decidedBy: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
}

/** Ostrzeżenia dla managera przed zatwierdzeniem (zatwierdzenie zablokowane bez zgody na zdjęcie). */
export function reviewChecks(r: FiveStarReview, rules: ReviewRules): { blocking: string[]; warnings: string[] } {
  const blocking: string[] = [];
  const warnings: string[] = [];
  if (!r.photoConsent) blocking.push("Brak zgody klienta na zdjęcie");
  if (!r.screenshot) blocking.push("Brak screena opinii");
  if (r.ai.stars === null) warnings.push("AI nie odczytało liczby gwiazdek — sprawdź screen");
  else if (r.ai.stars < rules.requiredStars) warnings.push(`AI odczytało ${r.ai.stars}★ — wymagane ${rules.requiredStars}★`);
  if (!r.ai.reviewerName) warnings.push("AI nie odczytało nazwiska");
  return { blocking, warnings };
}

export function decideReview(r: FiveStarReview, decision: "approved" | "rejected", by: string, at: Date, rules: ReviewRules, reason?: string): FiveStarReview | { error: string } {
  if (r.status !== "pending") return { error: "Opinia jest już rozpatrzona" };
  if (decision === "approved") {
    const { blocking } = reviewChecks(r, rules);
    if (blocking.length) return { error: blocking.join("; ") };
  }
  if (decision === "rejected" && !reason?.trim()) return { error: "Podaj powód odrzucenia" };
  return { ...r, status: decision, decidedBy: by, decidedAt: at.toISOString(), rejectReason: decision === "rejected" ? reason!.trim() : null };
}

/** Pliki opinii usuwamy po N dniach od decyzji (ustawienie). */
export function filesExpired(r: FiveStarReview, now: Date, rules: ReviewRules): boolean {
  if (!r.decidedAt || (!r.screenshot && !r.photo)) return false;
  return now.getTime() - Date.parse(r.decidedAt) >= rules.fileRetentionDays * 24 * 60 * 60 * 1000;
}

export function purgeExpiredFiles(list: readonly FiveStarReview[], now: Date, rules: ReviewRules): FiveStarReview[] {
  return list.map((r) => (filesExpired(r, now, rules) ? { ...r, screenshot: null, photo: null } : r));
}

export function approvedCount(list: readonly FiveStarReview[], employeeId: string): number {
  return list.filter((r) => r.employeeId === employeeId && r.status === "approved").length;
}
