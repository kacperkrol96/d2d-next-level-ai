"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { acceptPendingContract } from "@/lib/services/contract";

export async function acceptContract(formData: FormData) {
  const user = await requireUser();
  const version = Number(formData.get("version"));
  const signature = String(formData.get("signature") ?? "");
  const error = await acceptPendingContract(user, { version, signature });
  if (error) redirect(`/kontrakt?blad=${encodeURIComponent(error)}`);
  redirect("/kokpit");
}
