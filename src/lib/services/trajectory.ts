import "server-only";
import type { AppUser } from "@/lib/auth/users";
import type { Trajectory } from "@/lib/domain/trajectory";
import { getOrbitData } from "./orbit";
import { loadContext, officeMoves, trajectoriesOf, type CommissionEntry, type PortfolioContext } from "./portfolio";

export interface ClientTrajectoryView {
  clientId: string;
  clientName: string;
  city: string;
  crmUrl: string;
  /** Prowizja osoby przy tym kliencie (jeśli jest). */
  commission: CommissionEntry | null;
  trajectories: (Trajectory & { scopeLabel: string | null })[];
  issues: string[];
  lastChangeAt: string | null;
}

export interface OfficeMove {
  agreementNumber: string;
  clientId: string;
  clientName: string;
  from: string | null;
  to: string;
  at: string;
}

async function views(user: AppUser, ctx: PortfolioContext): Promise<ClientTrajectoryView[]> {
  if (!user.crmEmployeeId || !user.track) return [];
  const orbit = await getOrbitData(user, ctx.now, ctx);
  const byClient = new Map((orbit?.earnings.entries ?? []).map((e) => [e.clientId, e]));
  return trajectoriesOf(user.crmEmployeeId, user.track, ctx)
    .map(({ client, trajectories }) => ({
      clientId: client.client.id,
      clientName: client.client.displayName,
      city: client.client.city,
      crmUrl: client.client.crmUrl,
      commission: byClient.get(client.client.id) ?? null,
      trajectories: trajectories.map((t, i) => ({ ...t, scopeLabel: client.agreements[i].scopeLabel })),
      issues: client.issues.map((i) => i.message),
      lastChangeAt: trajectories.map((t) => t.currentAt).filter((x): x is string => !!x).sort().at(-1) ?? null,
    }))
    .sort((a, b) => (b.lastChangeAt ?? "").localeCompare(a.lastChangeAt ?? ""));
}

/** „Moje umowy” — wszyscy klienci osoby z drogą przez statusy. */
export async function getMyTrajectories(user: AppUser): Promise<ClientTrajectoryView[]> {
  return views(user, await loadContext());
}

/** Trajektoria jednego klienta — tylko jeśli to klient tej osoby. */
export async function getClientTrajectory(user: AppUser, clientId: string): Promise<ClientTrajectoryView | null> {
  return (await getMyTrajectories(user)).find((v) => v.clientId === clientId) ?? null;
}

/** Ruchy biura (zmiany statusów) u klientów osoby z ostatnich `days` dni. */
export async function getOfficeMoves(user: AppUser, days: number, context?: PortfolioContext): Promise<OfficeMove[]> {
  if (!user.crmEmployeeId || !user.track) return [];
  const ctx = context ?? (await loadContext());
  const since = new Date(ctx.now.getTime() - days * 24 * 60 * 60 * 1000);
  return officeMoves(user.crmEmployeeId, user.track, since, ctx).map((m) => ({
    agreementNumber: m.number,
    clientId: m.clientId,
    clientName: m.clientName,
    from: m.from,
    to: m.to,
    at: m.at,
  }));
}
