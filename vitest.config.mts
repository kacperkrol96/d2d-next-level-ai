import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // Testy działają „po stronie serwera” — tak jak Next z warunkiem react-server (moduły server-only są dozwolone).
  ssr: { resolve: { conditions: ["react-server"] } },
  test: { include: ["src/**/*.test.ts"], server: { deps: { inline: ["server-only"] } } },
});
