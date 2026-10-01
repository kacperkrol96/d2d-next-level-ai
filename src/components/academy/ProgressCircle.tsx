"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Pierścień postępu ścieżki (złoty — rozwój). */
export function ProgressCircle({ value, size = 132 }: { value: number; size?: number }) {
  const reduce = useReducedMotion();
  const stroke = 8;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#D9B25F"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - v) : c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(217,178,95,0.5))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-3xl font-semibold">{Math.round(v * 100)}%</span>
        <span className="text-[11px] text-muted">ścieżki</span>
      </div>
    </div>
  );
}
