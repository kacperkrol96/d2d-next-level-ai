/** Model Akademii — treści jako dane (docelowo edytowane w panelu admina / Supabase). */

export type AcademyTrack = "auditor" | "sales";

export interface Question {
  id: string;
  text: string;
  options: string[];
  /** Indeksy poprawnych odpowiedzi (więcej niż jedna = pytanie wielokrotnego wyboru). */
  correct: number[];
  /** Wyjaśnienie pokazywane po sprawdzeniu. */
  explanation: string;
}

export type Lesson =
  | { id: string; kind: "script"; title: string; minutes: number; sections: { heading: string; text: string }[] }
  | { id: string; kind: "objections"; title: string; minutes: number; items: { objection: string; answer: string; tip?: string }[] }
  | { id: string; kind: "video"; title: string; minutes: number; url: string | null; summary: string }
  | { id: string; kind: "quiz"; title: string; minutes: number; questions: Question[] };

export interface AcademyStage {
  id: string;
  track: AcademyTrack;
  order: number;
  title: string;
  description: string;
  lessons: Lesson[];
  exam: { questions: Question[] };
}

export interface ExamAttempt {
  stageId: string;
  /** Wynik 0–1. */
  score: number;
  passed: boolean;
  at: string;
  /** Odpowiedzi: id pytania → wybrane indeksy. */
  answers: Record<string, number[]>;
}

export interface AcademyProgress {
  userId: string;
  lessonsDone: string[];
  attempts: ExamAttempt[];
}
