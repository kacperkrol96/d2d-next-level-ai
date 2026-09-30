import type { AppConfig } from "./types";
import { seedConfig } from "./seed";

/**
 * Jedyne miejsce, z którego aplikacja pobiera konfigurację biznesową.
 * Etap 0: dane startowe. Etap 1: odczyt z tabel Supabase (edycja przez admina).
 */
export async function getConfig(): Promise<AppConfig> {
  return seedConfig;
}

export type * from "./types";
