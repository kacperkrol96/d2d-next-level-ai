"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { OVERLAY_CLOSED_EVENT, overlayState } from "@/components/motion/NewCommissionOverlay";
import type { OfficeMove } from "@/lib/services/trajectory";

const MAX = 3;

/**
 * Powiadomienie przy każdej zmianie statusu: „Biuro przesunęło umowę … do …”.
 * Pokazuje zmiany od ostatniej wizyty (zapamiętanej w przeglądarce); czeka,
 * aż skończy się animacja prowizji (jeden efekt naraz).
 */
export function OfficeMovesToast({ userId, moves }: { userId: string; moves: OfficeMove[] }) {
  const [visible, setVisible] = useState<OfficeMove[]>([]);
  const [extra, setExtra] = useState(0);
  const key = `nle:moves-seen:${userId}`;

  useEffect(() => {
    let lastSeen: string | null = null;
    try {
      lastSeen = localStorage.getItem(key);
    } catch {}
    // Pierwsza wizyta: pokaż ruchy z ostatniej doby.
    const since = lastSeen ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fresh = moves.filter((m) => m.at > since);
    if (moves[0]) {
      try {
        localStorage.setItem(key, moves[0].at);
      } catch {}
    }
    if (fresh.length === 0) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(fresh.slice(0, MAX));
      setExtra(Math.max(0, fresh.length - MAX));
    };
    const onClosed = () => setTimeout(show, 400);
    const timer = setTimeout(() => (overlayState.active ? window.addEventListener(OVERLAY_CLOSED_EVENT, onClosed, { once: true }) : show()), 1200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(OVERLAY_CLOSED_EVENT, onClosed);
    };
  }, [key, moves]);

  useEffect(() => {
    if (visible.length === 0) return;
    const t = setTimeout(() => setVisible([]), 9000);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-24 z-40 flex flex-col items-stretch gap-2 md:inset-x-auto md:bottom-auto md:right-6 md:top-6 md:w-96">
      <AnimatePresence>
        {visible.map((m, i) => (
          <motion.div
            key={`${m.agreementNumber}-${m.at}`}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, delay: i * 0.08 }}
            className={`pointer-events-auto items-start gap-3 rounded-[20px] border border-line bg-card/95 p-4 shadow-2xl backdrop-blur-xl ${i > 0 ? "hidden md:flex" : "flex"}`}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-soft">
              <Building2 size={16} />
            </span>
            <Link href={`/skarbiec/klient/${m.clientId}`} className="min-w-0 flex-1" onClick={() => setVisible([])}>
              <div className="text-sm">
                Biuro przesunęło umowę <span className="num text-white">{m.agreementNumber}</span>
              </div>
              <div className="mt-0.5 truncate text-xs text-muted">
                {m.clientName} → <span className="text-white/85">{m.to}</span>
              </div>
              {i === 0 && visible.length + extra > 1 && (
                <div className="mt-1 text-[11px] text-accent-soft md:hidden">+{visible.length + extra - 1} więcej w Skarbcu</div>
              )}
              {i === visible.length - 1 && extra > 0 && <div className="mt-1 hidden text-[11px] text-accent-soft md:block">+{extra} więcej w Skarbcu</div>}
            </Link>
            <button onClick={() => setVisible((v) => v.filter((x) => x !== m))} className="text-muted hover:text-white" aria-label="Zamknij">
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
