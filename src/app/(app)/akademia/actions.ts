"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireUser } from "@/lib/auth/session";
import { completeLesson, recordVideoProgress, reviewAttempt, submitExam, submitForm } from "@/lib/services/academy";

export async function markLessonDone(formData: FormData) {
  const user = await requireUser();
  const next = await completeLesson(user, String(formData.get("stageId") ?? ""), String(formData.get("lessonId") ?? ""));
  revalidatePath("/akademia", "layout");
  redirect(next);
}

export async function reportVideo(stageId: string, lessonId: string, share: number) {
  const user = await requireUser();
  await recordVideoProgress(user, stageId, lessonId, share);
}

/** Odpowiedzi idą na serwer — tu (i tylko tu) są sprawdzane z kluczem. */
export async function sendExam(stageId: string, answers: Record<string, number | string>) {
  const user = await requireUser();
  const outcome = await submitExam(user, stageId, answers);
  revalidatePath("/akademia", "layout");
  return outcome;
}

export async function sendReview(formData: FormData) {
  const user = await requireRole(["manager", "admin"]);
  const personId = String(formData.get("personId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "");
  const points: Record<string, number> = {};
  for (const [k, v] of formData.entries()) if (k.startsWith("pts:") && String(v) !== "") points[k.slice(4)] = Number(v);
  const res = await reviewAttempt(user, personId, attemptId, points, String(formData.get("comment") ?? ""));
  if ("error" in res) redirect(`/akademia/zespol/${personId}/ocena/${attemptId}?blad=${encodeURIComponent(res.error ?? "")}`);
  revalidatePath("/akademia", "layout");
  redirect(`/akademia/zespol?ok=${encodeURIComponent(res.passed ? "Egzamin zaliczony" : "Ocena zapisana — egzamin niezaliczony")}`);
}

export async function sendForm(formData: FormData) {
  const user = await requireRole(["manager", "admin"]);
  const personId = String(formData.get("personId") ?? "");
  const formId = String(formData.get("formId") ?? "");
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (k.startsWith("f:") && String(v).trim()) values[k.slice(2)] = String(v).trim().slice(0, 2000);
  const decision = formData.get("decision") ? String(formData.get("decision")) : null;
  const res = await submitForm(user, personId, formId, values, decision);
  if ("error" in res) redirect(`/akademia/zespol/${personId}/karta/${formId}?blad=${encodeURIComponent(res.error ?? "")}`);
  revalidatePath("/akademia", "layout");
  redirect(`/akademia/zespol?ok=${encodeURIComponent("Karta zapisana")}`);
}
