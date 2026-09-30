"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { useStoredValue } from "@/components/motion/useStoredValue";

const KEY = "nle:day-started-at";

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * „Rozpocznij dzień” — start czasu pracy + zgoda na GPS.
 * Etap 0: stan tylko w przeglądarce. Etap 5: zapis w bazie, GPS tylko w godzinach pracy.
 */
export function StartDayButton() {
  const [stored, setStored] = useStoredValue(KEY);
  const startedAt = stored ? Number(stored) : null;
  const [now, setNow] = useState(() => Date.now());
  const [gps, setGps] = useState<"idle" | "ok" | "denied" | "unavailable">("idle");

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const start = () => {
    const at = Date.now();
    setNow(at);
    setStored(String(at));
    if (!("geolocation" in navigator)) return setGps("unavailable");
    navigator.geolocation.getCurrentPosition(
      () => setGps("ok"),
      () => setGps("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const stop = () => {
    setStored(null);
    setGps("idle");
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {startedAt ? (
        <motion.div
          key="on"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="flex items-center justify-between gap-4 rounded-[20px] border border-earned/30 bg-earned/[0.07] px-5 py-4"
        >
          <div>
            <div className="text-xs text-earned">Dzień pracy trwa</div>
            <div className="num text-3xl font-semibold">{fmt(now - startedAt)}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin size={12} />
              {gps === "ok" ? "GPS aktywny (tylko w godzinach pracy)" : gps === "denied" ? "Brak zgody na GPS" : gps === "unavailable" ? "GPS niedostępny" : "Łączenie z GPS…"}
            </div>
          </div>
          <button onClick={stop} className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm text-muted hover:text-white">
            <Square size={14} /> Zakończ
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="off"
          onClick={start}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft px-6 py-5 text-lg font-medium shadow-[0_10px_40px_-10px_rgba(142,17,191,0.8)]"
        >
          <Play size={20} fill="currentColor" /> Rozpocznij dzień
        </motion.button>
      )}
    </AnimatePresence>
  );
}
