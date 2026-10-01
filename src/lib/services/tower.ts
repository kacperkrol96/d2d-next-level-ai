import "server-only";
import type { AppUser } from "@/lib/auth/users";
import { getDataSource } from "@/lib/data";
import { validatePlanChange, activePlan, type AuditorPlan } from "@/lib/domain/safety";
import { decideReview, reviewChecks, type FiveStarReview } from "@/lib/domain/reviews";
import { yellowCard, type PersonEvent } from "@/lib/domain/cards";
import type { CardReason } from "@/lib/config/types";
import { getTeamAcademy, teamOf, type TeamMemberAcademy } from "./academy";
import { getOrbitData, type OrbitData } from "./orbit";
import { loadContext } from "./portfolio";

/** Wieża — panel managera: zespół, alerty, kartki, system audytora, opinie 5★, postępy w Akademii. */

export interface TowerMember {
  person: AppUser;
  orbit: OrbitData | null;
  academy: TeamMemberAcademy | null;
  plan: AuditorPlan | null;
  alerts: string[];
}

export interface TowerData {
  members: TowerMember[];
  reviews: (FiveStarReview & { personName: string; checks: ReturnType<typeof reviewChecks> })[];
  alerts: { person: string; text: string; tone: "danger" | "gold" }[];
}

export async function getTower(user: AppUser, now = new Date()): Promise<TowerData> {
  const source = getDataSource();
  const [team, config, allReviews] = await Promise.all([teamOf(user), source.getConfig(), source.fiveStarReviews()]);
  const ctx = await loadContext(now);
  const academy = await getTeamAcademy(user, now);
  const members: TowerMember[] = await Promise.all(
    team.map(async (person) => {
      const orbit = await getOrbitData(person, now, ctx);
      const plan = person.track === "auditor" ? activePlan(await source.auditorPlanHistory(person.id), now) : null;
      const a = academy.find((m) => m.person.id === person.id) ?? null;
      const alerts: string[] = [];
      if (orbit?.discipline.red.red) alerts.push("Czerwona kartka");
      if (orbit?.kpi.belowMinimum) alerts.push(`KPI ${orbit.kpi.score} pkt — poniżej minimum (mnożnik 75%)`);
      if (orbit && !orbit.recordings.ok) alerts.push(`Nagrania ${Math.round(orbit.recordings.share * 100)}% — minimum ${Math.round(orbit.recordings.min * 100)}%`);
      if (a?.pendingReviews.length) alerts.push(`Egzamin do oceny (${a.pendingReviews.length})`);
      if (a?.formsToFill.length) alerts.push(`Karta do wypełnienia: ${a.formsToFill.map((f) => f.label).join(", ")}`);
      return { person, orbit, academy: a, plan, alerts };
    }),
  );
  const ids = new Set(team.map((p) => p.crmEmployeeId));
  const name = (employeeId: string) => team.find((p) => p.crmEmployeeId === employeeId)?.name ?? employeeId;
  return {
    members,
    reviews: allReviews
      .filter((r) => ids.has(r.employeeId) && r.status === "pending")
      .map((r) => ({ ...r, personName: name(r.employeeId), checks: reviewChecks(r, config.reviews) })),
    alerts: members.flatMap((m) => m.alerts.map((text) => ({ person: m.person.name, text, tone: /Czerwona|KPI/.test(text) ? ("danger" as const) : ("gold" as const) }))),
  };
}

async function member(user: AppUser, personId: string) {
  return (await teamOf(user)).find((p) => p.id === personId) ?? null;
}

export type DisciplineInput = { kind: "yellow"; reason: CardReason; note: string } | { kind: "late" | "absence"; note: string };

/** Kartka / spóźnienie / nieobecność nadane przez managera (zawsze z uzasadnieniem przy kartce). */
export async function addDiscipline(user: AppUser, personId: string, input: DisciplineInput, now = new Date()): Promise<{ error: string } | { ok: true }> {
  const person = await member(user, personId);
  if (!person?.crmEmployeeId) return { error: "Ta osoba nie jest w Twoim zespole." };
  let event: PersonEvent;
  try {
    event =
      input.kind === "yellow"
        ? { personId: person.crmEmployeeId, ...yellowCard(input.reason, user.id, now, { note: input.note }) }
        : { personId: person.crmEmployeeId, kind: input.kind, at: now.toISOString(), by: user.id };
  } catch (e) {
    return { error: (e as Error).message };
  }
  await getDataSource().addDisciplineEvent(event);
  return { ok: true };
}

export async function changeAuditorPlan(user: AppUser, personId: string, plan: AuditorPlan, reason: string, temporary: boolean, now = new Date()) {
  const person = await member(user, personId);
  if (!person || person.track !== "auditor") return { error: "Zmiana systemu dotyczy audytorów z Twojego zespołu." };
  const source = getDataSource();
  const current = activePlan(await source.auditorPlanHistory(person.id), now);
  const error = validatePlanChange(current, { plan, by: user.id, reason, temporary });
  if (error) return { error };
  await source.savePlanChange(person.id, { plan, from: now.toISOString(), by: user.id, reason: reason.trim(), temporary });
  return { ok: true as const };
}

export async function decideFiveStar(user: AppUser, reviewId: string, decision: "approved" | "rejected", reason: string, now = new Date()) {
  const source = getDataSource();
  const [reviews, config, team] = await Promise.all([source.fiveStarReviews(), source.getConfig(), teamOf(user)]);
  const review = reviews.find((r) => r.id === reviewId);
  if (!review || !team.some((p) => p.crmEmployeeId === review.employeeId)) return { error: "Brak dostępu do tej opinii." };
  const next = decideReview(review, decision, user.id, now, config.reviews, reason);
  if ("error" in next) return next;
  await source.saveFiveStarReview(next);
  return { ok: true as const };
}
