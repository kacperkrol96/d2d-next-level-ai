"use client";

import { useCallback, useRef } from "react";
import { useStoredValue } from "./useStoredValue";

const STORAGE_KEY = "nle:sound-muted";

/** Krótki „tyk” liczarki (Web Audio, bez plików). Wyciszenie zapamiętywane. */
export function useTickSound() {
  const [stored, setStored] = useStoredValue(STORAGE_KEY);
  const muted = stored === "1";
  const ctx = useRef<AudioContext | null>(null);
  const last = useRef(0);

  const toggleMuted = useCallback(() => setStored(muted ? "0" : "1"), [muted, setStored]);

  const tick = useCallback(
    (pitch = 1) => {
      if (muted) return;
      const now = performance.now();
      if (now - last.current < 45) return; // nie częściej niż ~22/s
      last.current = now;
      try {
        ctx.current ??= new AudioContext();
        const ac = ctx.current;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = "triangle";
        osc.frequency.value = 1400 * pitch;
        gain.gain.setValueAtTime(0.0001, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.05);
        osc.connect(gain).connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 0.06);
      } catch {
        // przeglądarka może blokować dźwięk bez interakcji — ignorujemy
      }
    },
    [muted],
  );

  return { muted, toggleMuted, tick };
}
