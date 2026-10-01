import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * BEZPIECZEŃSTWO AKADEMII: klucze odpowiedzi nigdy nie trafiają do kodu wysyłanego na urządzenie.
 * Sprawdzamy graf importów wszystkich plików „use client” — żaden nie może (nawet pośrednio)
 * zaimportować modułu z kluczami. Akcje serwera („use server”) są granicą: do przeglądarki trafia tylko odwołanie.
 * Dodatkowo po buildzie `npm run check:bundle` szuka znacznika kluczy w paczce przeglądarki.
 */

const SRC = resolve(process.cwd(), "src");
const KEYS = join(SRC, "lib/academy/exams.ts");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mjs|js)$/.test(f) && !p.includes("__tests__") ? [p] : [];
  });
}

function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

/** Importy wartości (bez `import type` i `export type`). */
function valueImports(file: string): string[] {
  const src = readFileSync(file, "utf8");
  const specs: string[] = [];
  const re = /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g;
  for (const m of src.matchAll(re)) if (!m[2]) specs.push(m[3]);
  for (const m of src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) specs.push(m[1]);
  return specs;
}

const directive = (file: string, d: string) => new RegExp(`^\\s*["']${d}["']`).test(readFileSync(file, "utf8"));

function reachesKeys(start: string): string[] | null {
  const seen = new Set<string>();
  const stack: { file: string; path: string[] }[] = [{ file: start, path: [start] }];
  while (stack.length) {
    const { file, path } = stack.pop()!;
    if (file === KEYS) return path;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file !== start && directive(file, "use server")) continue;
    for (const spec of valueImports(file)) {
      const next = resolveImport(file, spec);
      if (next) stack.push({ file: next, path: [...path, next] });
    }
  }
  return null;
}

describe("bezpieczeństwo: klucze egzaminów tylko na serwerze", () => {
  const files = walk(SRC);
  const clientFiles = files.filter((f) => directive(f, "use client"));

  it("moduł kluczy jest oznaczony jako server-only i ma znacznik do kontroli paczki", () => {
    const src = readFileSync(KEYS, "utf8");
    expect(src.trimStart().startsWith('import "server-only"')).toBe(true);
    expect(src).toContain("EXAM_KEYS_CANARY");
  });

  it("są pliki „use client” do sprawdzenia", () => {
    expect(clientFiles.length).toBeGreaterThan(5);
  });

  it("żaden plik „use client” nie importuje (pośrednio) kluczy odpowiedzi", () => {
    const leaks = clientFiles.map((f) => reachesKeys(f)).filter((p): p is string[] => p !== null);
    expect(leaks.map((p) => p.map((x) => x.replace(SRC, "src")).join(" → "))).toEqual([]);
  });

  it("klucze nie są importowane nigdzie poza serwerowym źródłem danych", () => {
    const importers = files.filter((f) => f !== KEYS && valueImports(f).some((s) => resolveImport(f, s) === KEYS));
    expect(importers.map((f) => f.replace(SRC, "src"))).toEqual(["src/lib/data/mock.ts"]);
    expect(readFileSync(join(SRC, "lib/data/mock.ts"), "utf8")).toMatch(/^import "server-only"/);
  });

  it("strona egzaminu przekazuje do przeglądarki tylko wersję publiczną", () => {
    const page = readFileSync(join(SRC, "app/(app)/akademia/[stageId]/egzamin/page.tsx"), "utf8");
    expect(page).toContain("getExam(");
    expect(page).not.toMatch(/academyExam|exams"/);
  });
});
