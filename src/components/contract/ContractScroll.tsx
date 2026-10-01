"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import type { ContractScrollTheme } from "@/lib/config/types";
import { SignaturePad } from "./SignaturePad";

const themeText: Record<ContractScrollTheme, { accept: string; sign: string; done: string }> = {
  parchment: { accept: "Akceptuję", sign: "Przyłóż pieczęć i podpisz", done: "Zapieczętowane" },
  cyberpunk: { accept: "AKCEPTUJĘ_", sign: "Autoryzacja biometryczna — podpis", done: "DOSTĘP PRZYZNANY" },
  retro: { accept: "▶ AKCEPTUJĘ", sign: "WPISZ SWÓJ PODPIS", done: "LEVEL START!" },
};

/** Krótka melodia „level start” (8-bit) — tylko po kliknięciu, cicho. */
function playLevelStart() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = f;
      g.gain.value = 0.04;
      o.connect(g).connect(ctx.destination);
      const t = ctx.currentTime + i * 0.11;
      o.start(t);
      g.gain.setTargetAtTime(0, t + 0.08, 0.02);
      o.stop(t + 0.14);
    });
  } catch {
    /* brak dźwięku — nic nie szkodzi */
  }
}

function WaxSeal({ stamped }: { stamped: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-24 w-24 drop-shadow-[0_6px_10px_rgba(80,0,0,0.45)]"
      initial={false}
      animate={stamped ? { scale: 1, opacity: 1, rotate: -8 } : { scale: reduce ? 1 : 1.6, opacity: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      aria-hidden
    >
      <path d="M60 6c10 0 14 8 22 10s16-2 20 6-2 14 2 22 12 12 8 20-14 6-18 14-2 18-12 20-14-6-22-6-14 8-22 6-6-14-12-20-16-4-18-14 6-12 4-20-6-14 0-20 14 0 20-6S50 6 60 6z" fill="#9b1c1c" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#c53030" strokeWidth="3" />
      <text x="60" y="68" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fontWeight="700" fill="#fde2e2">
        NLE
      </text>
    </motion.svg>
  );
}

export function ContractScroll({
  theme,
  title,
  version,
  previousAccepted,
  action,
  children,
}: {
  theme: ContractScrollTheme;
  title: string;
  version: number;
  /** Zaakceptowana wcześniej wersja (nowa wersja = ponowna akceptacja). */
  previousAccepted: number | null;
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [reachedEnd, setReachedEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const text = themeText[theme];

  const check = useCallback((el: HTMLDivElement) => {
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReachedEnd(true);
  }, []);
  const observer = useRef<ResizeObserver | null>(null);
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      observer.current?.disconnect();
      if (!el) return;
      observer.current = new ResizeObserver(() => check(el));
      observer.current.observe(el);
    },
    [check],
  );

  const frame =
    theme === "parchment" ? "scroll-parchment rounded-[28px]" : theme === "cyberpunk" ? "scroll-cyberpunk rounded-[20px] holo" : "scroll-retro";
  const button =
    theme === "parchment"
      ? "bg-[#7a1f1f] text-[#fde2e2] hover:bg-[#8f2626]"
      : theme === "cyberpunk"
        ? "border border-cyan-300/70 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(0,240,255,0.45)]"
        : "rounded-none border-4 border-[#39ff14] bg-[#ff2e97] text-[#0b0b16] font-mono";

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col px-4 pb-safe pt-safe">
      <header className="py-4 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">
          {previousAccepted ? `Nowa wersja kontraktu (v${version}) — przeczytaj ponownie` : "Zanim zaczniesz"}
        </p>
        <h1 className="num mt-1 text-2xl font-semibold">{title}</h1>
      </header>

      <div className={`relative min-h-0 flex-1 overflow-hidden ${frame}`}>
        {theme === "parchment" && <div className="rod absolute inset-x-0 top-0 z-10 h-4 rounded-full" />}
        {theme === "cyberpunk" && !reduce && <div className="scanline z-10" />}
        <div
          ref={attach}
          onScroll={(e) => check(e.currentTarget)}
          className={`h-full overflow-y-auto overscroll-contain px-5 sm:px-8 ${theme === "parchment" ? "py-8" : "py-6"}`}
          tabIndex={0}
          aria-label="Treść kontraktu"
        >
          {children}
          <div className="mt-10 flex flex-col items-center gap-2 pb-4 text-center text-sm opacity-80">
            {theme === "retro" && <span className="blink">— KONIEC ZWOJU —</span>}
            {theme !== "retro" && <span>— koniec kontraktu (wersja {version}) —</span>}
          </div>
        </div>
        {theme === "parchment" && <div className="rod absolute inset-x-0 bottom-0 z-10 h-4 rounded-full" />}
      </div>

      <div className="py-4">
        {!accepted ? (
          <>
            <button
              type="button"
              disabled={!reachedEnd}
              onClick={() => {
                setAccepted(true);
                if (theme === "retro") playLevelStart();
              }}
              className={`w-full rounded-2xl px-6 py-4 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${button}`}
            >
              {text.accept}
            </button>
            <p className="mt-2 text-center text-xs text-muted">{reachedEnd ? "Przeczytane do końca — możesz zaakceptować." : "Przewiń kontrakt do końca, aby odblokować akceptację."}</p>
          </>
        ) : (
          <motion.form
            action={action}
            onSubmit={() => setSending(true)}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">{text.sign}</p>
              {theme === "parchment" && <WaxSeal stamped={!!signature} />}
              {theme !== "parchment" && signature && <span className={`text-sm font-semibold ${theme === "retro" ? "font-mono text-[#ffe066]" : "text-cyan-300"}`}>{text.done}</span>}
            </div>
            <SignaturePad onChange={setSignature} />
            <input type="hidden" name="version" value={version} />
            <input type="hidden" name="signature" value={signature ?? ""} />
            <button disabled={!signature || sending} className={`w-full rounded-2xl px-6 py-4 text-base font-semibold transition disabled:opacity-35 ${button}`}>
              {sending ? "Zapisuję…" : "Podpisuję i wchodzę"}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
