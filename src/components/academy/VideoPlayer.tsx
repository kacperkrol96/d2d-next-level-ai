"use client";

import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Odtwarzacz filmów Akademii:
 * - YouTube (niepubliczny) bez kontrolek YouTube, bez „Obejrzyj na YouTube” i bez polecanych —
 *   własne przyciski, przezroczysta nakładka blokuje kliknięcia w film, po końcu własny ekran końcowy,
 * - przewijanie do przodu tylko do miejsca już obejrzanego,
 * - liczy faktycznie obejrzane sekundy; lekcja zaliczona od progu z ustawień (np. 90%),
 * - bez linku (atrapa): symulowany film do testów.
 */

interface Clock {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  time(): number;
  duration(): number;
  destroy(): void;
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { ENDED: number; PLAYING: number; PAUSED: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytLoading: Promise<void> | null = null;
function loadYouTube(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  ytLoading ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytLoading;
}

const SIMULATED_SECONDS = 30;

function simulatedClock(onEnd: () => void): Clock {
  let t = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  return {
    play() {
      if (timer) return;
      if (t >= SIMULATED_SECONDS) t = 0;
      timer = setInterval(() => {
        t = Math.min(SIMULATED_SECONDS, t + 0.25);
        if (t >= SIMULATED_SECONDS) {
          stop();
          onEnd();
        }
      }, 250);
    },
    pause: stop,
    seek(s) {
      t = Math.max(0, Math.min(SIMULATED_SECONDS, s));
    },
    time: () => t,
    duration: () => SIMULATED_SECONDS,
    destroy: stop,
  };
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VideoPlayer({
  youtubeId,
  initialWatched,
  required,
  onProgress,
  onComplete,
}: {
  youtubeId: string | null;
  initialWatched: number;
  required: number;
  onProgress: (share: number) => Promise<void>;
  onComplete: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const clock = useRef<Clock | null>(null);
  const seen = useRef(new Set<number>());
  const lastReported = useRef(initialWatched);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [share, setShare] = useState(initialWatched);
  const [maxSeen, setMaxSeen] = useState(0);
  const completed = share >= required;

  const report = useCallback(
    (value: number, force = false) => {
      if (force || value - lastReported.current >= 0.05) {
        lastReported.current = value;
        void onProgress(value);
      }
    },
    [onProgress],
  );

  const handleEnd = useCallback(() => {
    setPlaying(false);
    setEnded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!youtubeId) {
      clock.current = simulatedClock(handleEnd);
      queueMicrotask(() => {
        if (!cancelled) {
          setDuration(SIMULATED_SECONDS);
          setReady(true);
        }
      });
      return () => {
        cancelled = true;
        clock.current?.destroy();
      };
    }
    let player: YTPlayer | null = null;
    loadYouTube().then(() => {
      if (cancelled || !host.current || !window.YT) return;
      const target = document.createElement("div");
      host.current.appendChild(target);
      player = new window.YT.Player(target, {
        host: "https://www.youtube-nocookie.com",
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { controls: 0, rel: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1, cc_load_policy: 0 },
        events: {
          onReady: () => {
            clock.current = {
              play: () => player!.playVideo(),
              pause: () => player!.pauseVideo(),
              seek: (s) => player!.seekTo(s, true),
              time: () => player!.getCurrentTime(),
              duration: () => player!.getDuration(),
              destroy: () => player!.destroy(),
            };
            setDuration(player!.getDuration());
            setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT!.PlayerState.ENDED) handleEnd();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      clock.current?.destroy();
    };
  }, [youtubeId, handleEnd]);

  // Licznik obejrzanych sekund (co 0,5 s w trakcie odtwarzania).
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const c = clock.current;
      if (!c) return;
      const t = c.time();
      const d = c.duration() || duration;
      seen.current.add(Math.floor(t));
      setTime(t);
      setMaxSeen((m) => Math.max(m, t));
      const s = d > 0 ? Math.max(initialWatched, Math.min(1, seen.current.size / Math.floor(d))) : 0;
      setShare(s);
      report(s);
    }, 500);
    return () => clearInterval(id);
  }, [playing, duration, initialWatched, report]);

  useEffect(() => {
    if (ended) report(share, true);
  }, [ended, share, report]);

  const toggle = () => {
    const c = clock.current;
    if (!c || !ready) return;
    if (playing) {
      c.pause();
      setPlaying(false);
      report(share, true);
    } else {
      setEnded(false);
      c.play();
      setPlaying(true);
    }
  };

  const seekTo = (ratio: number) => {
    const c = clock.current;
    if (!c || !duration) return;
    // Do przodu tylko do miejsca już obejrzanego.
    const limit = Math.max(maxSeen, initialWatched * duration);
    const target = Math.min(ratio * duration, limit);
    c.seek(target);
    setTime(target);
  };

  const replay = () => {
    clock.current?.seek(0);
    setTime(0);
    setEnded(false);
    clock.current?.play();
    setPlaying(true);
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-black">
      <div className="relative aspect-video w-full select-none">
        {youtubeId ? (
          <div ref={host} className={`absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full ${ended ? "invisible" : ""}`} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent/25 via-bg to-bg text-center">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted">Atrapa filmu</span>
            <span className="num text-4xl font-semibold text-white/80">{fmt(time)}</span>
            <span className="text-xs text-muted">Prawdziwy film pojawi się, gdy Zarząd przypisze link</span>
          </div>
        )}
        {/* Nakładka: kliknięcie = pauza/odtwarzanie; blokuje linki YouTube w filmie. */}
        <button type="button" aria-label={playing ? "Pauza" : "Odtwórz"} onClick={toggle} className="absolute inset-0 z-10 cursor-pointer bg-transparent" />
        {!playing && !ended && ready && (
          <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-black shadow-xl">
              <Play size={28} className="ml-1" />
            </span>
          </span>
        )}
        {ended && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/95 text-center">
            <span className={`grid h-14 w-14 place-items-center rounded-full ${completed ? "bg-earned/20 text-earned" : "bg-gold/20 text-gold"}`}>
              <Check size={26} />
            </span>
            <div className="text-sm">{completed ? "Film obejrzany" : `Obejrzano ${Math.round(share * 100)}% — potrzeba ${Math.round(required * 100)}%`}</div>
            <div className="flex gap-2">
              <button type="button" onClick={replay} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm">
                <RotateCcw size={14} /> Obejrzyj ponownie
              </button>
              {completed && (
                <button type="button" onClick={onComplete} className="rounded-full bg-accent px-4 py-2 text-sm font-medium">
                  Dalej
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 bg-card px-4 py-3">
        <button type="button" onClick={toggle} disabled={!ready} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 disabled:opacity-40" aria-label={playing ? "Pauza" : "Odtwórz"}>
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={duration ? Math.round((time / duration) * 1000) : 0}
          onChange={(e) => seekTo(Number(e.target.value) / 1000)}
          className="h-1 flex-1 accent-[var(--color-accent-soft)]"
          aria-label="Postęp filmu"
        />
        <span className="num w-24 shrink-0 text-right text-xs text-muted">
          {fmt(time)} / {fmt(duration)}
        </span>
      </div>
      <div className="flex items-center gap-3 bg-card px-4 pb-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className={`h-full rounded-full ${completed ? "bg-earned" : "bg-gold"}`} style={{ width: `${Math.round(share * 100)}%` }} />
        </div>
        <span className={`num text-xs ${completed ? "text-earned" : "text-muted"}`}>obejrzane {Math.round(share * 100)}%</span>
      </div>
    </div>
  );
}
