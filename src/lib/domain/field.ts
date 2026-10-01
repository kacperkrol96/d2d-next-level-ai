import type { FieldRules } from "@/lib/config/types";

/** Ten sam rejon maksymalnie raz na N dni — ostrzeżenie albo blokada (ustawienie). */
export function areaAssignmentCheck(lastVisitAt: Date | null, now: Date, rules: FieldRules): { status: "ok" | "warning" | "blocked"; daysLeft: number } {
  if (!lastVisitAt) return { status: "ok", daysLeft: 0 };
  const days = (now.getTime() - lastVisitAt.getTime()) / (24 * 60 * 60 * 1000);
  if (days >= rules.areaCooldownDays) return { status: "ok", daysLeft: 0 };
  return { status: rules.areaCooldownMode === "block" ? "blocked" : "warning", daysLeft: Math.ceil(rules.areaCooldownDays - days) };
}

/** Checklista nowego rejonu — pierwsza wizyta zaczyna się od sołtysa. */
export const AREA_CHECKLIST = [{ id: "soltys", label: "Sołtys odwiedzony" }] as const;

export interface LeadDraft {
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  /** Podpis klienta palcem pod zgodą RODO (obrazek). */
  rodoSignature: string | null;
  /** Potwierdzenie wysłane klientowi (SMS albo e-mail). */
  confirmationChannel: "sms" | "email" | null;
}

/** Lead kompletny tylko z podpisaną zgodą RODO i potwierdzeniem dla klienta. */
export function leadMissingFields(lead: LeadDraft): string[] {
  const missing: string[] = [];
  if (!lead.name.trim()) missing.push("imię i nazwisko");
  if (!lead.address.trim()) missing.push("adres");
  if (!lead.phone && !lead.email) missing.push("telefon lub e-mail");
  if (!lead.rodoSignature) missing.push("podpis zgody RODO");
  if (!lead.confirmationChannel) missing.push("potwierdzenie dla klienta (SMS lub e-mail)");
  else if (lead.confirmationChannel === "sms" && !lead.phone) missing.push("telefon do potwierdzenia SMS");
  else if (lead.confirmationChannel === "email" && !lead.email) missing.push("e-mail do potwierdzenia");
  return missing;
}
