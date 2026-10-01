"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import type { ContractTrack } from "@/lib/contracts/types";
import type { ContractScrollTheme } from "@/lib/config/types";
import { getDataSource } from "@/lib/data";
import { academyStages, academyVideos } from "@/lib/academy/content";
import { nextContractVersion } from "@/lib/domain/contract";
import { toggleSquadron } from "@/lib/domain/squadron";
import { youtubeIdFrom } from "@/lib/domain/youtube";

const THEMES: ContractScrollTheme[] = ["parchment", "cyberpunk", "retro"];

export async function setContractTheme(formData: FormData) {
  await requireRole(["admin"]);
  const theme = String(formData.get("theme")) as ContractScrollTheme;
  if (!THEMES.includes(theme)) return;
  await getDataSource().updateConfig({ contractScrollTheme: theme });
  revalidatePath("/mennica/ustawienia");
}

/** Nowa wersja kontraktu — każdy użytkownik ścieżki zaakceptuje ją ponownie przy następnym wejściu. */
export async function publishContract(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const track = String(formData.get("track")) as ContractTrack;
  if (track !== "auditor" && track !== "sales") return;
  const source = getDataSource();
  const versions = await source.contractVersions(track);
  const next = nextContractVersion(versions, track, {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    by: admin.id,
    at: new Date(),
  });
  if ("error" in next) redirect(`/mennica/ustawienia?blad=${encodeURIComponent(next.error)}#kontrakt-${track}`);
  await source.publishContract(next);
  revalidatePath("/", "layout");
  redirect(`/mennica/ustawienia?ok=${encodeURIComponent(`Opublikowano wersję ${next.version}`)}#kontrakt-${track}`);
}

/** Admin przypisuje film z firmowego YouTube (niepubliczny) do lekcji. Pusty = atrapa. */
export async function setVideoLink(formData: FormData) {
  await requireRole(["admin"]);
  const key = String(formData.get("key") ?? "");
  const raw = String(formData.get("url") ?? "").trim();
  if (!academyVideos.some((v) => v.key === key)) return;
  const id = raw ? youtubeIdFrom(raw) : null;
  if (raw && !id) redirect(`/mennica/ustawienia?blad=${encodeURIComponent(`Film ${key}: to nie jest link do YouTube`)}#filmy`);
  await getDataSource().setVideoLink(key, id);
  revalidatePath("/", "layout");
  redirect(`/mennica/ustawienia?ok=${encodeURIComponent(id ? `Film ${key} przypisany` : `Film ${key}: przywrócono atrapę`)}#filmy`);
}

/** „Klucze zweryfikowane” per egzamin — dopóki wyłączone, egzamin działa w trybie próbnym. */
export async function setExamVerified(formData: FormData) {
  await requireRole(["admin"]);
  const examId = String(formData.get("examId") ?? "");
  const on = formData.get("on") === "1";
  const ids = academyStages.flatMap((s) => s.gates.flatMap((g) => (g.kind === "exam" ? [g.examId] : [])));
  if (!ids.includes(examId)) return;
  const source = getDataSource();
  const { academy } = await source.getConfig();
  await source.updateConfig({ academy: { ...academy, verifiedExams: { ...academy.verifiedExams, [examId]: on } } });
  revalidatePath("/", "layout");
  redirect(`/mennica/ustawienia?ok=${encodeURIComponent(on ? `Egzamin ${examId.toUpperCase()}: klucze zweryfikowane` : `Egzamin ${examId.toUpperCase()}: tryb próbny`)}#egzaminy`);
}

/** Eskadra: przełącznik admina (historia zostaje po wyłączeniu). */
export async function setSquadronActive(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const on = formData.get("on") === "1";
  const source = getDataSource();
  const sq = (await source.squadrons()).find((s) => s.id === id);
  if (!sq) return;
  await source.saveSquadron(toggleSquadron(sq, on, admin.id, new Date()));
  revalidatePath("/", "layout");
  redirect(`/mennica/ustawienia?ok=${encodeURIComponent(`${sq.name}: ${on ? "włączona" : "wyłączona (historia zostaje)"}`)}#eskadry`);
}
