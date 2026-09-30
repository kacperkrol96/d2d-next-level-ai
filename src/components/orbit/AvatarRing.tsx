"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Avatar } from "./Avatar";

/** Awatar poziomu w złotym pierścieniu postępu do kolejnego awansu. */
export function AvatarRing({ level, progress, size = 240 }: { level: number; progress: number; size?: number }) {
  const reduce = useReducedMotion();
  const stroke = 6;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF1C4" />
            <stop offset="1" stopColor="#D9B25F" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - clamped) : c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ type: "spring", stiffness: 40, damping: 16, delay: 0.2 }}
          style={{ filter: "drop-shadow(0 0 6px rgba(217,178,95,0.55))" }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={reduce ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Avatar level={level} size={size * 0.72} />
      </motion.div>
    </div>
  );
}
