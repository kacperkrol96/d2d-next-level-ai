import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/config/types";
import { findDemoUser, type AppUser } from "./users";

export const SESSION_COOKIE = "nle_demo_session";

/**
 * Etap 0: logowanie testowe (wybór osoby). Etap 1: sesja Supabase
 * (Google Workspace) — ten plik będzie jedynym miejscem do podmiany.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const store = await cookies();
  return findDemoUser(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: readonly Role[]): Promise<AppUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/kokpit");
  return user;
}
