import { describe, expect, it } from "vitest";
import { academyStages } from "@/lib/academy/content";
import { forms } from "@/lib/academy/forms";
import type { AcademyProgress, AcademyStage, ExamAttempt, ExamDef, FormSubmission } from "@/lib/academy/types";
import { seedConfig as config } from "@/lib/config/seed";
import { applyReview, gradeClosed, maxPoints, newAttempt, passPoints, retryAvailableAt, sanitizeAnswers, scoreForm, stageStatuses, toPublicExam, trackProgress, validateExam } from "../academy";

const rules = config.academy;
const now = new Date("2026-10-01T12:00:00Z");

const exam: ExamDef = {
  id: "t",
  title: "Test",
  instructions: "",
  timeLimitMinutes: null,
  questions: [
    { id: "c1", type: "choice", text: "1", points: 1, options: ["a", "b"], items: null, correctIndex: 1, modelAnswer: null },
    { id: "c2", type: "choice", text: "2", points: 1, options: ["a", "b", "c"], items: null, correctIndex: 0, modelAnswer: null },
    { id: "o1", type: "text", text: "3", points: 3, options: null, items: null, correctIndex: null, modelAnswer: "wzór" },
    { id: "o2", type: "text", text: "4", points: 0, options: null, items: null, correctIndex: null, modelAnswer: "dla managera" },
  ],
};
const closedOnly: ExamDef = { ...exam, id: "co", questions: exam.questions.slice(0, 2) };

const stage = (id: string, order: number, gates: AcademyStage["gates"], lessons = 1): AcademyStage => ({
  id,
  track: "field",
  order,
  code: id.toUpperCase(),
  title: id,
  description: "",
  lessons: Array.from({ length: lessons }, (_, i) => ({ id: `${id}-l${i + 1}`, kind: "reading" as const, title: "", minutes: 1, content: "x" })),
  gates,
});
const progress = (o: Partial<AcademyProgress> = {}): AcademyProgress => ({ userId: "u", lessonsDone: [], videoWatched: {}, attempts: [], forms: [], ...o });
const attempt = (o: Partial<ExamAttempt>): ExamAttempt => ({ id: "a", examId: "t", stageId: "s1", at: "2026-09-30T10:00:00Z", answers: {}, autoPoints: 0, review: null, points: null, passed: null, ...o });
const form = (formId: FormSubmission["formId"], decision: string | null, at = "2026-09-30T10:00:00Z"): FormSubmission => ({ formId, personId: "u", by: "m", at, values: {}, score: null, decision });

describe("egzamin: zamknięte sprawdza serwer, otwarte ocenia manager", () => {
  it("punkty i próg z ustawień (80% w górę)", () => {
    expect(maxPoints(exam)).toBe(5);
    expect(passPoints(exam, rules)).toBe(4);
    expect(passPoints({ ...exam, id: "manager" }, rules)).toBe(4); // 70% z 5 = 3,5 → 4
    expect(passPoints(exam, { ...rules, passThreshold: 0.6 })).toBe(3);
  });

  it("pytania zamknięte: tylko dokładnie poprawny indeks", () => {
    expect(gradeClosed(exam, { c1: 1, c2: 0 }).autoPoints).toBe(2);
    expect(gradeClosed(exam, { c1: 0, c2: "0" }).autoPoints).toBe(0);
  });

  it("odpowiedzi czyszczone: obce pytania i złe formaty odrzucone", () => {
    expect(sanitizeAnswers(exam, { c1: 1, c2: 9, o1: "  tekst ", x: 1, o2: 5 })).toEqual({ c1: 1, o1: "tekst" });
  });

  it("egzamin z otwartymi pytaniami czeka na ocenę managera", () => {
    const a = newAttempt(exam, "s1", { c1: 1, c2: 0, o1: "odp" }, rules, now, "id1");
    expect(a).toMatchObject({ autoPoints: 2, points: null, passed: null, review: null });
  });

  it("egzamin tylko z zamkniętymi — wynik od razu", () => {
    expect(newAttempt(closedOnly, "s1", { c1: 1, c2: 0 }, rules, now, "x")).toMatchObject({ points: 2, passed: true });
    expect(newAttempt(closedOnly, "s1", { c1: 1 }, rules, now, "x")).toMatchObject({ points: 1, passed: false });
  });

  it("ocena managera: zakres 0–max, wszystkie punktowane otwarte, wynik i zaliczenie", () => {
    const a = newAttempt(exam, "s1", { c1: 1, c2: 0, o1: "odp" }, rules, now, "id1");
    const meta = { comment: " ok ", by: "m", at: now };
    expect(applyReview(exam, a, {}, meta, rules)).toEqual({ error: "Oceń wszystkie punktowane pytania otwarte" });
    expect(applyReview(exam, a, { o1: 4 }, meta, rules)).toHaveProperty("error");
    expect(applyReview(exam, a, { o1: 2 }, meta, rules)).toMatchObject({ points: 4, passed: true, review: { comment: "ok", by: "m" } });
    expect(applyReview(exam, a, { o1: 1 }, meta, rules)).toMatchObject({ points: 3, passed: false });
    const done = applyReview(exam, a, { o1: 2 }, meta, rules) as ExamAttempt;
    expect(applyReview(exam, done, { o1: 3 }, meta, rules)).toEqual({ error: "To podejście jest już ocenione" });
  });

  it("przerwa po niezdanym egzaminie liczona od oceny managera", () => {
    const failed = attempt({ passed: false, review: { points: {}, comment: "", by: "m", at: "2026-10-01T11:50:00Z" } });
    expect(retryAvailableAt(failed, rules)?.toISOString()).toBe("2026-10-01T12:20:00.000Z");
    expect(retryAvailableAt(attempt({ passed: null }), rules)).toBeNull();
  });
});

