"use client";

import { RotateCcw } from "lucide-react";
import { MoneyCounter } from "@/components/motion/MoneyCounter";
import { REPLAY_EVENT } from "@/components/motion/NewCommissionOverlay";

interface Props {
  commission: number;
  multiplier: number;
  payout: number;
  greyTotal: number;
  periodLabel: string;
}

export function PeriodEarnings({ commission, multiplier, payout, greyTotal, periodLabel }: Props) {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Zarobione w okresie</span>
          <span className="text-xs text-muted">{periodLabel}</span>
        </div>
        <MoneyCounter value={commission} className="mt-2 block text-5xl font-semibold text-earned" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card-2 p-4">
          <div className="text-xs text-muted">Mnożnik KPI</div>
          <div className="num mt-1 text-2xl font-semibold text-gold">{Math.round(multiplier * 100)}%</div>
        </div>
        <div className="rounded-2xl bg-card-2 p-4">
          <div className="text-xs text-muted">Do wypłaty</div>
          <MoneyCounter value={payout} className="mt-1 block text-2xl font-semibold" options={{ duration: 2200 }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          Do dopięcia: <span className="num text-white/80">{new Intl.NumberFormat("pl-PL").format(greyTotal)} zł</span>
        </span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(REPLAY_EVENT))}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:text-white"
        >
          <RotateCcw size={13} /> Pokaż animację
        </button>
      </div>
    </div>
  );
}
