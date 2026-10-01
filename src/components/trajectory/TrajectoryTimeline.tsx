import { AlertTriangle, Check, CircleDashed } from "lucide-react";
import type { Trajectory } from "@/lib/domain/trajectory";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
const fmt = (iso: string) => dateFmt.format(new Date(iso));

const scopeTone: Record<string, string> = {
  thermo: "bg-accent/15 text-accent-soft",
  heatSource: "bg-gold/15 text-gold",
  audit: "bg-white/10 text-white/80",
  rek: "bg-white/5 text-muted",
};

export type ViewerRole = "sales" | "auditor";

/** Co dla tej osoby oznacza zielony status umowy: jej prowizję, bonus audytora czy nic. */
function meaning(t: Trajectory, role: ViewerRole): "commission" | "bonus" | null {
  const sale = t.scope === "thermo" || t.scope === "heatSource";
  if (role === "sales") return sale ? "commission" : null;
  return t.scope === "audit" ? "commission" : sale ? "bonus" : null;
}

const plural = (n: number) => (n === 1 ? "krok" : n < 5 ? "kroki" : "kroków");

export function StepsToGreen({ t, role }: { t: Trajectory; role: ViewerRole }) {
  if (t.negative) return <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">Status negatywny</span>;
  if (t.unknown) return <span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-gold">Do wyjaśnienia</span>;
  const m = meaning(t, role);
  if (t.stepsToGreen === null || m === null) return null;
  if (t.stepsToGreen === 0) {
    return <span className="rounded-full bg-earned/15 px-3 py-1 text-xs text-earned">{m === "bonus" ? "Bonus za zamknięcie" : "Prowizja zielona"}</span>;
  }
  return (
    <span className="num rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/85">
      {t.stepsToGreen} {plural(t.stepsToGreen)} {m === "bonus" ? "do bonusu" : "do zielonej"}
    </span>
  );
}

/** Droga umowy przez statusy CRM: przebyte z datami, obecny podświetlony, kolejny krok. */
export function TrajectoryTimeline({ t, scopeLabel, role }: { t: Trajectory; scopeLabel: string | null; role: ViewerRole }) {
  const m = meaning(t, role);
  const greenLabel = m === "commission" ? "zielona prowizja" : m === "bonus" ? "bonus audytora" : t.scope === "audit" ? "prowizja audytora" : "prowizja handlowca";
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${scopeTone[t.scope ?? ""] ?? "bg-white/5 text-muted"}`}>{scopeLabel ?? "Zakres nierozpoznany"}</span>
          <span className="num truncate text-xs text-muted">{t.number}</span>
        </div>
        <StepsToGreen t={t} role={role} />
      </div>

      {t.negativeEvents.map((e) => (
        <div key={e.at} className="mb-3 flex items-center gap-2 rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">
          <AlertTriangle size={15} /> {e.status} <span className="ml-auto text-xs opacity-80">{fmt(e.at)}</span>
        </div>
      ))}
      {t.unknown && (
        <div className="mb-3 rounded-2xl bg-gold/10 px-4 py-2.5 text-sm text-gold">
          Status „{t.currentStatus}” nie jest w tabeli statusów — sprawa trafiła do „Do wyjaśnienia”.
        </div>
      )}

      <ol className="relative">
        {t.steps.map((s, i) => {
          const last = i === t.steps.length - 1;
          return (
            <li key={s.status} className="relative flex gap-4 pb-4">
              {!last && (
                <span
                  className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-px ${s.state === "done" || s.state === "skipped" ? "bg-accent-soft/50" : "bg-white/10"}`}
                />
              )}
              <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                {s.state === "current" && <span className="absolute inset-0 animate-ping rounded-full bg-accent-soft/40" />}
                {s.state === "done" && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft/90">
                    <Check size={13} strokeWidth={3} className="text-bg" />
                  </span>
                )}
                {s.state === "skipped" && <span className="h-3 w-3 rounded-full border border-accent-soft/60" />}
                {s.state === "current" && <span className="relative h-6 w-6 rounded-full border-2 border-accent-soft bg-accent shadow-[0_0_18px_rgba(181,76,224,0.7)]" />}
                {s.state === "next" && <CircleDashed size={22} className="text-white/70" />}
                {s.state === "todo" && <span className="h-2.5 w-2.5 rounded-full bg-white/15" />}
              </span>
              <div className={`min-w-0 flex-1 ${s.state === "current" ? "-mx-2 -my-1 rounded-2xl bg-accent/10 px-3 py-1.5" : ""}`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`text-sm ${s.state === "todo" ? "text-white/35" : s.state === "skipped" ? "text-white/45" : s.state === "current" ? "font-medium text-white" : "text-white/85"}`}
                  >
                    {s.status}
                  </span>
                  {s.marker === "green" && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${m ? "bg-earned/15 text-earned" : "bg-white/10 text-muted"}`}>{greenLabel}</span>
                  )}
                  {s.marker === "grey" && m === "commission" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted">szara prowizja</span>}
                </div>
                <div className="text-xs text-muted">
                  {s.state === "current" && s.enteredAt && <>teraz · od {fmt(s.enteredAt)}</>}
                  {s.state === "done" && s.enteredAt && fmt(s.enteredAt)}
                  {s.state === "skipped" && "pominięty"}
                  {s.state === "next" && "następny krok"}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
