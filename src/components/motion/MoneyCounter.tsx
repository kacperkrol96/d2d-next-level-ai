"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { counterValueAt, defaultCounterOptions, type CounterOptions } from "@/lib/motion/counter";

const fmt = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

export interface MoneyCounterProps {
  value: number;
  /** Zmiana klucza uruchamia animację od nowa. */
  playKey?: number | string;
  options?: Partial<CounterOptions>;
  onTick?: (value: number, tail: boolean) => void;
  onDone?: () => void;
  className?: string;
  suffix?: string;
}

/** Licznik kwoty w stylu liczarki banknotów (szybko → wolniej → pojedyncze złotówki). */
export function MoneyCounter({ value, playKey, options, onTick, onDone, className, suffix = " zł" }: MoneyCounterProps) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const cb = useRef({ onTick, onDone });
  useLayoutEffect(() => {
    cb.current = { onTick, onDone };
  });

  useEffect(() => {
    const opts = { ...defaultCounterOptions, ...options };
    if (reduce) {
      cb.current.onDone?.();
      return;
    }
    let frame = 0;
    let prev = -1;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      const v = counterValueAt(elapsed, value, opts);
      if (v !== prev) {
        prev = v;
        setShown(v);
        cb.current.onTick?.(v, elapsed > opts.duration * opts.fastShare);
      }
      if (elapsed < opts.duration) frame = requestAnimationFrame(loop);
      else cb.current.onDone?.();
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, playKey, reduce]);

  return (
    <span className={`num ${className ?? ""}`} aria-live="polite">
      {fmt.format(Math.floor(reduce ? value : shown))}
      {suffix}
    </span>
  );
}