describe("etapy: bramki egzaminu i kart managera", () => {
  const stages = [
    stage("s1", 1, [{ kind: "exam", examId: "t" }], 2),
    stage("s2", 2, [
      { kind: "exam", examId: "t2" },
      { kind: "form", formId: "d2-scenki", label: "Scenka", passDecision: "Gotowy do D3" },
    ]),
    stage("s3", 3, [{ kind: "form", formId: "d3", label: "D3", passDecision: null }], 0),
  ];
  const states = (p: AcademyProgress) => stageStatuses(stages, p, rules, now).map((s) => s.state);

  it("na starcie otwarty tylko pierwszy etap; egzamin po lekcjach", () => {
    expect(states(progress())).toEqual(["available", "locked", "locked"]);
    expect(stageStatuses(stages, progress({ lessonsDone: ["s1-l1"] }), rules, now)[0].gates[0].state).toBe("locked");
    expect(stageStatuses(stages, progress({ lessonsDone: ["s1-l1", "s1-l2"] }), rules, now)[0].gates[0].state).toBe("open");
  });

  it("egzamin czeka na ocenę → etap nie zaliczony; po zaliczeniu otwiera kolejny", () => {
    const base = { lessonsDone: ["s1-l1", "s1-l2"] };
    expect(stageStatuses(stages, progress({ ...base, attempts: [attempt({})] }), rules, now)[0].gates[0].state).toBe("review");
    expect(states(progress({ ...base, attempts: [attempt({ passed: true, points: 5 })] }))).toEqual(["passed", "available", "locked"]);
  });

  it("D2: egzamin + scenka z decyzją „Gotowy do D3”; inna decyzja = powtórka", () => {
    const base = {
      lessonsDone: ["s1-l1", "s1-l2", "s2-l1"],
      attempts: [attempt({ passed: true, points: 5 }), attempt({ id: "b", examId: "t2", stageId: "s2", passed: true, points: 5 })],
    };
    expect(states(progress(base))).toEqual(["passed", "available", "locked"]);
    const more = stageStatuses(stages, progress({ ...base, forms: [form("d2-scenki", "Potrzebuje dodatkowej scenki")] }), rules, now);
    expect(more[1].gates[1].state).toBe("needs_more");
    expect(states(progress({ ...base, forms: [form("d2-scenki", "Potrzebuje dodatkowej scenki"), form("d2-scenki", "Gotowy do D3", "2026-09-30T12:00:00Z")] }))).toEqual([
      "passed",
      "passed",
      "available",
    ]);
  });

  it("D3: karta wypełniona przez managera zalicza etap; postęp liczy lekcje i bramki", () => {
    const p = progress({
      lessonsDone: ["s1-l1", "s1-l2", "s2-l1"],
      attempts: [attempt({ passed: true, points: 5 }), attempt({ id: "b", examId: "t2", stageId: "s2", passed: true, points: 5 })],
      forms: [form("d2-scenki", "Gotowy do D3"), form("d3", null)],
    });
    const st = stageStatuses(stages, p, rules, now);
    expect(st.map((s) => s.state)).toEqual(["passed", "passed", "passed"]);
    expect(trackProgress(st)).toBe(1);
  });
});

