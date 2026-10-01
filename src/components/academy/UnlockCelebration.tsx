"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";

/** Zdany egzamin: zamek się otwiera, rozbłysk, nazwa odblokowanego etapu. */
export function UnlockCelebration({ show, title, trackCompleted, onClose }: { show: boolean; title: string | null; trackCompleted: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {!reduce && (
            <motion.div
              className="absolute h-72 w-72 rounded-full bg-gold/30 blur-3xl"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.4, 1], opacity: [0, 1, 0.6] }}
              transition={{ duration: 1.1, delay: 0.7 }}
            />
          )}
          <div className="relative flex flex-col items-center text-center">
            {trackCompleted ? (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                <Trophy size={96} strokeWidth={1.25} className="text-gold drop-shadow-[0_0_30px_rgba(217,178,95,0.6)]" />
              </motion.div>
            ) : (
              <svg width="120" height="140" viewBox="0 0 120 140" aria-hidden>
                <defs>
                  <linearGradient id="lock-gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFF1C4" />
                    <stop offset="1" stopColor="#D9B25F" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M30 62 V40 a30 30 0 0 1 60 0 V62"
                  fill="none"
                  stroke="url(#lock-gold)"
                  strokeWidth="11"
                  strokeLinecap="round"
                  style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }}
                  initial={{ y: 0, rotate: 0 }}
                  animate={reduce ? { y: -12 } : { y: [0, 0, -16], rotate: [0, 0, 22] }}
                  transition={{ duration: 0.9, times: [0, 0.55, 1], delay: 0.2 }}
                />
                <motion.g
                  animate={reduce ? {} : { x: [0, -4, 4, -3, 3, 0] }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                >
                  <rect x="18" y="60" width="84" height="66" rx="16" fill="url(#lock-gold)" />
                  <circle cx="60" cy="88" r="8" fill="#7E5A19" />
                  <rect x="56" y="92" width="8" height="16" rx="3" fill="#7E5A19" />
                </motion.g>
              </svg>
            )}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 1.05 }}>
              <div className="mt-6 text-xs uppercase tracking-[0.3em] text-gold">{trackCompleted ? "Ścieżka ukończona" : "Etap odblokowany"}</div>
              <div className="num mt-2 text-3xl font-semibold">{trackCompleted ? "Gratulacje!" : title}</div>
              <div className="mt-6 text-xs text-muted">Dotknij, aby kontynuować</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
