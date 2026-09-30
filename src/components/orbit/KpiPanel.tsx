"use client";

import { motion, useReducedMotion } from "framer-motion";

interface KpiItem {
  key: string;
  label: string;
  weight: number;
  value: number | null;
  level: number;
  points: number;
  maxPoints: number;
}

interface Props {
  items: KpiItem[];
  units: Record<string, string>;
  score: number;
  multiplier: number;
  bandLabel: string;
  belowMinimum: boolean;
}

const roman = ["—", "I", "II", "III", "IV", "V"];
const nf = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 });

function formatValue(value: number | null, unit: string) {
  if (value === null) return "brak danych";
  if (unit === "%") return `${nf.format(value)}%`;
  if (unit === "szt") return nf.format(value);
  return `${nf.format(value)} ${unit}`;
}

export function KpiPanel({ items, units, score, multiplier, bandLabel, belowMinimum }: Props) {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="num text-5xl font-semibold">
            {nf.format(score)}
            <span className="ml-1 text-lg text-muted">/ 100 pkt</span>
          </div>
          <div className={`mt-1 text-sm ${belowMinimum ? "text-danger" : "text-muted"}`}>
            {belowMinimum ? "Poniżej minimum — alert do managera i żółta kartka" : `Przedział ${bandLabel}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Wpływ na wypłatę</div>
          <div className="num text-3xl font-semibold text-gold">×{nf.format(multiplier)}</div>
        </div>
      </div>

      <ul className="flex flex-col gap-4">
        {items.map((item, index) => (
          <li key={item.key}>
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <span>
                {item.label} <span className="text-xs text-muted">· waga {item.weight}</span>
              </span>
              <span className="num shrink-0 text-muted">{formatValue(item.value, units[item.key] ?? "")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid flex-1 grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className={`h-full rounded-full ${item.level >= 5 ? "bg-gold" : "bg-accent-soft"}`}
                      initial={{ scaleX: reduce ? (item.level >= lvl ? 1 : 0) : 0 }}
                      animate={{ scaleX: item.level >= lvl ? 1 : 0 }}
                      style={{ originX: 0 }}
                      transition={{ delay: 0.15 + index * 0.06 + lvl * 0.05, type: "spring", stiffness: 200, damping: 24 }}
                    />
                  </div>
                ))}
              </div>
              <span className="num w-16 shrink-0 text-right text-xs text-muted">
                {roman[item.level]} · {item.points}/{item.maxPoints || item.weight * 5}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
