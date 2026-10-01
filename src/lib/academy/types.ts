/** Model Akademii — treści jako dane (docelowo edytowane w panelu admina / Supabase). */

/** Ścieżka terenowa D1–D4 (audytor i handlowiec) oraz osobna ścieżka managera. */
export type AcademyTrack = "field" | "manager";

export type Lesson =
  /** Lekcja do czytania (Markdown z docs/tresci, oczyszczony). */
  | { id: string; kind: "reading"; title: string; minutes: number; content: string }
  /** Aktualny kontrakt osoby (audytor / handlowiec) — ta sama wersja co na zwoju. */
  | { id: string; kind: "contract"; title: string; minutes: number }
  /** Film z firmowego YouTube (niepubliczny) — link przypisuje admin; zaliczenie po obejrzeniu części z ustawień. */
  | { id: string; kind: "video"; title: string; minutes: number; videoKey: string; summary: string }
  /** Szablon planu 90 dni (Launch Pad) dla managera. */
  | { id: string; kind: "launchpad"; title: string; minutes: number };

export type FormId = "d2-scenki" | "d3" | "d4";

/** Co trzeba zaliczyć, by zamknąć etap. */
export type Gate =
  | { kind: "exam"; examId: string }
  /** Karta wypełniana przez managera; `passDecision` = decyzja zaliczająca (brak = samo wypełnienie). */
  | { kind: "form"; formId: FormId; label: string; passDecision: string | null };

export interface AcademyStage {
  id: string;
  track: AcademyTrack;
  order: number;
  /** Krótki znacznik etapu, np. „D1”. */
  code: string;
  title: string;
  description: string;
  lessons: Lesson[];
  gates: Gate[];
}

/** Pytanie egzaminu Z KLUCZEM — tylko serwer (exams.ts). */
export interface ExamQuestionDef {
  id: string;
  type: "choice" | "text";
  text: string;
  /** Punkty za pytanie (0 = pytanie dla managera, niepunktowane). */
  points: number;
  options: string[] | null;
  items: string[] | null;
  /** Klucz: indeks poprawnej odpowiedzi (pytania zamknięte). */
  correctIndex: number | null;
  /** Wzorzec odpowiedzi dla managera (pytania otwarte). */
  modelAnswer: string | null;
  correctOrder?: number[];
}

export interface ExamDef {
  id: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number | null;
  questions: ExamQuestionDef[];
}

/** Pytanie egzaminu bez klucza — tylko to trafia do przeglądarki. */
export interface PublicQuestion {
  id: string;
  type: "choice" | "text";
  text: string;
  points: number;
  options: string[] | null;
  /** Elementy do ułożenia (zadania „kolejność”). */
  items: string[] | null;
}

export interface PublicExam {
  id: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number | null;
  maxPoints: number;
  passPoints: number;
  /** Tryb próbny — klucze niezweryfikowane. */
  trial: boolean;
  questions: PublicQuestion[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  stageId: string;
  at: string;
  /** Odpowiedzi: indeks (pytanie zamknięte) albo tekst (otwarte). */
  answers: Record<string, number | string>;
  /** Punkty za pytania zamknięte (sprawdzone automatycznie na serwerze). */
  autoPoints: number;
  /** Punkty managera za pytania otwarte (null = czeka na ocenę). */
  review: { points: Record<string, number>; comment: string; by: string; at: string } | null;
  /** Suma punktów (null = czeka na ocenę managera). */
  points: number | null;
  passed: boolean | null;
  /** Egzamin próbny (klucze niezweryfikowane) — wynik nie odblokowuje etapu. */
  trial?: boolean;
}

/** Karta wypełniona przez managera (scenki D2, obserwacje D3/D4). */
export interface FormSubmission {
  formId: FormId;
  personId: string;
  by: string;
  at: string;
  values: Record<string, string>;
  /** Suma punktów (karty punktowane). */
  score: number | null;
  decision: string | null;
}

export interface AcademyProgress {
  userId: string;
  lessonsDone: string[];
  /** Obejrzana część filmu (0–1) — rejestr w Wieży. */
  videoWatched: Record<string, number>;
  attempts: ExamAttempt[];
  forms: FormSubmission[];
}
