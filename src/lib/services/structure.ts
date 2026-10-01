import "server-only";
import type { AppUser } from "@/lib/auth/users";
import type { CrmEmployee } from "@/lib/crm/types";
import { getDataSource } from "@/lib/data";
import { auditorDifferential } from "@/lib/domain/commission";
import { roundMoney } from "@/lib/domain/money";
import { localDay, previousMonth } from "@/lib/domain/settlement";
import { squadronActiveAt, squadronPayout, type Squadron } from "@/lib/domain/squadron";
import { salesDifferential, structureTotal, teamCareFee } from "@/lib/domain/structure";
import { getOrbitData } from "./orbit";
import {
  auditorEntries,
  auditorLevelState,
  loadContext,
  monthKey,
  reachedCategoryAtSafe,
  salesEntries,
  salesLevelState,
  type CommissionEntry,
  type PortfolioContext,
} from "./portfolio";

/**
 * Konstelacja: struktura managera jako gwiazdozbiór + „Twój zarobek ze struktury w tym miesiącu”
 * (dyferencja + opieka nad zespołem) + eskadry (zewnętrzne grupy).
 */

export interface StarNode {
  employee: CrmEmployee;
  user: AppUser | null;
  /** Rodzic w strukturze (null = centrum). */
  parentId: string | null;
  depth: number;
  level: number;
  levelTitle: string;
  clients: number;
  /** 0–1: aktywność w tym tygodniu (jasność gwiazdy). */
  activity: number;
  alert: string | null;
  kpiScore: number | null;
  /** Ile manager zarobił dzięki tej osobie w tym miesiącu (dyferencja). */
  earnedForManager: number;
  /** To samo za poprzedni miesiąc (kontekst na początku miesiąca). */
  earnedPrevMonth: number;
  /** Ostatnie zielone prowizje osoby w tym miesiącu (do karty). */
  monthEntries: CommissionEntry[];
}

export interface SquadronView {
  squadron: Squadron;
  active: boolean;
  clients: { id: string; name: string; city: string; greenAt: string | null }[];
  month: { clients: number; amount: number };
}

export interface Constellation {
  center: StarNode;
  nodes: StarNode[];
  month: string;
  previousMonth: string;
  previousTotal: number;
  differential: number;
  teamCare: number;
  teamCareMissing: boolean;
  total: number;
  squadrons: SquadronView[];
}

function descendants(id: string, employees: readonly CrmEmployee[], depth = 1): { e: CrmEmployee; parentId: string; depth: number }[] {
  return employees.filter((e) => e.managerId === id).flatMap((e) => [{ e, parentId: id, depth }, ...descendants(e.id, employees, depth + 1)]);
}

function trackOf(e: CrmEmployee): "sales" | "auditor" {
  return e.role === "auditor" ? "auditor" : "sales";
}

function personState(e: CrmEmployee, highest: number, ctx: PortfolioContext) {
  if (trackOf(e) === "sales") {
    const st = salesLevelState(e.id, highest, ctx);
    const entries = salesEntries(e.id, ctx, st.timeline, st.progress.current.level);
    return {
      timeline: st.timeline,
      level: st.progress.current.level,
      title: st.progress.current.title,
      clients: st.own,
      entries,
    };
  }
  const st = auditorLevelState(e.id, highest, ctx);
  const entries = auditorEntries(e.id, ctx, st.timeline, st.progress.current.level);
  return {
    timeline: st.timeline,
    level: st.progress.current.level,
    title: st.progress.current.title,
    clients: st.own,
    entries,
  };
}

const inMonth = (iso: string | null, month: string, ctx: PortfolioContext) => iso !== null && monthKey(new Date(iso), ctx) === month;