describe("karty managera", () => {
  const d2 = forms.find((f) => f.id === "d2-scenki")!;
  it("scenka D2: 14 ocen 1–5, suma maks. 70, wszystkie wymagane", () => {
    const scales = d2.sections.flatMap((s) => s.items).filter((i) => i.type === "scale");
    expect(scales).toHaveLength(14);
    const all = Object.fromEntries(scales.map((i) => [i.id, "4"]));
    expect(scoreForm(d2, all)).toEqual({ score: 56, max: 70, missing: [] });
    expect(scoreForm(d2, {}).missing).toHaveLength(14);
  });
  it("karty D3 i D4 bez punktacji; D4 z decyzją managera", () => {
    expect(forms.find((f) => f.id === "d3")!.decision).toBeNull();
    expect(forms.find((f) => f.id === "d4")!.decision?.pass).toMatch(/Ignition/);
  });
});

describe("treści Akademii", () => {
  it("ścieżka terenowa D1–D4 i ścieżka managera", () => {
    expect(academyStages.filter((s) => s.track === "field").map((s) => s.code)).toEqual(["D1", "D2", "D3", "D4"]);
    expect(academyStages.filter((s) => s.track === "manager").map((s) => s.code)).toEqual(["M1", "M2"]);
  });

  it("filmy: 02 → R1, 03 → bank D2D, 04–12 → R2, 13 → przyjazd na audyt", () => {
    const d2 = academyStages.find((s) => s.id === "d2")!.lessons;
    const keyAfter = (lessonId: string) => {
      const i = d2.findIndex((l) => l.id === lessonId);
      return d2.slice(i + 1).filter((l) => l.kind === "video").map((l) => (l.kind === "video" ? l.videoKey : ""));
    };
    expect(keyAfter("d2-r1")[0]).toBe("02");
    expect(keyAfter("d2-bank-d2d")[0]).toBe("03");
    expect(keyAfter("d2-r2").slice(0, 9)).toEqual(["04", "05", "06", "07", "08", "09", "10", "11", "12"]);
    expect(keyAfter("d2-bank-przyjazd")[0]).toBe("13");
  });

  it("unikalne identyfikatory lekcji", () => {
    const ids = academyStages.flatMap((s) => [s.id, ...s.lessons.map((l) => l.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("egzaminy bez błędów w kluczu; publiczna wersja bez klucza", async () => {
    const { exams } = await import("@/lib/academy/exams");
    for (const e of exams) expect(validateExam(e)).toEqual([]);
    for (const e of exams) {
      const json = JSON.stringify(toPublicExam(e, rules));
      expect(json).not.toMatch(/correctIndex|modelAnswer|correctOrder/);
      for (const q of e.questions) if (q.modelAnswer) expect(json).not.toContain(q.modelAnswer);
    }
    expect(exams.map((e) => [e.id, maxPoints(e), passPoints(e, rules)])).toEqual([
      ["d1", 15, 12],
      ["d2", 19, 16],
      ["manager", 70, 49],
    ]);
  });
});

describe("linki do filmów", () => {
  it("id filmu z różnych postaci linku YouTube", async () => {
    const { youtubeIdFrom } = await import("../youtube");
    const id = "dQw4w9WgXcQ";
    for (const u of [id, `https://www.youtube.com/watch?v=${id}&t=3`, `https://youtu.be/${id}`, `https://www.youtube.com/embed/${id}`, `https://youtube.com/shorts/${id}`])
      expect(youtubeIdFrom(u)).toBe(id);
    expect(youtubeIdFrom("https://vimeo.com/123")).toBeNull();
    expect(youtubeIdFrom("nie link")).toBeNull();
  });
});

describe("treści lekcji zsynchronizowane z plikami .md", () => {
  it("lessons.generated.ts odpowiada src/content/akademia (inaczej: npm run content)", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { lessonTexts } = await import("@/lib/academy/lessons.generated");
    const dir = join(process.cwd(), "src/content/akademia");
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    expect(Object.keys(lessonTexts).sort()).toEqual(files.map((f) => f.replace(/\.md$/, "")).sort());
    for (const f of files) {
      const body = readFileSync(join(dir, f), "utf8").replace(/^<!--[\s\S]*?-->\s*/, "").trim();
      expect(lessonTexts[f.replace(/\.md$/, "")].body).toBe(body);
    }
  });
});
