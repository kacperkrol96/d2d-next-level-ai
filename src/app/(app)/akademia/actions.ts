"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { completeLesson, submitExam } from "@/lib/services/academy";

export async function markLessonDone(formData: FormData) {
  const user = await requireUser();
  const next = await completeLesson(user, String(formData.get("stageId") ?? ""), String(formData.get("lessonId") ?? ""));
  revalidatePath("/akademia", "layout");
  redirect(next);
}

export async function sendExam(stageId: string, answers: Record<string, number[]>) {
  const user = await requireUser();
  const outcome = await submitExam(user, stageId, answers);
  revalidatePath("/akademia", "layout");
  return outcome;
}
