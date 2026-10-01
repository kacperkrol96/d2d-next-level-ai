import "server-only";
import { MockDataSource } from "./mock";
import type { DataSource } from "./types";

let instance: DataSource | null = null;

/**
 * Wybór źródła danych. Dziś: dane testowe. Po podłączeniu bazy:
 * DATA_SOURCE=supabase → SupabaseDataSource (ten sam interfejs, ekrany bez zmian).
 */
export function getDataSource(): DataSource {
  if (instance) return instance;
  if (process.env.DATA_SOURCE === "supabase") {
    throw new Error("Źródło Supabase zostanie dodane w etapie „Dostępy” — ustaw DATA_SOURCE=mock albo usuń zmienną.");
  }
  instance = new MockDataSource();
  return instance;
}

export type * from "./types";
