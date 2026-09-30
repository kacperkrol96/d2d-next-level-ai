"use client";

import { useId, type ReactNode } from "react";

/**
 * Awatar poziomu (1–10) — wektorowo (SVG). Jeden komponent, jedno API:
 * w v2.0 podmienimy rysunki na grafiki 3D bez zmian w miejscach użycia.
 *
 * 1–2 brązowa tarcza (1/2 belki) · 3–4 srebrny heksagon z gwiazdą (4 + skrzydełka)
 * 5–6 złoty medal z laurem (6 + korona i poświata) · 7–8 platynowy kryształ z orbitą
 * (8 + duże skrzydła) · 9–10 fioletowa planeta z pierścieniem i skrzydłami
 * (10 + złota korona, aureola i gwiazdy).
 */
export interface AvatarProps {
  level: number;
  size?: number;
  className?: string;
  title?: string;
}

type Material = "bronze" | "silver" | "gold" | "platinum" | "purple";

const materials: Record<Material, [string, string, string]> = {
  bronze: ["#F6C895", "#C07A3E", "#5E3114"],
  silver: ["#FFFFFF", "#C4CCD6", "#6E7885"],
  gold: ["#FFF1C4", "#D9B25F", "#7E5A19"],
  platinum: ["#F4FBFF", "#B9CEE3", "#5F7690"],
  purple: ["#E7B3FF", "#8E11BF", "#2A0440"],
};

export function Avatar({ level, size = 160, className, title }: AvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const lvl = Math.min(10, Math.max(1, Math.round(level)));
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? `Poziom ${lvl}`}
    >
      <defs>
        {(Object.keys(materials) as Material[]).map((m) => (
          <linearGradient key={m} id={id(m)} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={materials[m][0]} />
            <stop offset="0.5" stopColor={materials[m][1]} />
            <stop offset="1" stopColor={materials[m][2]} />
          </linearGradient>
        ))}
        {(Object.keys(materials) as Material[]).map((m) => (
          <linearGradient key={`${m}-dark`} id={id(`${m}-dark`)} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={materials[m][2]} />
            <stop offset="1" stopColor={materials[m][1]} stopOpacity="0.85" />
          </linearGradient>
        ))}
        <radialGradient id={id("glow-gold")}>
          <stop offset="0" stopColor="#D9B25F" stopOpacity="0.55" />
          <stop offset="1" stopColor="#D9B25F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("glow-purple")}>
          <stop offset="0" stopColor="#B54CE0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8E11BF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("planet")} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#F1C9FF" />
          <stop offset="0.35" stopColor="#B54CE0" />
          <stop offset="0.75" stopColor="#6A0C8F" />
          <stop offset="1" stopColor="#1E0230" />
        </radialGradient>
        <linearGradient id={id("shine")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {lvl <= 2 && <ShieldEmblem level={lvl} url={url} />}
      {lvl >= 3 && lvl <= 4 && <HexEmblem level={lvl} url={url} />}
      {lvl >= 5 && lvl <= 6 && <MedalEmblem level={lvl} url={url} />}
      {lvl >= 7 && lvl <= 8 && <CrystalEmblem level={lvl} url={url} />}
      {lvl >= 9 && <PlanetEmblem level={lvl} url={url} />}
    </svg>
  );
}

type Url = (name: string) => string;

// ------------------------------------------------------------------ elementy wspólne

function Wing({ side, scale, fill, stroke }: { side: "left" | "right"; scale: number; fill: string; stroke: string }) {
  const sx = side === "left" ? -scale : scale;
  return (
    <g transform={`scale(${sx} ${scale})`}>
      <path
        d="M0,-4 C22,-34 58,-50 92,-46 C78,-36 70,-28 66,-22 C80,-24 90,-20 96,-12 C80,-8 70,-4 64,0 C74,2 82,8 84,16 C66,16 48,14 34,12 C22,10 8,8 0,6 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2 / scale}
        strokeLinejoin="round"
      />
      <path d="M8,-2 C30,-22 56,-34 80,-38 M14,4 C36,-4 58,-10 82,-10 M20,9 C40,8 58,10 72,12" fill="none" stroke={stroke} strokeOpacity="0.5" strokeWidth={1 / scale} />
    </g>
  );
}

function Star({ r, inner, fill, x = 0, y = 0 }: { r: number; inner: number; fill: string; x?: number; y?: number }) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return <polygon points={points.join(" ")} fill={fill} />;
}

