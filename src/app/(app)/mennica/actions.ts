"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { getDataSource } from "@/lib/data";
import { loadContext } from "@/lib/services/portfolio";

/**
 * Zarząd / Admin potwierdza handlowca z podpowiedzi (inicjały) — jedno kliknięcie.
 * Zapis w historii: kto, kiedy, poprzednia wartość.
 */
export async function confirmSalesPerson(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  if (!clientId || !employeeId) return;
  const ctx = await loadContext();
  const previous = ctx.clients.find((rc) => rc.client.id === clientId)?.salesId ?? null;
  await getDataSource().confirmSalesPerson({ clientId, employeeId, previousEmployeeId: previous, by: admin.id, at: new Date().toISOString() });
  revalidatePath("/", "layout");
}
