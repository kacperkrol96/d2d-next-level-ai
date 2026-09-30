import { formatPLN } from "@/lib/domain/money";
import type { SettlementLine } from "@/lib/domain/settlement";

const monthFmt = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" });

/** Pozycje rozliczenia — „Flota” zawsze jako osobna pozycja. */
export function SettlementLines({
  lines,
  payable,
  carryOver,
  fleetMonths,
}: {
  lines: SettlementLine[];
  payable: number;
  carryOver: number;
  fleetMonths: string[];
}) {
  return (
    <div>
      <ul className="flex flex-col divide-y divide-line text-sm">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center justify-between gap-3 py-3">
            <span className="text-muted">
              {l.label}
              {l.key === "fleet" && fleetMonths.length > 0 && (
                <span className="ml-1 text-xs">· za {fleetMonths.map((m) => monthFmt.format(new Date(`${m}-01T00:00:00Z`))).join(", ")}</span>
              )}
            </span>
            <span className={`num shrink-0 ${l.amount < 0 ? "text-danger" : ""}`}>
              {l.amount < 0 ? "−" : ""}
              {formatPLN(Math.abs(l.amount))}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm">Do wypłaty</span>
        <span className="num text-2xl font-semibold text-earned">{formatPLN(payable)}</span>
      </div>
      {carryOver > 0 && <p className="mt-2 text-xs text-muted">Do potrącenia w kolejnym okresie: {formatPLN(carryOver)}</p>}
    </div>
  );
}
