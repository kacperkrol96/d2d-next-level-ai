"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import type { ContractTrack } from "@/lib/contracts/types";
import type { ContractScrollTheme } from "@/lib/config/types";
import { getDataSource } from "@/lib/data";
import { nextContractVersion } from "@/lib/domain/contract";

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
