"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import type { CardReason } from "@/lib/config/types";
import { addDiscipline, changeAuditorPlan, decideFiveStar, type DisciplineInput } from "@/lib/services/tower";

const back = (res: { error: string } | { ok: true }, ok: string, anchor: string) => {
  revalidatePath("/", "layout");
  redirect(`/wieza?${"error" in res ? `blad=${encodeURIComponent(res.error)}` : `ok=${encodeURIComponent(ok)}`}#${anchor}`);
};

export async function issueDiscipline(formData: FormData) {
  const user = await requireRole(["sales", "manager", "admin"]);
  const personId = String(formData.get("personId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const note = String(formData.get("note") ?? "");
  const input: DisciplineInput =
    kind === "late" || kind === "absence" ? { kind, note } : { kind: "yellow", reason: kind as CardReason, note };
  const res = await addDiscipline(user, personId, input);
  back(res, kind === "late" ? "Zapisano spóźnienie" : kind === "absence" ? "Zapisano nieobecność" : "Żółta kartka nadana", "kartki");
}

export async function setAuditorPlan(formData: FormData) {
  const user = await requireRole(["sales", "manager", "admin"]);
  const plan = String(formData.get("plan")) === "nextLevel" ? "nextLevel" : "safety";
  const res = await changeAuditorPlan(user, String(formData.get("personId") ?? ""), plan, String(formData.get("reason") ?? ""), formData.get("temporary") === "1");
  back(res, plan === "nextLevel" ? "Przejście na Next Level zapisane" : "Czasowy powrót na Safety zapisany", "system");
}

export async function judgeReview(formData: FormData) {
  const user = await requireRole(["sales", "manager", "admin"]);
  const decision = String(formData.get("decision")) === "approved" ? "approved" : "rejected";
  const res = await decideFiveStar(user, String(formData.get("reviewId") ?? ""), decision, String(formData.get("reason") ?? ""));
  back(res, decision === "approved" ? "Opinia zatwierdzona — liczy się do KPI" : "Opinia odrzucona", "opinie");
}
