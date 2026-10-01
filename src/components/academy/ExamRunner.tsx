"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useState, useTransition } from "react";
import { sendExam } from "@/app/(app)/akademia/actions";
import { UnlockCelebration } from "./UnlockCelebration";
import type { ExamOutcome } from "@/lib/services/academy";

interface PublicQuestion {
  id: string;
  text: string;
  options: string[];
  multiple: boolean;
}

/** Egzamin: jedno pytanie na ekran, wynik sprawdzany automatycznie na serwerze. */
export function ExamRunner({ stageId, stageTitle, questions, backHref }: { stageId: string; stageTitle: string; questions: PublicQuestion[]; backHref: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [outcome, setOutcome] = useState<ExamOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, startTransition] = useTransition();

  const q = questions[index];
  const sel = answers[q?.id] ?? [];
  const last = index === questions.length - 1;

  const choose = (i: number) =>
    setAnswers((a) => ({ ...a, [q.id]: q.multiple ? (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]) : [i] }));

  const submit = () =>
    startTransition(async () => {
      const res = await sendExam(stageId, answers);
      if ("error" in res) return setError(res.error);
      setOutcome(res);
      if (res.result.passed && (res.unlocked || res.trackCompleted)) setCelebrate(true);
    });

  if (outcome) {
    const pct = Math.round(outcome.result.score * 100);
    return (
      <>
        <UnlockCelebration show={celebrate} title={outcome.unlocked?.title ?? null} trackCompleted={outcome.trackCompleted} onClose={() => setCelebrate(false)} />
        <div className="card p-6 text-center sm:p-8">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${outcome.result.passed ? "bg-earned/15 text-earned" : "bg-danger/15 text-danger"}`}>
            {outcome.result.passed ? <Check size={30} /> : <X size={30} />}
          </div>
          <div className="num mt-4 text-5xl font-semibold">{pct}%</div>
          <div className="mt-1 text-sm text-muted">
            {outcome.result.correctCount} z {outcome.result.total} poprawnych · próg {Math.round(outcome.threshold * 100)}%
          </div>
          <div className={`mt-3 text-lg ${outcome.result.passed ? "text-earned" : "text-danger"}`}>{outcome.result.passed ? "Egzamin zdany" : "Tym razem się nie udało"}</div>
          {outcome.unlocked && <div className="mt-1 text-sm text-gold">Odblokowany etap: {outcome.unlocked.title}</div>}
        </div>
        {outcome.mistakes.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {outcome.mistakes.map((m) => (
              <div key={m.question} className="card p-5">
                <div className="text-sm font-medium">{m.question}</div>
                <div className="mt-1 text-sm text-white/75">{m.explanation}</div>
              </div>
            ))}
          </div>
        )}
        <Link href={backHref} className="mt-6 flex w-full items-center justify-center rounded-[20px] bg-card-2 py-4 font-medium">
          Wróć do Akademii
        </Link>
      </>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>Egzamin · {stageTitle}</span>
        <span className="num">
          {index + 1}/{questions.length}
        </span>
      </div>
      <div className="mb-6 flex gap-1">
        {questions.map((x, i) => (
          <span key={x.id} className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-accent-soft" : i === index ? "bg-accent-soft/60" : "bg-white/[0.07]"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="card p-6"
        >
          <p className="num text-xl font-semibold leading-snug">{q.text}</p>
          {q.multiple && <p className="mt-1 text-xs text-muted">Zaznacz wszystkie poprawne</p>}
          <div className="mt-5 flex flex-col gap-2">
            {q.options.map((o, i) => (
              <button
                key={o}
                onClick={() => choose(i)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition ${sel.includes(i) ? "border-accent-soft bg-accent/15" : "border-line bg-card-2 hover:border-white/15"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${q.multiple ? "rounded-md" : "rounded-full"} border ${sel.includes(i) ? "border-accent-soft bg-accent-soft" : "border-white/30"}`}>
                  {sel.includes(i) && <Check size={12} strokeWidth={3} className="text-bg" />}
                </span>
                {o}
              </button>
            ))}
          </div>
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
            disabled={pending || questions.some((x) => !(answers[x.id]?.length))}
            className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium disabled:opacity-40"
          >
            {pending ? "Sprawdzam…" : "Wyślij egzamin"}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => i + 1)}
            disabled={sel.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium disabled:opacity-40"
          >
            Dalej <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
