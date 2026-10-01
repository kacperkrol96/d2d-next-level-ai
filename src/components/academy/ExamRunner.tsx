"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Hourglass, X } from "lucide-react";
import { useState, useTransition } from "react";
import { sendExam } from "@/app/(app)/akademia/actions";
import type { PublicExam } from "@/lib/academy/types";
import type { ExamOutcome } from "@/lib/services/academy";
import { UnlockCelebration } from "./UnlockCelebration";

const pts = (n: number) => `${String(n).replace(".", ",")} pkt`;

/**
 * Egzamin: jedno pytanie na ekran. Klucz odpowiedzi NIE jest w przeglądarce —
 * pytania zamknięte sprawdza serwer, otwarte ocenia manager.
 */
export function ExamRunner({ stageId, exam, backHref }: { stageId: string; exam: PublicExam; backHref: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [outcome, setOutcome] = useState<ExamOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, startTransition] = useTransition();
  const questions = exam.questions;

  const q = questions[index];
  const value = answers[q?.id];
  const answered = (x: (typeof questions)[number]) =>
    x.type === "choice" ? typeof answers[x.id] === "number" : x.points === 0 || String(answers[x.id] ?? "").trim().length > 0;
  const last = index === questions.length - 1;

  const submit = () =>
    startTransition(async () => {
      const res = await sendExam(stageId, answers);
      if ("error" in res) return setError(res.error);
      setOutcome(res);
      if (res.state === "passed" && !res.trial && (res.unlocked || res.trackCompleted)) setCelebrate(true);
    });

  if (outcome) {
    const review = outcome.state === "review";
    const passed = outcome.state === "passed";
    return (
      <>
        <UnlockCelebration show={celebrate} title={outcome.unlocked?.title ?? null} trackCompleted={outcome.trackCompleted} onClose={() => setCelebrate(false)} />
        <div className="card p-6 text-center sm:p-8">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${review ? "bg-gold/15 text-gold" : passed ? "bg-earned/15 text-earned" : "bg-danger/15 text-danger"}`}>
            {review ? <Hourglass size={28} /> : passed ? <Check size={30} /> : <X size={30} />}
          </div>
          <div className={`mt-4 text-lg ${review ? "text-gold" : passed ? "text-earned" : "text-danger"}`}>
            {review ? "Wysłane — czeka na ocenę managera" : passed ? "Egzamin zdany" : "Tym razem się nie udało"}
          </div>
          {outcome.closedTotal > 0 && (
            <div className="mt-2 text-sm text-muted">
              Pytania zamknięte: <span className="num text-white">{outcome.closedCorrect}/{outcome.closedTotal}</span> poprawnych ({pts(outcome.autoPoints)})
            </div>
          )}
          <div className="mt-1 text-xs text-muted">
            Próg zaliczenia: {pts(outcome.passPoints)} z {pts(outcome.maxPoints)}
            {review && " — odpowiedzi otwarte oceni manager"}
          </div>
          {outcome.trial && (
            <div className="mt-3 rounded-2xl bg-gold/10 px-4 py-2 text-xs text-gold">Egzamin próbny — wynik nie odblokowuje etapu (klucze odpowiedzi czekają na weryfikację).</div>
          )}
          {outcome.unlocked && <div className="mt-2 text-sm text-gold">Odblokowany etap: {outcome.unlocked.title}</div>}
        </div>
        {outcome.wrong.length > 0 && (
          <div className="mt-4 card p-5">
            <div className="mb-2 text-sm font-medium">Do powtórki (błędna odpowiedź):</div>
            <ul className="list-disc pl-5 text-sm text-white/75">
              {outcome.wrong.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <Link href={backHref} className="mt-6 flex w-full items-center justify-center rounded-[20px] bg-card-2 py-4 font-medium">
          Wróć do etapu
        </Link>
      </>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span className="truncate pr-3">{exam.title}</span>
        <span className="num shrink-0">
          {index + 1}/{questions.length}
        </span>
      </div>
      <div className="mb-6 flex gap-1">
        {questions.map((x, i) => (
          <span key={x.id} className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-accent-soft" : i === index ? "bg-accent-soft/60" : "bg-white/[0.07]"}`} />
        ))}
      </div>

      {exam.trial && (
        <p className="mb-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">Egzamin próbny — wynik nie odblokowuje etapu, dopóki Zarząd nie zweryfikuje kluczy odpowiedzi.</p>
      )}
      {index === 0 && <p className="mb-4 rounded-2xl bg-card-2 px-4 py-3 text-xs text-muted">{exam.instructions}</p>}

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="card p-6"
        >
          <p className="num text-lg font-semibold leading-snug sm:text-xl">{q.text}</p>
          <p className="mt-1 text-xs text-muted">
            {q.points > 0 ? pts(q.points) : "bez punktów — dla managera"} · {q.type === "choice" ? "jedna odpowiedź" : "odpowiedz własnymi słowami"}
          </p>
          {q.items && (
            <ul className="mt-4 flex flex-col gap-1.5 rounded-2xl bg-card-2 p-4 text-sm">
              {q.items.map((it, i) => (
                <li key={it}>
                  <span className="num mr-2 text-muted">{String.fromCharCode(65 + i)}.</span>
                  {it}
                </li>
              ))}
              <li className="mt-1 text-xs text-muted">Wpisz kolejność liter, np. „C, A, B…”, i krótko uzasadnij.</li>
            </ul>
          )}
          {q.type === "choice" && q.options ? (
            <div className="mt-5 flex flex-col gap-2">
              {q.options.map((o, i) => (
                <button
                  key={o}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition ${value === i ? "border-accent-soft bg-accent/15" : "border-line bg-card-2 hover:border-white/15"}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${value === i ? "border-accent-soft bg-accent-soft" : "border-white/30"}`}>
                    {value === i && <Check size={12} strokeWidth={3} className="text-bg" />}
                  </span>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={typeof value === "string" ? value : ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              rows={5}
              maxLength={4000}
              placeholder="Twoja odpowiedź…"
              className="mt-5 w-full rounded-2xl border border-line bg-card-2 px-4 py-3 text-sm outline-none focus:border-accent-soft"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="flex items-center gap-2 rounded-[20px] bg-card-2 px-5 py-4 text-sm disabled:opacity-30">
          <ArrowLeft size={16} /> Wstecz
        </button>
        {last ? (
          <button
            onClick={submit}
            disabled={pending || !questions.every(answered)}
            className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium disabled:opacity-40"
          >
            {pending ? "Wysyłam…" : "Wyślij egzamin"}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => i + 1)}
            disabled={!answered(q)}
            className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium disabled:opacity-40"
          >
            Dalej <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
