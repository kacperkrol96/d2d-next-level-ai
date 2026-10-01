"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { getDataSource } from "@/lib/data";

/** Admin potwierdza handlowca z podpowiedzi (inicjały) — jedno kliknięcie, zapis w historii. */
export async function confirmSalesPerson(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  if (!clientId || !employeeId) return;
  await getDataSource().confirmSalesPerson(clientId, employeeId, admin.id);
  revalidatePath("/", "layout");
}
