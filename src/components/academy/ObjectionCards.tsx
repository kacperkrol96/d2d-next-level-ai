"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lightbulb, RotateCcw } from "lucide-react";
import { useState } from "react";

/** Bank obiekcji: dotknij karty, żeby zobaczyć odpowiedź (najpierw spróbuj sam). */
export function ObjectionCards({ items }: { items: { objection: string; answer: string; tip?: string }[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const reduce = useReducedMotion();
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item, i) => {
        const flipped = open.has(i);
        return (
          <button key={item.objection} onClick={() => toggle(i)} className="card relative min-h-44 p-5 text-left [perspective:1000px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={flipped ? "answer" : "objection"}
                initial={reduce ? { opacity: 0 } : { rotateY: -90, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex h-full flex-col"
              >
                {flipped ? (
                  <>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-earned">Odpowiedź</span>
                    <p className="mt-2 leading-relaxed text-white/90">{item.answer}</p>
                    {item.tip && (
                      <p className="mt-3 flex gap-2 text-xs text-gold">
                        <Lightbulb size={14} className="shrink-0" /> {item.tip}
                      </p>
                    )}
                    <span className="mt-auto flex items-center gap-1 pt-3 text-[11px] text-muted">
                      <RotateCcw size={11} /> dotknij, żeby wrócić
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-accent-soft">Klient mówi</span>
                    <p className="num mt-2 text-xl font-semibold leading-snug">„{item.objection}”</p>
                    <span className="mt-auto pt-3 text-[11px] text-muted">Pomyśl, co odpowiesz — potem dotknij karty</span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
