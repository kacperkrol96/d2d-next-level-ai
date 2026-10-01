import type { AgreementScope, CrmRules, StatusCategory } from "@/lib/config/types";
import type { CrmAgreement } from "@/lib/crm/types";
import { effectiveStatus, normalize, statusCategory } from "./agreements";

/**
 * Trajektoria = droga umowy przez statusy CRM: przebyte statusy z datami,
 * obecny, kolejny krok i ile kroków do zielonej prowizji.
 */

export type StepState = "done" | "skipped" | "current" | "next" | "todo";

export interface TrajectoryStep {
  status: string;
  state: StepState;
  /** Data pierwszego wejścia w status (ISO) lub null, gdy jeszcze nie był / pominięty. */
  enteredAt: string | null;
  /** Ten status zaczyna zieloną prowizję (lub szarą audytora). */
  marker: "green" | "grey" | null;
}

export interface Trajectory {
  agreementId: string;
  number: string;
  type: string;
  scope: AgreementScope | null;
  currentStatus: string | null;
  currentAt: string | null;
  /** Umowa w statusie negatywnym. */
  negative: boolean;
  /** Obecny status spoza ścieżki (nieznany) — do wyjaśnienia. */
  unknown: boolean;
  steps: TrajectoryStep[];
  /** Statusy negatywne z historii (z datami). */
  negativeEvents: { status: string; at: string }[];
  nextStatus: string | null;
  greenStatus: string | null;
  /** Ile kroków ścieżki do zielonej prowizji (0 = już zielona, null = nie dotyczy / negatywna). */
  stepsToGreen: number | null;
}

const targetCategory = (scope: AgreementScope | null): StatusCategory | null =>
  scope === "audit" ? "auditor_earned" : scope === "thermo" || scope === "heatSource" ? "sales_earned" : null;

export function buildTrajectory(agreement: CrmAgreement, scope: AgreementScope | null, rules: CrmRules): Trajectory {
  const typeConfig = rules.agreementTypes.find((t) => normalize(t.name) === normalize(agreement.type));
  const category = (status: string) => statusCategory(agreement.type, status, rules);
  const path = (typeConfig?.path ?? []).filter((s) => {
    const c = category(s);
    return c !== "negative" && c !== "ignored";
  });
  const history = [...agreement.statusHistory].sort((a, b) => a.at.localeCompare(b.at));
  const firstEntry = (status: string) => history.find((h) => normalize(h.status) === normalize(status))?.at ?? null;

  const current = effectiveStatus(agreement, rules);
  const currentCategory = current ? category(current.status) : "unknown";
  const negative = currentCategory === "negative";

  // Indeks postępu: obecny status albo — przy negatywnym — ostatni status ze ścieżki przed nim.
  const indexOf = (status: string) => path.findIndex((p) => normalize(p) === normalize(status));
  let progressIndex = current ? indexOf(current.status) : -1;
  if (progressIndex === -1 && negative) {
    for (const h of history) progressIndex = Math.max(progressIndex, indexOf(h.status));
  }
  const unknown = !negative && progressIndex === -1 && current !== null;

  const target = targetCategory(scope);
  const greenIndex = target ? path.findIndex((s) => category(s) === target) : -1;
  const greyIndex = scope === "audit" ? path.findIndex((s) => category(s) === "auditor_grey") : -1;

  const steps: TrajectoryStep[] = path.map((status, i) => {
    const enteredAt = firstEntry(status);
    let state: StepState;
    if (i < progressIndex) state = enteredAt ? "done" : "skipped";
    else if (i === progressIndex) state = negative ? "done" : "current";
    else if (i === progressIndex + 1 && !negative && !unknown) state = "next";
    else state = "todo";
    return { status, state, enteredAt, marker: i === greenIndex ? "green" : i === greyIndex ? "grey" : null };
  });

  const stepsToGreen = negative || unknown || greenIndex === -1 ? null : Math.max(0, greenIndex - progressIndex);

  return {
    agreementId: agreement.id,
    number: agreement.number,
    type: agreement.type,
    scope,
    currentStatus: current?.status ?? null,
    currentAt: current?.at ?? null,
    negative,
    unknown,
    steps,
    negativeEvents: history.filter((h) => category(h.status) === "negative").map((h) => ({ status: h.status, at: h.at })),
    nextStatus: steps.find((s) => s.state === "next")?.status ?? null,
    greenStatus: greenIndex >= 0 ? path[greenIndex] : null,
    stepsToGreen,
  };
}

export interface StatusChange {
  agreementId: string;
  number: string;
  clientId: string;
  from: string | null;
  to: string;
  at: string;
}

/** Zmiany statusów po `since` (najnowsze pierwsze), bez statusów ignorowanych. */
export function statusChangesSince(agreements: readonly CrmAgreement[], since: Date, rules: CrmRules): StatusChange[] {
  const changes: StatusChange[] = [];
  for (const a of agreements) {
    const history = [...a.statusHistory]
      .sort((x, y) => x.at.localeCompare(y.at))
      .filter((h) => statusCategory(a.type, h.status, rules) !== "ignored");
    history.forEach((h, i) => {
      if (new Date(h.at) > since) changes.push({ agreementId: a.id, number: a.number, clientId: a.clientId, from: history[i - 1]?.status ?? null, to: h.status, at: h.at });
    });
  }
  return changes.sort((x, y) => y.at.localeCompare(x.at));
}
