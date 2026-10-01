import Link from "next/link";
import { ArrowLeft, FileSignature, KeyRound, Palette, PlayCircle, ScrollText } from "lucide-react";
import { academyStages, academyVideos } from "@/lib/academy/content";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import type { ContractTrack } from "@/lib/contracts/types";
import type { ContractScrollTheme } from "@/lib/config/types";
import { getDataSource } from "@/lib/data";
import { currentContract } from "@/lib/domain/contract";
import { publishContract, setContractTheme, setExamVerified, setVideoLink } from "./actions";

const themes: { key: ContractScrollTheme; label: string; description: string }[] = [
  { key: "parchment", label: "Pergamin", description: "Zwój z drewnianymi wałkami i woskową pieczęcią" },
  { key: "cyberpunk", label: "Cyberpunk", description: "Neonowy hologram z efektem skanowania" },
  { key: "retro", label: "Retro-gra", description: "Piksele, neon i dźwięk „level start”" },
];
const trackLabel: Record<ContractTrack, string> = { auditor: "Kontrakt audytora", sales: "Kontrakt handlowca" };
const stamp = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Warsaw" });

export default async function UstawieniaPage({ searchParams }: PageProps<"/mennica/ustawienia">) {
  await requireRole(["admin"]);
  const source = getDataSource();
  const [config, versions, acceptances, users, params, links] = await Promise.all([
    source.getConfig(),
    source.contractVersions(),
    source.contractAcceptances(),
    source.listUsers(),
    searchParams,
    source.videoLinks(),
  ]);
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const error = typeof params.blad === "string" ? params.blad : null;
  const ok = typeof params.ok === "string" ? params.ok : null;
  const waiting = users.filter((u) => {
    if (!u.track) return false;
    const current = currentContract(versions, u.track);
    return current && !acceptances.some((a) => a.userId === u.id && a.track === u.track && a.version === current.version);
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/mennica" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={14} /> Mennica
      </Link>
      <PageHeader title="Ustawienia" subtitle="Panel Zarządu — kontrakty, wygląd zwoju, filmy Akademii" />
      {error && <p className="mb-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
      {ok && <p className="mb-4 rounded-2xl bg-earned/10 px-4 py-3 text-sm text-earned">{ok}</p>}

      <Card className="mb-4">
        <CardTitle>
          <span className="flex items-center gap-2">
            <Palette size={16} className="text-accent-soft" /> Motyw zwoju kontraktu
          </span>
        </CardTitle>
        <form action={setContractTheme} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themes.map((t) => (
            <button
              key={t.key}
              name="theme"
              value={t.key}
              className={`rounded-2xl border p-4 text-left transition ${config.contractScrollTheme === t.key ? "border-gold bg-gold/[0.08]" : "border-line bg-card-2 hover:bg-white/[0.06]"}`}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="mt-1 text-xs text-muted">{t.description}</div>
            </button>
          ))}
        </form>
      </Card>

      {(["auditor", "sales"] as const).map((track) => {
        const current = currentContract(versions, track);
        const history = versions.filter((v) => v.track === track);
        return (
          <Card key={track} className="mb-4">
            <div id={`kontrakt-${track}`} />
            <CardTitle hint={current ? `wersja ${current.version} · ${stamp.format(new Date(current.publishedAt))}` : "brak"}>
              <span className="flex items-center gap-2">
                <ScrollText size={16} className="text-accent-soft" /> {trackLabel[track]}
              </span>
            </CardTitle>
            <form action={publishContract} className="flex flex-col gap-3">
              <input type="hidden" name="track" value={track} />
              <input name="title" defaultValue={current?.title ?? trackLabel[track]} className="rounded-2xl border border-line bg-card-2 px-4 py-3 text-sm" />
              <textarea
                name="body"
                defaultValue={current?.body ?? ""}
                rows={12}
                className="rounded-2xl border border-line bg-card-2 px-4 py-3 font-mono text-xs leading-relaxed"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Publikacja tworzy nową wersję — każda osoba z tej ścieżki zaakceptuje ją ponownie przy następnym wejściu.</p>
                <button className="rounded-full bg-accent px-5 py-2 text-sm font-medium transition hover:bg-accent-soft">Opublikuj nową wersję</button>
              </div>
            </form>
            {history.length > 1 && (
              <p className="mt-3 text-xs text-muted">
                Historia: {history.map((v) => `v${v.version} (${stamp.format(new Date(v.publishedAt))}, ${name(v.publishedBy)})`).join(" · ")}
              </p>
            )}
          </Card>
        );
      })}

      <Card className="mb-4">
        <div id="egzaminy" />
        <CardTitle>
          <span className="flex items-center gap-2">
            <KeyRound size={16} className="text-accent-soft" /> Egzaminy — klucze zweryfikowane
          </span>
        </CardTitle>
        <p className="mb-3 text-xs text-muted">
          Klucze odpowiedzi odtworzono z materiałów (PDF zgubił zaznaczenia) — lista do sprawdzenia: docs/tresci/KLUCZE_DO_WERYFIKACJI.md. Dopóki przełącznik jest wyłączony,
          egzamin działa w trybie próbnym: wynik nie odblokowuje etapu.
        </p>
        <ul className="flex flex-col gap-2">
          {academyStages.flatMap((st) =>
            st.gates.flatMap((g) => {
              if (g.kind !== "exam") return [];
              const on = config.academy.verifiedExams[g.examId] === true;
              return [
                <li key={g.examId}>
                  <form action={setExamVerified} className="flex items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3">
                    <input type="hidden" name="examId" value={g.examId} />
                    <input type="hidden" name="on" value={on ? "0" : "1"} />
                    <span className="text-sm">
                      Egzamin {st.code} — {st.title}
                      <span className={`ml-2 text-[11px] ${on ? "text-earned" : "text-gold"}`}>{on ? "zweryfikowane" : "tryb próbny"}</span>
                    </span>
                    <button
                      role="switch"
                      aria-checked={on}
                      aria-label={`Klucze zweryfikowane: egzamin ${st.code}`}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-earned" : "bg-white/15"}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
                    </button>
                  </form>
                </li>,
              ];
            }),
          )}
        </ul>
      </Card>

      <Card className="mb-4">
        <div id="filmy" />
        <CardTitle hint={`${Object.keys(links).length}/${academyVideos.length} przypisanych`}>
          <span className="flex items-center gap-2">
            <PlayCircle size={16} className="text-accent-soft" /> Filmy Akademii
          </span>
        </CardTitle>
        <p className="mb-3 text-xs text-muted">
          Wklej link do filmu z firmowego YouTube (ustawiony jako „Niepubliczny”). Link nie jest pokazywany w aplikacji — film odtwarza się we własnym odtwarzaczu, tylko po zalogowaniu.
          Bez linku lekcja pokazuje atrapę.
        </p>
        <ul className="flex flex-col gap-2">
          {academyVideos.map((v) => (
            <li key={v.key}>
              <form action={setVideoLink} className="flex flex-col gap-2 rounded-2xl bg-card-2 px-4 py-3 sm:flex-row sm:items-center">
                <input type="hidden" name="key" value={v.key} />
                <span className="text-sm sm:w-56 sm:shrink-0">
                  <span className="num mr-2 text-muted">{v.key}</span>
                  {v.title}
                  <span className={`ml-2 text-[11px] ${links[v.key] ? "text-earned" : "text-muted"}`}>{links[v.key] ? "✓ przypisany" : "atrapa"}</span>
                </span>
                <input name="url" placeholder="https://youtu.be/…" className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm" />
                <button className="rounded-full bg-accent px-4 py-2 text-xs font-medium">Zapisz</button>
              </form>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle hint={`${acceptances.length}`}>
          <span className="flex items-center gap-2">
            <FileSignature size={16} className="text-accent-soft" /> Rejestr akceptacji
          </span>
        </CardTitle>
        {waiting.length > 0 && (
          <p className="mb-3 rounded-2xl bg-gold/[0.08] px-4 py-2 text-xs text-gold">Czeka na akceptację: {waiting.map((u) => u.name).join(", ")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {acceptances.map((a) => (
            <li key={`${a.userId}-${a.track}-${a.version}`} className="flex items-center gap-3 rounded-2xl bg-card-2 px-4 py-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.signature} alt="Podpis" className="h-10 w-24 shrink-0 rounded-lg bg-white object-contain" />
              <div className="min-w-0">
                <div>{name(a.userId)}</div>
                <div className="text-xs text-muted">
                  {trackLabel[a.track]} · wersja {a.version} · {stamp.format(new Date(a.acceptedAt))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
