import "server-only";
import { getDataSource } from "@/lib/data";
import type { AppConfig } from "./types";

/** Jedyne miejsce, z którego aplikacja pobiera konfigurację biznesową (przez źródło danych). */
export async function getConfig(): Promise<AppConfig> {
  return getDataSource().getConfig();
}

export type * from "./types";
