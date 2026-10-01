// Składa lekcje Akademii (src/content/akademia/*.md) w moduł TS, żeby treści trafiały do builda bez czytania plików w czasie działania.
// Uruchom po każdej zmianie treści: npm run content
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src/content/akademia");
const out = join(process.cwd(), "src/lib/academy/lessons.generated.ts");
const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
const entries = files.map((f) => {
  const raw = readFileSync(join(dir, f), "utf8");
  const title = raw.match(/^<!--\s*title:\s*(.+?)\s*-->/)?.[1] ?? null;
  const body = raw.replace(/^<!--[\s\S]*?-->\s*/, "").trim();
  return [f.replace(/\.md$/, ""), { title, body }];
});
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const src = `// PLIK GENEROWANY — nie edytuj. Źródło: src/content/akademia/*.md, polecenie: npm run content\n\nexport const lessonTexts: Record<string, { title: string | null; body: string; minutes: number }> = ${JSON.stringify(
  Object.fromEntries(entries.map(([k, v]) => [k, { ...v, minutes: Math.max(2, Math.round(words(v.body) / 180)) }])),
  null,
  2,
)};\n`;
writeFileSync(out, src);
console.log(`Akademia: ${files.length} lekcji → ${out}`);
