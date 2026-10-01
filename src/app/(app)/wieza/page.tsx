import Link from "next/link";
import { AlertTriangle, Construction, GraduationCap, ShieldCheck, Star, TriangleAlert, Users } from "lucide-react";
import { Avatar } from "@/components/orbit/Avatar";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/users";
import { getDataSource } from "@/lib/data";
import { getTower } from "@/lib/services/tower";
import { issueDiscipline, judgeReview, setAuditorPlan } from "./actions";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

export default async function WiezaPage(props: PageProps<"/wieza">) {
  const user = await requireRole(["sales", "manager", "admin"]);
  const [data, config, params] = await Promise.all([getTower(user), getDataSource().getConfig(), props.searchParams]);
  const error = typeof params.blad === "string" ? params.blad : null;
  const ok = typeof params.ok === "string" ? params.ok : null;
  const auditors = data.members.filter((m) => m.person.track === "auditor");
  const reasons = Object.entries(config.cards.yellowReasons).filter(([k]) => k !== "kpi_below_minimum" && k !== "no_report");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Wieża" subtitle="Panel managera — zespół, alerty, kartki, opinie 5★" />
      {error && <p className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {ok && <p className="mb-4 rounded-2xl bg-earned/10 px-4 py-3 text-sm text-earned">{ok}</p>}

      {data.members.length === 0 ? (
        <Card>Nie masz jeszcze nikogo w zespole.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className={data.alerts.length ? "border-gold/30" : ""}>
            <CardTitle hint={`${data.alerts.length}`}>
              <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-gold" /> Alerty
              </span>
            </CardTitle>
            {data.alerts.length === 0 ? (
              <p className="text-sm text-muted">Bez alertów — zespół na kursie.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.alerts.map((a, i) => (
                  <li key={i} className={`rounded-2xl px-4 py-2.5 text-sm ${a.tone === "danger" ? "bg-danger/10 text-danger" : "bg-gold/[0.08] text-white/90"}`}>
                    <span className="font-medium">{a.person}</span> · {a.text}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle hint={`${data.members.length} os.`}>
              <span className="flex items-center gap-2">
                <Users size={16} className="text-accent-soft" /> Zespół
              </span>
            </CardTitle>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.members.map((m) => (
                <div key={m.person.id} className="rounded-2xl bg-card-2 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar level={m.orbit?.level ?? 1} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{m.person.name}</div>
                      <div className="text-xs text-muted">
                        {roleLabels[m.person.role]} · poz. {m.orbit?.level ?? "—"}
                        {m.plan && ` · ${m.plan === "safety" ? "Safety" : "Next Level"}`}
                      </div>
                    </div>
                    {m.alerts.length > 0 && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold">{m.alerts.length}</span>}
                  </div>
                  {m.orbit && (
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-muted">KPI</div>
                        <div className={`num text-base font-semibold ${m.orbit.kpi.belowMinimum ? "text-danger" : ""}`}>{m.orbit.kpi.score}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">Mnożnik</div>
                        <div className="num text-base font-semibold text-gold">{Math.round(m.orbit.kpi.multiplier * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">Nagrania</div>
                        <div className={`num text-base font-semibold ${m.orbit.recordings.ok ? "text-earned" : "text-gold"}`}>{Math.round(m.orbit.recordings.share * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">Kartki</div>
                        <div className={`num text-base font-semibold ${m.orbit.discipline.red.red ? "text-danger" : ""}`}>{m.orbit.discipline.red.counts.yellowCards}</div>
                      </div>
                    </div>
                  )}
                  {m.academy && (
                    <Link href="/akademia/zespol" className="mt-3 flex items-center justify-between rounded-xl bg-card px-3 py-2 text-xs">
                      <span className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-accent-soft" /> Akademia: {m.academy.current ? `etap ${m.academy.current.stage.code}` : "ukończona"} · {Math.round(m.academy.progress * 100)}%
                      </span>
                      {(m.academy.pendingReviews.length > 0 || m.academy.formsToFill.length > 0) && <span className="text-gold">do zrobienia →</span>}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <div id="kartki" />
              <CardTitle>
                <span className="flex items-center gap-2">
                  <TriangleAlert size={16} className="text-gold" /> Kartka / spóźnienie / nieobecność
                </span>
              </CardTitle>
              <form action={issueDiscipline} className="flex flex-col gap-3">
                <select name="personId" required className="rounded-xl border border-line bg-card-2 px-3 py-2.5 text-sm">
                  {data.members.map((m) => (
                    <option key={m.person.id} value={m.person.id}>
                      {m.person.name}
                    </option>
                  ))}
                </select>
                <select name="kind" required className="rounded-xl border border-line bg-card-2 px-3 py-2.5 text-sm">
                  <optgroup label="Żółta kartka">
                    {reasons.map(([k, label]) => (
                      <option key={k} value={k}>
                        Żółta kartka — {label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Zdarzenie">
                    <option value="late">Spóźnienie</option>
                    <option value="absence">Nieobecność</option>
                  </optgroup>
                </select>
                <textarea name="note" rows={2} placeholder="Uzasadnienie (wymagane przy kartce)" className="rounded-xl border border-line bg-card-2 px-3 py-2.5 text-sm" />
                <button className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium">Zapisz</button>
                <p className="text-[11px] text-muted">
                  Czerwona kartka: {config.cards.red.lateness} spóźnienia, {config.cards.red.absences} nieobecności albo {config.cards.red.yellowCards} żółte kartki w {config.cards.red.windowDays} dni. „Brak raportu” i „KPI &lt; 30” aplikacja nadaje sama.
                </p>
              </form>
            </Card>

            <Card>
              <div id="system" />
              <CardTitle>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent-soft" /> System audytora
                </span>
              </CardTitle>
              {auditors.length === 0 ? (
                <p className="text-sm text-muted">Brak audytorów w zespole.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {auditors.map((m) => (
                    <form key={m.person.id} action={setAuditorPlan} className="flex flex-col gap-2 rounded-2xl bg-card-2 p-3">
                      <input type="hidden" name="personId" value={m.person.id} />
                      <input type="hidden" name="plan" value={m.plan === "safety" ? "nextLevel" : "safety"} />
                      <input type="hidden" name="temporary" value={m.plan === "safety" ? "0" : "1"} />
                      <div className="text-sm">
                        {m.person.name} · teraz <b>{m.plan === "safety" ? "Safety" : "Next Level"}</b>
                        {m.orbit?.plan && m.plan === "safety" && (
                          <span className="text-xs text-muted"> · {m.orbit.plan.measurements} pomiarów w miesiącu</span>
                        )}
                      </div>
                      <input name="reason" required placeholder={m.plan === "safety" ? "Powód przejścia na Next Level" : "Powód czasowego powrotu (choroba / wypadek)"} className="rounded-xl border border-line bg-card px-3 py-2 text-sm" />
                      <button className="self-start rounded-full bg-accent px-4 py-2 text-xs font-medium">
                        {m.plan === "safety" ? "Przenieś na Next Level" : "Czasowo na Safety"}
                      </button>
                    </form>
                  ))}
                  <p className="text-[11px] text-muted">Zmiana tylko Safety → Next Level; powrót na Safety wyłącznie czasowo (choroba / wypadek).</p>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <div id="opinie" />
            <CardTitle hint={`${data.reviews.length} do decyzji`}>
              <span className="flex items-center gap-2">
                <Star size={16} className="text-gold" /> Opinie 5★
              </span>
            </CardTitle>
            {data.reviews.length === 0 ? (
              <p className="text-sm text-muted">Brak opinii do zatwierdzenia.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-card-2 p-4">
                    <div className="text-sm font-medium">
                      {r.clientName} <span className="text-xs text-muted">· {r.personName} · {dateFmt.format(new Date(r.submittedAt))}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.screenshot && <img src={r.screenshot} alt="Screenshot opinii" className="aspect-[8/5] w-full rounded-xl object-cover" />}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.photo && <img src={r.photo} alt="Zdjęcie z klientem" className="aspect-[8/5] w-full rounded-xl object-cover" />}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Odczyt AI: {r.ai.stars !== null ? `${r.ai.stars}★` : "—"} · {r.ai.reviewerName ?? "nazwisko nieodczytane"} · {r.ai.date ?? "brak daty"} · zgoda na zdjęcie: {r.photoConsent ? "tak" : "NIE"}
                    </p>
                    {[...r.checks.blocking, ...r.checks.warnings].map((w) => (
                      <p key={w} className={`mt-1 text-xs ${r.checks.blocking.includes(w) ? "text-danger" : "text-gold"}`}>
                        {w}
                      </p>
                    ))}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={judgeReview}>
                        <input type="hidden" name="reviewId" value={r.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button disabled={r.checks.blocking.length > 0} className="rounded-full bg-earned/90 px-4 py-2 text-xs font-medium text-bg disabled:opacity-30">
                          Zatwierdź
                        </button>
                      </form>
                      <form action={judgeReview} className="flex flex-1 gap-2">
                        <input type="hidden" name="reviewId" value={r.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <input name="reason" required placeholder="Powód odrzucenia" className="min-w-0 flex-1 rounded-full border border-line bg-card px-3 py-2 text-xs" />
                        <button className="rounded-full border border-line px-4 py-2 text-xs">Odrzuć</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted">Screenshot i zdjęcie usuwamy automatycznie {config.reviews.fileRetentionDays} dni po decyzji.</p>
          </Card>

          <Card className="opacity-80">
            <CardTitle>
              <span className="flex items-center gap-2">
                <Construction size={16} className="text-muted" /> Wkrótce w Wieży
              </span>
            </CardTitle>
            <ul className="grid grid-cols-1 gap-2 text-sm text-muted sm:grid-cols-3">
              <li className="rounded-2xl bg-card-2 p-3">Alert „puste przejścia” (GPS vs odhaczone domy) — Terytorium</li>
              <li className="rounded-2xl bg-card-2 p-3">Wyjątki od reguły „Nie ma w aplikacji = nie ma klienta” — Radar i Misje</li>
              <li className="rounded-2xl bg-card-2 p-3">Odsłuch nagrań rozmów — Radar i Misje</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