function Sparkle({ x, y, r, fill = "#FFF4D6" }: { x: number; y: number; r: number; fill?: string }) {
  const q = r * 0.22;
  return <path d={`M${x},${y - r} L${x + q},${y - q} L${x + r},${y} L${x + q},${y + q} L${x},${y + r} L${x - q},${y + q} L${x - r},${y} L${x - q},${y - q} Z`} fill={fill} />;
}

function Crown({ y, scale = 1, url }: { y: number; scale?: number; url: Url }) {
  return (
    <g transform={`translate(0 ${y}) scale(${scale})`}>
      <path d="M-28,0 L-32,-26 L-16,-12 L0,-34 L16,-12 L32,-26 L28,0 Z" fill={url("gold")} stroke="#7E5A19" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="-28" y="-2" width="56" height="7" rx="2" fill={url("gold")} stroke="#7E5A19" strokeWidth="1.2" />
      <circle cx="0" cy="-34" r="3.5" fill="#fff" />
      <circle cx="-32" cy="-26" r="3" fill="#fff" />
      <circle cx="32" cy="-26" r="3" fill="#fff" />
      <circle cx="0" cy="1.5" r="3" fill="#8E11BF" />
    </g>
  );
}

function Shine({ d, url }: { d: string; url: Url }) {
  return <path d={d} fill={url("shine")} pointerEvents="none" />;
}

// ------------------------------------------------------------------ 1–2 tarcza

const SHIELD = "M0,-70 L58,-50 L53,18 Q42,54 0,74 Q-42,54 -53,18 L-58,-50 Z";

