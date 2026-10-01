import "server-only";
import type { AppUser } from "@/lib/auth/users";
import type { ContractVersion } from "@/lib/contracts/types";
import { getDataSource } from "@/lib/data";
import { needsAcceptance, validateAcceptance } from "@/lib/domain/contract";

/** Kontrakt do (ponownej) akceptacji przez osobę — null, gdy wszystko zaakceptowane albo osoba bez ścieżki (zarząd). */
export async function pendingContract(user: AppUser): Promise<{ contract: ContractVersion; previousAccepted: number | null } | null> {
  if (!user.track) return null;
  const source = getDataSource();
  const [versions, acceptances] = await Promise.all([source.contractVersions(user.track), source.contractAcceptances()]);
  const contract = needsAcceptance(user.id, user.track, versions, acceptances);
  if (!contract) return null;
  const mine = acceptances.filter((a) => a.userId === user.id && a.track === user.track).map((a) => a.version);
  return { contract, previousAccepted: mine.length ? Math.max(...mine) : null };
}

export async function acceptPendingContract(user: AppUser, input: { version: number; signature: string }, now = new Date()): Promise<string | null> {
  const pending = await pendingContract(user);
  if (!pending || !user.track) return null;
  const error = validateAcceptance(pending.contract, input);
  if (error) return error;
  await getDataSource().acceptContract({ userId: user.id, track: user.track, version: input.version, acceptedAt: now.toISOString(), signature: input.signature });
  return null;
}
