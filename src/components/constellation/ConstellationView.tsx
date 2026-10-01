"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/orbit/Avatar";

export interface StarData {
  id: string;
  name: string;
  roleLabel: string;
  parentId: string | null;
  depth: number;
  level: number;
  levelTitle: string;
  clients: number;
  activity: number;
  alert: string | null;
  kpiScore: number | null;
  earnedForManager: number;
  entries: { clientName: string; amount: number; label: string }[];
}

const pln = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

/** Rozmieszczenie: centrum, pierwszy krąg wokół, kolejne osoby wachlarzem przy swoim przełożonym. */
function layout(stars: StarData[]) {
  const pos = new Map<string, { x: number; y: number; angle: number }>();
  const center = stars.find((s) => s.depth === 0)!;
  pos.set(center.id, { x: 50, y: 50, angle: 0 });
  // Dzieci wachlarzem wokół kąta rodzica (pierwszy krąg — cały okrąg).
  const place = (parentId: string, depth: number, centerAngle: number, span: number) => {
    const kids = stars.filter((s) => s.parentId === parentId);
    kids.forEach((k, i) => {
      const angle = kids.length === 1 ? centerAngle : centerAngle - span / 2 + (span * (i + 0.5)) / kids.length;
      const r = 24 + (depth - 1) * 16;
      pos.set(k.id, { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle), angle });
      place(k.id, depth + 1, angle, Math.min(span / Math.max(1, kids.length), 1.4));
    });
  };
  place(center.id, 1, -Math.PI / 2, Math.PI * 2);
  return pos;
}

export function ConstellationView({ stars, managerName }: { stars: StarData[]; managerName: string }) {
  const reduce = useReducedMotion();
  const pos = useMemo(() => layout(stars), [stars]);
  const [selected, setSelected] = useState<string | null>(null);
  const sel = stars.find((s) => s.id === selected) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="card relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(142,17,191,0.18),transparent_60%)]" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {[24, 40].map((r) => (
            <circle key={r} cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={0.3} strokeDasharray="0.8 1.2" />
          ))}
          {stars
            .filter((s) => s.parentId)
            .map((s) => {
              const a = pos.get(s.parentId!)!;
              const b = pos.get(s.id)!;
              return (
                <motion.line
                  key={s.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={s.alert ? "rgba(255,93,108,0.5)" : "rgba(217,178,95,0.35)"}
                  strokeWidth={0.35}
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 * s.depth }}
                />
              );
            })}
        </svg>
        {stars.map((s, i) => {
          const p = pos.get(s.id)!;
          const size = s.depth === 0 ? 76 : s.depth === 1 ? 54 : 42;
          return (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id === selected ? null : s.id)}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0.45 + 0.55 * s.activity }}
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.45 + 0.55 * s.activity }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: reduce ? 0 : 0.05 * i }}
              aria-label={`${s.name}, poziom ${s.level}`}
            >
              <span
                className={`rounded-full p-0.5 ${s.alert ? "ring-2 ring-danger" : selected === s.id ? "ring-2 ring-gold" : ""}`}
                style={{ boxShadow: `0 0 ${Math.round(8 + 22 * s.activity)}px rgba(217,178,95,${0.15 + 0.4 * s.activity})` }}
              >
                <Avatar level={s.level} size={size} />
              </span>
              <span className="max-w-[90px] truncate rounded-full bg-bg/70 px-2 text-[10px] leading-4 text-white/90 sm:text-[11px]">{s.name.split(" ")[0]}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {sel ? (
          <motion.div
            key={sel.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar level={sel.level} size={44} />
                <div>
                  <div className="font-medium">{sel.name}</div>
                  <div className="text-xs text-muted">
                    {sel.roleLabel} · poz. {sel.level} {sel.levelTitle}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Zamknij" className="text-muted">
                <X size={16} />
              </button>
            </div>
            {sel.alert && <p className="mt-3 rounded-2xl bg-danger/10 px-3 py-2 text-xs text-danger">{sel.alert}</p>}
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-card-2 p-2">
                <dt className="text-[10px] text-muted">Klienci</dt>
                <dd className="num text-lg font-semibold">{sel.clients}</dd>
              </div>
              <div className="rounded-2xl bg-card-2 p-2">
                <dt className="text-[10px] text-muted">KPI</dt>
                <dd className="num text-lg font-semibold">{sel.kpiScore ?? "—"}</dd>
              </div>
              <div className="rounded-2xl bg-card-2 p-2">
                <dt className="text-[10px] text-muted">Aktywność</dt>
                <dd className="num text-lg font-semibold">{Math.round(sel.activity * 100)}%</dd>
              </div>
            </dl>
            {sel.depth > 0 && (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/[0.06] p-3">
                <div className="text-xs text-muted">{managerName.split(" ")[0]} zarobił(a) dzięki tej osobie w tym miesiącu</div>
                <div className="num text-2xl font-semibold text-gold">{pln.format(sel.earnedForManager)} zł</div>
              </div>
            )}
            {sel.entries.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 text-xs">
                {sel.entries.slice(0, 6).map((e, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate text-white/80">
                      {e.clientName} · {e.label}
                    </span>
                    <span className={`num shrink-0 ${e.amount < 0 ? "text-danger" : "text-earned"}`}>{pln.format(e.amount)} zł</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ) : (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5 text-sm text-muted">
            Dotknij gwiazdy, żeby zobaczyć klientów, KPI i ile zarobiłeś dzięki tej osobie. Jasność = aktywność w tym tygodniu, czerwona obwódka = alert.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
