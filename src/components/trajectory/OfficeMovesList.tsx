import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import type { OfficeMove } from "@/lib/services/trajectory";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });

/** Ostatnie ruchy biura — dowód, że biuro pracuje, bez wchodzenia do CRM. */
export function OfficeMovesList({ moves, limit = 5 }: { moves: OfficeMove[]; limit?: number }) {
  if (moves.length === 0) return <p className="text-sm text-muted">Brak zmian w ostatnich dniach.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {moves.slice(0, limit).map((m) => (
        <li key={`${m.agreementNumber}-${m.at}`}>
          <Link href={`/skarbiec/klient/${m.clientId}`} className="flex items-center gap-3 rounded-2xl bg-card-2 px-4 py-3 transition hover:bg-white/[0.06]">
            <Building2 size={16} className="shrink-0 text-accent-soft" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {m.clientName} <span className="num text-xs text-muted">· {m.agreementNumber}</span>
              </div>
              <div className="truncate text-xs text-muted">
                → <span className="text-white/85">{m.to}</span> · {dateFmt.format(new Date(m.at))}
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