function ShieldEmblem({ level, url }: { level: number; url: Url }) {
  const chevrons = level === 1 ? [8] : [-8, 18];
  return (
    <g>
      <path d={SHIELD} fill={url("bronze")} stroke="#3D1E0A" strokeWidth="2" />
      <path d={SHIELD} transform="scale(0.8)" fill={url("bronze-dark")} />
      {chevrons.map((y) => (
        <path key={y} d={`M-28,${y - 12} L0,${y + 8} L28,${y - 12}`} fill="none" stroke={url("bronze")} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <Shine d="M0,-70 L58,-50 L55,-10 Q20,-30 -58,-18 L-58,-50 Z" url={url} />
    </g>
  );
}

// ------------------------------------------------------------------ 3–4 heksagon

function hexPoints(r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function HexEmblem({ level, url }: { level: number; url: Url }) {
  return (
    <g>
      {level === 4 && (
        <g transform="translate(0 4)">
          <g transform="translate(46 -6)">
            <Wing side="right" scale={0.55} fill={url("silver")} stroke="#5A6470" />
          </g>
          <g transform="translate(-46 -6)">
            <Wing side="left" scale={0.55} fill={url("silver")} stroke="#5A6470" />
          </g>
        </g>
      )}
      <polygon points={hexPoints(64)} fill={url("silver")} stroke="#4E5763" strokeWidth="2" strokeLinejoin="round" />
      <polygon points={hexPoints(52)} fill={url("silver-dark")} />
      <Star r={30} inner={13} fill={url("silver")} />
      <Shine d={`M0,-64 L55.4,-32 L55.4,-4 Q0,-24 -55.4,-4 L-55.4,-32 Z`} url={url} />
    </g>
  );
}

// ------------------------------------------------------------------ 5–6 medal

function Laurel({ url }: { url: Url }) {
  const leaves: ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const deg = 112 + i * 18; // łuk od dołu po lewej ku górze
    const rad = (deg * Math.PI) / 180;
    const x = 68 * Math.cos(rad);
    const y = 68 * Math.sin(rad);
    const rot = deg + 90 + 25;
    leaves.push(
      <ellipse key={`l${i}`} cx={x} cy={y} rx="12" ry="5" transform={`rotate(${rot} ${x} ${y})`} fill={url("gold")} stroke="#6E4F14" strokeWidth="0.8" />,
      <ellipse key={`r${i}`} cx={-x} cy={y} rx="12" ry="5" transform={`rotate(${180 - rot} ${-x} ${y})`} fill={url("gold")} stroke="#6E4F14" strokeWidth="0.8" />,
    );
  }
  return <g>{leaves}</g>;
}

function MedalEmblem({ level, url }: { level: number; url: Url }) {
  return (
    <g>
      {level === 6 && <circle r="98" fill={url("glow-gold")} />}
      <Laurel url={url} />
      <circle r="54" fill={url("gold")} stroke="#6E4F14" strokeWidth="2" />
      <circle r="44" fill={url("gold-dark")} />
      <circle r="44" fill="none" stroke="#FFF1C4" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 4" />
      <Star r={26} inner={11} fill={url("gold")} />
      <Shine d="M-54,0 A54,54 0 0 1 54,0 Q0,-20 -54,0 Z" url={url} />
      {level === 6 && <Crown y={-54} scale={0.9} url={url} />}
    </g>
  );
}

// ------------------------------------------------------------------ 7–8 kryształ

function CrystalEmblem({ level, url }: { level: number; url: Url }) {
  const rx = 84;
  const ry = 22;
  return (
    <g>
      {level === 8 && (
        <>
          <g transform="translate(20 -8)">
            <Wing side="right" scale={0.8} fill={url("platinum")} stroke="#4C627A" />
          </g>
          <g transform="translate(-20 -8)">
            <Wing side="left" scale={0.8} fill={url("platinum")} stroke="#4C627A" />
          </g>
        </>
      )}
      <g transform="rotate(-18)">
        <path d={`M${-rx},0 A${rx},${ry} 0 0 1 ${rx},0`} fill="none" stroke={url("platinum")} strokeWidth="3" strokeOpacity="0.7" />
      </g>
      {/* ścianki kryształu */}
      <polygon points="0,-74 44,-22 0,-10" fill="#F4FBFF" />
      <polygon points="0,-74 -44,-22 0,-10" fill="#CFE0EF" />
      <polygon points="-44,-22 0,-10 0,74" fill="#8DA6BF" />
      <polygon points="44,-22 0,-10 0,74" fill="#B9CEE3" />
      <polygon points="0,-74 44,-22 0,74 -44,-22" fill="none" stroke="#3E5268" strokeWidth="2" strokeLinejoin="round" />
      <path d="M-44,-22 L0,-10 L44,-22 M0,-10 L0,74" stroke="#3E5268" strokeOpacity="0.45" strokeWidth="1" fill="none" />
      <g transform="rotate(-18)">
        <path d={`M${-rx},0 A${rx},${ry} 0 0 0 ${rx},0`} fill="none" stroke={url("platinum")} strokeWidth="3.5" />
        <circle cx={rx * Math.cos(0.9)} cy={ry * Math.sin(0.9)} r="6" fill="#F4FBFF" />
      </g>
      <Sparkle x={-12} y={-50} r={8} fill="#fff" />
    </g>
  );
}

// ------------------------------------------------------------------ 9–10 planeta

function PlanetEmblem({ level, url }: { level: number; url: Url }) {
  const rx = 86;
  const ry = 20;
  return (
    <g>
      <circle r="98" fill={url("glow-purple")} />
      {level === 10 && (
        <>
          <Sparkle x={-78} y={-62} r={7} />
          <Sparkle x={80} y={-50} r={5} />
          <Sparkle x={70} y={70} r={6} />
          <Sparkle x={-70} y={64} r={4} />
          <Sparkle x={-40} y={-84} r={4} />
        </>
      )}
      <g transform="translate(24 0)">
        <Wing side="right" scale={0.76} fill={url("purple")} stroke="#D9B25F" />
      </g>
      <g transform="translate(-24 0)">
        <Wing side="left" scale={0.76} fill={url("purple")} stroke="#D9B25F" />
      </g>
      <g transform="rotate(-18)">
        <path d={`M${-rx},0 A${rx},${ry} 0 0 1 ${rx},0`} fill="none" stroke={url("gold")} strokeWidth="7" strokeOpacity="0.8" />
      </g>
      <circle r="46" fill={url("planet")} />
      <path d="M-44,-12 Q0,-22 44,-8 M-46,6 Q0,-2 46,12 M-40,22 Q0,16 38,28" stroke="#F1C9FF" strokeOpacity="0.25" strokeWidth="3" fill="none" />
      <g transform="rotate(-18)">
        <path d={`M${-rx},0 A${rx},${ry} 0 0 0 ${rx},0`} fill="none" stroke={url("gold")} strokeWidth="7" />
      </g>
      {level === 10 && (
        <>
          <ellipse cx="0" cy="-86" rx="30" ry="7" fill="none" stroke="#FFF1C4" strokeWidth="3" />
          <Crown y={-46} scale={0.85} url={url} />
        </>
      )}
    </g>
  );
}