export async function getConstellation(user: AppUser, centerEmployeeId?: string | null, now = new Date()): Promise<Constellation | null> {
  const source = getDataSource();
  const ctx = await loadContext(now);
  const { config, employees } = ctx;
  const users = await source.listUsers();
  const centerId = user.role === "admin" ? (centerEmployeeId ?? employees.find((e) => e.managerId === null)?.id ?? null) : user.crmEmployeeId;
  const centerEmp = employees.find((e) => e.id === centerId);
  if (!centerEmp) return null;
  const month = monthKey(now, ctx);
  const prevMonth = previousMonth(month);
  const userOf = (id: string) => users.find((u) => u.crmEmployeeId === id) ?? null;

  const centerHighest = userOf(centerEmp.id)?.highestLevel ?? 1;
  const centerState = personState(centerEmp, centerHighest, ctx);
  const centerTrack = trackOf(centerEmp);

  const build = async (e: CrmEmployee, parentId: string | null, depth: number): Promise<StarNode> => {
    const u = userOf(e.id);
    const st = depth === 0 ? centerState : personState(e, u?.highestLevel ?? 1, ctx);
    const orbit = u ? await getOrbitData(u, now, ctx) : null;
    const log = await source.workLog(e.id);
    const entriesIn = (m: string) =>
      st.entries.filter((x) => (x.state === "green" && inMonth(x.greenAt, m, ctx)) || (x.state === "clawback" && inMonth(x.droppedAt, m, ctx)));
    const monthEntries = entriesIn(month);
    // Dyferencja tylko w tej samej ścieżce (handlowiec ← handlowiec, audytor ← audytor).
    const earnedIn = (list: CommissionEntry[]) => {
      let earned = 0;
      if (depth > 0 && trackOf(e) === centerTrack) {
        for (const x of list) {
          const at = x.greenAt ? new Date(x.greenAt) : now;
          // Poziom managera w chwili zazielenienia (zdobyty poziom nie spada — uwzględniamy poziom z profilu).
          const mgrLevel = Math.max(centerState.timeline(at), centerHighest);
          if (centerTrack === "sales") {
            const m = config.salesLevels.find((l) => l.level === mgrLevel)!;
            const s = config.salesLevels.find((l) => l.level === x.level)!;
            earned += salesDifferential({ kind: x.kind, samVat: x.samVat ?? false, state: x.state }, m, s, config);
          } else {
            const tier = ctx.clients.find((rc) => rc.client.id === x.clientId)?.terms.incomeTier;
            if (!tier) continue;
            const m = config.auditorLevels.find((l) => l.level === mgrLevel)!;
            const s = config.auditorLevels.find((l) => l.level === x.level)!;
            earned += (x.state === "clawback" ? -1 : 1) * auditorDifferential(m, s, tier);
          }
        }
      }
      return roundMoney(earned);
    };
    const alert = orbit?.discipline.red.red
      ? "Czerwona kartka"
      : orbit?.kpi.belowMinimum
        ? "KPI poniżej minimum"
        : orbit && !orbit.recordings.ok
          ? "Nagrania poniżej minimum"
          : null;
    const weekTarget = trackOf(e) === "auditor" ? config.rhythm.auditor.week.held : config.rhythm.auditor.cycle.meetings;
    return {
      employee: e,
      user: u,
      parentId,
      depth,
      level: st.level,
      levelTitle: st.title,
      clients: st.clients,
      activity: Math.max(0.15, Math.min(1, (log.today.meetings + log.today.leads / 2 + log.meetingsHeld / 4) / Math.max(1, weekTarget))),
      alert,
      kpiScore: orbit?.kpi.score ?? null,
      earnedForManager: earnedIn(monthEntries),
      earnedPrevMonth: earnedIn(entriesIn(prevMonth)),
      monthEntries,
    };
  };

  const center = await build(centerEmp, null, 0);
  const nodes = await Promise.all(descendants(centerEmp.id, employees).map((d) => build(d.e, d.parentId, d.depth)));
  const differential = roundMoney(nodes.reduce((s, n) => s + n.earnedForManager, 0));
  const level = centerTrack === "sales" ? config.salesLevels.find((l) => l.level === center.level) : null;
  const sameTrackTeam = nodes.filter((n) => trackOf(n.employee) === centerTrack).length;
  const teamCare = level ? teamCareFee(level, sameTrackTeam) : 0;

  return {
    center,
    nodes,
    month,
    previousMonth: prevMonth,
    previousTotal: structureTotal(
      nodes.map((n) => n.earnedPrevMonth),
      teamCare,
    ),
    differential,
    teamCare,
    teamCareMissing: !!level && sameTrackTeam > 0 && level.teamCareFee === null && center.level >= config.rules.salesStructureCountsFromLevel,
    total: structureTotal([differential], teamCare),
    squadrons: user.role === "admin" ? await squadronViews(ctx, month) : [],
  };
}

async function squadronViews(ctx: PortfolioContext, month: string): Promise<SquadronView[]> {
  const squadrons = await getDataSource().squadrons();
  return squadrons.map((sq) => {
    const clients = ctx.clients
      .filter((rc) => rc.squadronId === sq.id)
      .map((rc) => {
        const greenAt = reachedCategoryAtSafe(rc, ctx);
        return {
          id: rc.client.id,
          name: rc.client.displayName,
          city: rc.client.city,
          greenAt: greenAt?.toISOString() ?? null,
        };
      });
    // Miesiąc liczony w czasie polskim — daty spoza miesiąca odpadają tutaj.
    const greens = clients.map((c) => (c.greenAt && localDay(new Date(c.greenAt), ctx.config.timeZone).startsWith(month) ? new Date(c.greenAt) : null));
    return {
      squadron: sq,
      active: squadronActiveAt(sq, ctx.now),
      clients,
      month: squadronPayout(sq, greens, new Date(0), ctx.now),
    };
  });
}
