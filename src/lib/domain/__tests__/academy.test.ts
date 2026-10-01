import { describe, expect, it } from "vitest";
import { academyStages } from "@/lib/academy/content";
import type { AcademyProgress, AcademyStage, Question } from "@/lib/academy/types";
import { seedConfig as config } from "@/lib/config/seed";
import { gradeExam, retryAvailableAt, stageStatuses, trackProgress, validateStage } from "../academy";

const rules = config.academy;
const q = (id: string, correct: number[]): Question => ({ id, text: id, options: ["a", "b", "c", "d"], correct, explanation: "" });
const stage = (id: string, order: number, lessons = 1): AcademyStage => ({
  id,
  track: "sales",
  order,
  title: id,
  description: "",
  lessons: Array.from({ length: lessons }, (_, i) => ({ id: `${id}-l${i + 1}`, kind: "script" as const, title: "", minutes: 1, sections: [] })),
  exam: { questions: [q(`${id}-e1`, [0])] },
});
const progress = (overrides: Partial<AcademyProgress> = {}): AcademyProgress => ({ userId: "u", lessonsDone: [], attempts: [], ...overrides });
const now = new Date("2026-10-01T12:00:00Z");

describe("automatyczne sprawdzanie egzaminu", () => {
  const questions = [q("1", [0]), q("2", [1]), q("3", [0, 2]), q("4", [3]), q("5", [2])];

  it("wynik i zaliczenie wg progu z ustawień (80%)", () => {
    const r = gradeExam(questions, { "1": [0], "2": [1], "3": [0, 2], "4": [3], "5": [0] }, rules);
    expect(r).toMatchObject({ correctCount: 4, total: 5, score: 0.8, passed: true });
    expect(gradeExam(questions, { "1": [0], "2": [1], "3": [0, 2] }, rules)).toMatchObject({ score: 0.6, passed: false });
  });

  it("wielokrotny wybór: tylko dokładnie ten sam zestaw (bez względu na kolejność)", () => {
    expect(gradeExam([q("3", [0, 2])], { "3": [2, 0] }, rules).passed).toBe(true);
    expect(gradeExam([q("3", [0, 2])], { "3": [0] }, rules).passed).toBe(false);
    expect(gradeExam([q("3", [0, 2])], { "3": [0, 1, 2] }, rules).passed).toBe(false);
  });

  it("brak odpowiedzi = błędna; zdublowane kliknięcia się nie liczą podwójnie", () => {
    expect(gradeExam([q("1", [0])], {}, rules).passed).toBe(false);
    expect(gradeExam([q("1", [0])], { "1": [0, 0] }, rules).passed).toBe(true);
  });

  it("próg z ustawień zmienia wynik", () => {
    const answers = { "1": [0], "2": [1], "3": [0, 2], "4": [0], "5": [0] }; // 3/5
    expect(gradeExam(questions, answers, rules).passed).toBe(false);
    expect(gradeExam(questions, answers, { ...rules, passThreshold: 0.6 }).passed).toBe(true);
  });
});

describe("odblokowywanie etapów", () => {
  const stages = [stage("s1", 1, 2), stage("s2", 2), stage("s3", 3)];

  it("na starcie otwarty tylko pierwszy etap", () => {
    expect(stageStatuses(stages, progress(), rules, now).map((s) => s.state)).toEqual(["available", "locked", "locked"]);
  });

  it("zdany egzamin odblokowuje kolejny etap", () => {
    const p = progress({ attempts: [{ stageId: "s1", score: 1, passed: true, at: "2026-09-30T10:00:00Z", answers: {} }] });
    expect(stageStatuses(stages, p, rules, now).map((s) => s.state)).toEqual(["passed", "available", "locked"]);
  });

  it("niezdany egzamin nie odblokowuje", () => {
    const p = progress({ attempts: [{ stageId: "s1", score: 0.5, passed: false, at: "2026-09-30T10:00:00Z", answers: {} }] });
    expect(stageStatuses(stages, p, rules, now)[1].state).toBe("locked");
  });

  it("egzamin dostępny po ukończeniu wszystkich lekcji etapu", () => {
    expect(stageStatuses(stages, progress({ lessonsDone: ["s1-l1"] }), rules, now)[0].examOpen).toBe(false);
    expect(stageStatuses(stages, progress({ lessonsDone: ["s1-l1", "s1-l2"] }), rules, now)[0].examOpen).toBe(true);
    expect(stageStatuses(stages, progress(), { ...rules, requireLessonsBeforeExam: false }, now)[0].examOpen).toBe(true);
  });

  it("przerwa po niezdanym egzaminie (minuty w ustawieniach)", () => {
    const failed = { stageId: "s1", score: 0.5, passed: false, at: "2026-10-01T11:50:00Z", answers: {} };
    const p = progress({ lessonsDone: ["s1-l1", "s1-l2"], attempts: [failed] });
    const st = stageStatuses(stages, p, rules, now)[0];
    expect(st.examOpen).toBe(false);
    expect(st.retryAt).toBe("2026-10-01T12:20:00.000Z");
    expect(stageStatuses(stages, p, rules, new Date("2026-10-01T12:21:00Z"))[0].examOpen).toBe(true);
    expect(retryAvailableAt(failed, { ...rules, retryCooldownMinutes: 0 })).toBeNull();
  });

  it("najlepszy wynik i postęp ścieżki", () => {
    const p = progress({
      lessonsDone: ["s1-l1", "s1-l2", "s2-l1"],
      attempts: [
        { stageId: "s1", score: 0.6, passed: false, at: "2026-09-29T10:00:00Z", answers: {} },
        { stageId: "s1", score: 1, passed: true, at: "2026-09-30T10:00:00Z", answers: {} },
      ],
    });
    const statuses = stageStatuses(stages, p, rules, now);
    expect(statuses[0].bestScore).toBe(1);
    // lekcje 4 + egzaminy 3 = 7 elementów; zrobione 3 lekcje + 1 egzamin
    expect(trackProgress(statuses)).toBeCloseTo(4 / 7);
  });
});

describe("treści Akademii", () => {
  it("obie ścieżki mają etapy z poprawnymi pytaniami", () => {
    expect(academyStages.some((s) => s.track === "sales")).toBe(true);
    expect(academyStages.some((s) => s.track === "auditor")).toBe(true);
    for (const s of academyStages) expect(validateStage(s)).toEqual([]);
  });

  it("identyfikatory lekcji i pytań są unikalne", () => {
    const ids = academyStages.flatMap((s) => [s.id, ...s.lessons.map((l) => l.id), ...s.exam.questions.map((x) => x.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("walidacja wyłapuje błędne pytanie", () => {
    const bad = { ...stage("x", 1), exam: { questions: [{ ...q("b", [5]), options: ["a"] }] } };
    expect(validateStage(bad)).toHaveLength(2);
  });
});
