"use client";

import { Lock } from "lucide-react";
import { Avatar } from "./Avatar";

interface Step {
  level: number;
  title: string;
  requirement: string;
  reached: boolean;
  current: boolean;
}

/** Ścieżka 10 poziomów — przewijana poziomo (telefon/iPad), bez tabel. */
export function LevelPath({ steps }: { steps: Step[] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6">
      <ol className="flex w-max gap-3">
        {steps.map((s) => (
          <li
            key={s.level}
            className={`relative flex w-36 shrink-0 flex-col items-center rounded-2xl border p-4 text-center transition ${
              s.current ? "border-gold/60 bg-gold/[0.07] shadow-[0_0_30px_rgba(217,178,95,0.15)]" : "border-line bg-card-2"
            }`}
          >
            <div className={s.reached ? "" : "opacity-30 grayscale"}>
              <Avatar level={s.level} size={72} />
            </div>
            {!s.reached && <Lock size={14} className="absolute right-3 top-3 text-muted" />}
            <div className="num mt-2 text-xs text-muted">Poziom {s.level}</div>
            <div className="mt-1 text-[13px] leading-snug">{s.title}</div>
            <div className="mt-2 text-[11px] text-muted">{s.requirement}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
