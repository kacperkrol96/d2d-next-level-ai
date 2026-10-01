import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { formById, SCALE_LABELS } from "@/lib/academy/forms";
import { requireRole } from "@/lib/auth/session";
import { getDataSource } from "@/lib/data";
import { canCoach } from "@/lib/services/academy";
import { sendForm } from "../../../../actions";

/** Karta managera: scenka D2 (oceny 1–5 + decyzja), obserwacja D3, obserwacja D4 (+ decyzja). */
export default async function KartaPage(props: PageProps<"/akademia/zespol/[personId]/karta/[formId]">) {
  const user = await requireRole(["sales", "manager", "admin"]);
  const { personId, formId } = await props.params;
  const { blad } = await props.searchParams;
  const [person, form] = [await canCoach(user, personId), formById(formId)];
  if (!person || !form) notFound();
  const { academy } = await getDataSource().getConfig();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/akademia/zespol" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={14} /> Zespół
      </Link>
      <h1 className="num text-2xl font-semibold">{form.title}</h1>
      <p className="mt-1 text-sm text-muted">{person.name} · wypełnia manager</p>
      <p className="mt-3 text-sm text-white/75">{form.purpose}</p>
      {typeof blad === "string" && <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{blad}</p>}

      <form action={sendForm} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="personId" value={person.id} />
        <input type="hidden" name="formId" value={form.id} />
        {form.sections.map((s) => (
          <Card key={s.title}>
            <CardTitle>{s.title}</CardTitle>
            <div className="flex flex-col gap-4">
              {s.items.map((it) => (
                <div key={it.id}>
                  <div className="text-sm">{it.label}</div>
                  {it.type === "scale" ? (
                    <>
                      {it.hint && <div className="text-xs text-muted">{it.hint}</div>}
                      <div className="mt-2 grid grid-cols-5 gap-1.5">
                        {SCALE_LABELS.map((label, i) => (
                          <label key={label} className="cursor-pointer">
                            <input type="radio" name={`f:${it.id}`} value={i + 1} className="peer sr-only" required />
                            <span className="flex flex-col items-center rounded-xl border border-line bg-card-2 py-2 text-xs peer-checked:border-accent-soft peer-checked:bg-accent/20">
                              <span className="num text-base">{i + 1}</span>
                              <span className="hidden text-[10px] text-muted sm:block">{label}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : it.type === "choice" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {it.options.map((o) => (
                        <label key={o} className="cursor-pointer">
                          <input type="radio" name={`f:${it.id}`} value={o} className="peer sr-only" />
                          <span className="block rounded-full border border-line bg-card-2 px-4 py-1.5 text-xs peer-checked:border-accent-soft peer-checked:bg-accent/20">{o}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      name={`f:${it.id}`}
                      type={it.type === "number" ? "number" : it.type === "time" ? "time" : "text"}
                      className="mt-1.5 w-full rounded-xl border border-line bg-card-2 px-3 py-2 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {form.decision && (
          <Card className="border-gold/30">
            <CardTitle>Decyzja managera</CardTitle>
            {form.scored && (
              <p className="mb-3 text-xs text-muted">
                Podpowiedź: zalecane min. {academy.scenkaRecommendedMin}/{form.sections.flatMap((x) => x.items).filter((i) => i.type === "scale").length * 5} pkt. Decyzja należy do
                managera.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {form.decision.options.map((o) => (
                <label key={o} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-card-2 px-4 py-3 text-sm">
                  <input type="radio" name="decision" value={o} required /> {o}
                </label>
              ))}
            </div>
          </Card>
        )}
        <button className="rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium">Zapisz kartę</button>
      </form>
    </div>
  );
}
