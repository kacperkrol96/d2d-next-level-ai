"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MoneyCounter } from "./MoneyCounter";
import { useTickSound } from "./useTickSound";

export const REPLAY_EVENT = "nle:replay-commission";
export const OVERLAY_CLOSED_EVENT = "nle:overlay-closed";
/** Czy trwa animacja prowizji — inne efekty czekają (jeden efekt naraz). */
export const overlayState = { active: false };

interface Props {
  userId: string;
  /** Suma zarobionych (zielonych) prowizji użytkownika. */
  earnedTotal: number;
  latest: { amount: number; clientName: string } | null;
}

type Phase = "hidden" | "counting" | "flying";

/**
 * Start aplikacji z nową prowizją od ostatniego logowania: kwota liczy się
 * na środku ekranu jak liczarka banknotów, a potem „odlatuje” do Skarbca.
 */
export function NewCommissionOverlay({ userId, earnedTotal, latest }: Props) {
  const reduce = useReducedMotion();
  const { muted, toggleMuted, tick } = useTickSound();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [target, setTarget] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const storageKey = `nle:seen-earned:${userId}`;

  const show = useCallback((value: number, name: string | null) => {
    setAmount(value);
    setLabel(name);
    setPlayKey((k) => k + 1);
    setPhase("counting");
    overlayState.active = true;
  }, []);

  useEffect(() => {
    // Krótka pauza po starcie, żeby ekran zdążył się pokazać.
    const timer = setTimeout(() => {
      let seen: number | null = null;
      try {
        const raw = localStorage.getItem(storageKey);
        seen = raw === null ? null : Number(raw);
        localStorage.setItem(storageKey, String(earnedTotal));
      } catch {}
      const delta = seen === null ? (latest?.amount ?? 0) : earnedTotal - seen;
      if (delta > 0) show(delta, seen === null || delta === latest?.amount ? (latest?.clientName ?? null) : null);
    }, 400);
    return () => clearTimeout(timer);
  }, [storageKey, earnedTotal, latest, show]);

  useEffect(() => {
    const replay = () => latest && show(latest.amount, latest.clientName);
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, [latest, show]);

  const flyAway = useCallback(() => {
    const el = [...document.querySelectorAll<HTMLElement>("[data-fly-target='skarbiec']")].find((e) => e.offsetParent !== null);
    if (el) {
      const r = el.getBoundingClientRect();
      setTarget({ x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2 });
    } else {
      setTarget({ x: 0, y: -window.innerHeight / 2 });
    }
    setPhase("flying");
  }, []);

  const onDone = useCallback(() => {
    setTimeout(flyAway, reduce ? 900 : 650);
  }, [flyAway, reduce]);

  return (
    <AnimatePresence>
      {phase !== "hidden" && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "flying" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "flying" ? 0.6 : 0.25, delay: phase === "flying" ? 0.15 : 0 }}
          onClick={() => phase === "counting" && flyAway()}
          onAnimationComplete={() => {
            if (phase !== "flying") return;
            setPhase("hidden");
            overlayState.active = false;
            window.dispatchEvent(new Event(OVERLAY_CLOSED_EVENT));
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMuted();
            }}
            className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] rounded-full p-3 text-muted hover:text-white"
            aria-label={muted ? "Włącz dźwięk" : "Wycisz dźwięk"}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <motion.div
            className="flex flex-col items-center gap-3 px-6 text-center"
            initial={{ scale: 0.9, y: 12 }}
            animate={
              phase === "flying"
                ? { x: target.x, y: target.y, scale: 0.08, opacity: 0.2 }
                : { scale: 1, y: 0, x: 0, opacity: 1 }
            }
            transition={phase === "flying" ? { duration: 0.7, ease: [0.55, 0, 0.3, 1] } : { type: "spring", stiffness: 300, damping: 22 }}
          >
            <span className="text-sm uppercase tracking-[0.3em] text-earned/80">Nowa prowizja</span>
            <MoneyCounter
              value={amount}
              playKey={playKey}
              className="text-6xl font-semibold text-earned drop-shadow-[0_0_30px_rgba(91,214,154,0.45)] sm:text-8xl"
              onTick={(_, tail) => tick(tail ? 1.25 : 1)}
              onDone={onDone}
            />
            {label && <span className="text-muted">{label}</span>}
            <span className="mt-6 text-xs text-muted/60">Dotknij, aby pominąć</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
