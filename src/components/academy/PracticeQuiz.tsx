"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { Question } from "@/lib/academy/types";

/** Quiz ćwiczeniowy — natychmiastowa informacja zwrotna, nie wpływa na odblokowanie. */
export function PracticeQuiz({ questions }: { questions: Question[] }) {
  const [chosen, setChosen] = useState<Record<string, number[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q) => {
        const multi = q.correct.length > 1;
        const sel = chosen[q.id] ?? [];
        const done = checked[q.id];
        const ok = done && sel.length === q.correct.length && q.correct.every((c) => sel.includes(c));
        return (
          <div key={q.id} className="card p-5 sm:p-6">
            <p className="num text-lg font-semibold">{q.text}</p>
            {multi && <p className="mt-1 text-xs text-muted">Zaznacz wszystkie poprawne</p>}
            <div className="mt-4 flex flex-col gap-2">
              {q.options.map((o, i) => {
                const isSel = sel.includes(i);
                const isCorrect = q.correct.includes(i);
                const tone = !done ? (isSel ? "border-accent-soft bg-accent/15" : "border-line bg-card-2") : isCorrect ? "border-earned/60 bg-earned/10" : isSel ? "border-danger/60 bg-danger/10" : "border-line bg-card-2 opacity-60";
                return (
                  <button
                    key={o}
                    disabled={done}
                    onClick={() => setChosen((c) => ({ ...c, [q.id]: multi ? (isSel ? sel.filter((x) => x !== i) : [...sel, i]) : [i] }))}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${tone}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {!done ? (
              <button
                disabled={sel.length === 0}
                onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}
                className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-medium disabled:opacity-40"
              >
                Sprawdź
              </button>
            ) : (
              <div className={`mt-4 flex gap-2 rounded-2xl px-4 py-3 text-sm ${ok ? "bg-earned/10 text-earned" : "bg-danger/10 text-danger"}`}>
                {ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <X size={16} className="mt-0.5 shrink-0" />}
                <span className="text-white/85">{q.explanation}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
