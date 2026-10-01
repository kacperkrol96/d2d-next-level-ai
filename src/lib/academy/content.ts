import { lessonTexts } from "./lessons.generated";
import type { AcademyStage, Lesson } from "./types";

/**
 * Akademia — struktura ścieżek (treści lekcji: src/content/akademia, egzaminy: exams.ts — tylko serwer).
 * Ścieżka terenowa D1–D4 dla audytorów i handlowców + osobna ścieżka managera.
 */

const reading = (id: string, slug: string, title?: string): Lesson => {
  const t = lessonTexts[slug];
  if (!t) throw new Error(`Brak treści lekcji „${slug}” — uruchom npm run content`);
  return { id, kind: "reading", title: title ?? t.title ?? slug, minutes: t.minutes, content: slug };
};

const video = (key: string, title: string, summary: string): Lesson => ({ id: `film-${key}`, kind: "video", title, minutes: 5, videoKey: key, summary });

/** Filmy 04–12 → R2 (6 tajemnic), w kolejności. */
const r2Videos = Array.from({ length: 9 }, (_, i) => {
  const key = String(4 + i).padStart(2, "0");
  return video(key, `R2 — film ${i + 1} z 9`, "Audyt w domu klienta: 6 tajemnic krok po kroku.");
});

export const academyStages: AcademyStage[] = [
  {
    id: "d1",
    track: "field",
    order: 1,
    code: "D1",
    title: "Fundament",
    description: "Kontrakt, system wynagrodzeń, prezentacja Czyste Powietrze",
    lessons: [
      { id: "d1-kontrakt", kind: "contract", title: "Twój kontrakt", minutes: 8 },
      reading("d1-wynagrodzenia", "system-wynagrodzen", "System wynagrodzeń i awansów"),
      reading("d1-prezentacja", "prezentacja-cp", "Prezentacja Czyste Powietrze"),
    ],
    gates: [{ kind: "exam", examId: "d1" }],
  },
  {
    id: "d2",
    track: "field",
    order: 2,
    code: "D2",
    title: "Skrypty i obiekcje",
    description: "R1, R2, banki obiekcji, scenariusze — egzamin i scenka z managerem",
    lessons: [
      reading("d2-r1", "r1", "Skrypt R1 — pukanie (D2D)"),
      video("02", "R1 — film", "Pukanie od drzwi do drzwi: wzorcowe wykonanie skryptu R1."),
      reading("d2-bank-d2d", "bank-d2d", "Bank obiekcji D2D"),
      video("03", "Bank obiekcji D2D — film", "Odbijanie obiekcji przy drzwiach."),
      reading("d2-r2", "r2", "Skrypt R2 — audyt (6 tajemnic)"),
      ...r2Videos,
      reading("d2-r2-slowna", "r2-slowna", "Skrypt R2 — wersja słowna"),
      reading("d2-bank-przyjazd", "bank-przyjazd", "Bank obiekcji — przyjazd na audyt"),
      video("13", "Przyjazd na audyt — film", "Obiekcje w drzwiach w dniu audytu."),
      reading("d2-scena-wzorcowa", "scena-wzorcowa", "Scena: umówienie (wzorcowa)"),
      reading("d2-scena-opor", "scena-opor", "Scena: umówienie (z oporem)"),
      reading("d2-scenariusze", "scenariusze-handlowiec", "Scenariusze"),
    ],
    gates: [
      { kind: "exam", examId: "d2" },
      { kind: "form", formId: "d2-scenki", label: "Scenka z managerem", passDecision: "Gotowy do D3" },
    ],
  },
  {
    id: "d3",
    track: "field",
    order: 3,
    code: "D3",
    title: "Teren z seniorem",
    description: "Shadowing — kartę obserwacji wypełnia manager w aplikacji",
    lessons: [reading("d3-prospecting", "prospecting", "Prospecting terenu"), reading("d3-walkthrough", "walkthrough", "Walkthrough — wybór terenu")],
    gates: [{ kind: "form", formId: "d3", label: "Karta obserwacji D3", passDecision: null }],
  },
  {
    id: "d4",
    track: "field",
    order: 4,
    code: "D4",
    title: "Pierwszy dzień audytowy",
    description: "Obserwacja i samodzielny audyt — decyzja managera o starcie Ignition",
    lessons: [],
    gates: [{ kind: "form", formId: "d4", label: "Karta obserwacji D4", passDecision: "Gotowy na samodzielność — start Ignition" }],
  },
  {
    id: "m1",
    track: "manager",
    order: 1,
    code: "M1",
    title: "Podręcznik Managera",
    description: "Prowadzenie ludzi, uczenie dorosłych, rytm pracy — egzamin managerski",
    lessons: ["podrecznik-1", "podrecznik-2", "podrecznik-3", "podrecznik-4", "podrecznik-5"].map((slug, i) => reading(`m1-${i + 1}`, slug)),
    gates: [{ kind: "exam", examId: "manager" }],
  },
  {
    id: "m2",
    track: "manager",
    order: 2,
    code: "M2",
    title: "Launch Pad 90 dni",
    description: "Szablon planu 90 dni dla nowego audytora",
    lessons: [{ id: "m2-launchpad", kind: "launchpad", title: "Launch Pad — plan 90 dni", minutes: 6 }],
    gates: [],
  },
];

/** Wszystkie filmy (klucz → tytuł) — do przypisania linków przez admina. */
export const academyVideos = academyStages.flatMap((s) => s.lessons.filter((l) => l.kind === "video").map((l) => ({ key: l.videoKey, title: l.title, stage: s.code })));
