// Po `npm run build`: sprawdza, że klucze egzaminów NIE trafiły do kodu wysyłanego do przeglądarki.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), ".next/static");
const canary = "NLE-EXAM-KEYS-7f3a9c";
const exams = readFileSync(join(process.cwd(), "src/lib/academy/exams.ts"), "utf8");
// Kilka wzorców odpowiedzi jako dodatkowe próbki.
const samples = [...exams.matchAll(/"modelAnswer": "([^"]{40,})"/g)].slice(0, 5).map((m) => m[1].slice(0, 40));

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let files;
try {
  files = walk(root).filter((f) => f.endsWith(".js"));
} catch {
  console.error("Brak .next/static — najpierw npm run build");
  process.exit(1);
}
const leaks = [];
for (const f of files) {
  const s = readFileSync(f, "utf8");
  if (s.includes(canary)) leaks.push(`${f}: znacznik kluczy`);
  for (const sample of samples) if (s.includes(sample)) leaks.push(`${f}: wzorzec odpowiedzi „${sample}…”`);
}
if (leaks.length) {
  console.error("KLUCZE ODPOWIEDZI W PACZCE PRZEGLĄDARKI:\n" + leaks.join("\n"));
  process.exit(1);
}
console.log(`OK — sprawdzono ${files.length} plików przeglądarki, brak kluczy egzaminów (${samples.length} próbek + znacznik).`);
