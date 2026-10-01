"use client";

import { useRef, useState } from "react";

/** Podpis palcem (lub rysikiem/myszą). Zwraca PNG jako data URL. */
export function SignaturePad({ onChange, ink = "#111" }: { onChange: (dataUrl: string | null) => void; ink?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [empty, setEmpty] = useState(true);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current!.getContext("2d")!;
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    strokes.current++;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    // Kropka to nie podpis — wymagamy kilku ruchów.
    if (strokes.current > 8) {
      setEmpty(false);
      onChange(canvas.current!.toDataURL("image/png"));
    }
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    strokes.current = 0;
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-white">
        <canvas
          ref={canvas}
          width={900}
          height={300}
          className="block h-40 w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-label="Pole podpisu"
        />
        {empty && <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-zinc-400">Podpisz się palcem</span>}
        <div className="pointer-events-none absolute bottom-6 left-6 right-6 border-b border-dashed border-zinc-300" />
      </div>
      <button type="button" onClick={clear} className="mt-2 text-xs underline opacity-70">
        Wyczyść podpis
      </button>
    </div>
  );
}
