import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth/session";
import { getReview } from "@/lib/services/academy";
import { sendReview } from "../../../../actions";

const pts = (n: number) => String(n).replace(".", ",");

/** Ocena egzaminu przez managera: zamknięte policzone automatycznie, otwarte — punkty managera wg wzorca. */
export default async function OcenaPage(props: PageProps<"/akademia/zespol/[personId]/ocena/[attemptId]">) {
  const user = await requireRole(["manager", "admin"]);
  const { personId, attemptId } = await props.params;
  const { blad } = await props.searchParams;
  const data = await getReview(user, personId, attemptId);
  if (!data) notFound();
  const { person, attempt, exam } = data;
  const reviewed = attempt.review !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/akademia/zespol" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
        <ArrowLeft size={14} /> Zespół
      </Link>
      <h1 className="num text-2xl font-semibold">{exam.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {person.name} · pytania zamknięte: <span className="num text-white">{pts(attempt.autoPoints)} pkt</span> · próg {data.passPoints}/{data.maxPoints} pkt
      </p>
      {typeof blad === "string" && <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{blad}</p>}

      <form action={sendReview} className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="personId" value={person.id} />
        <input type="hidden" name="attemptId" value={attempt.id} />
        {exam.questions.map((q, i) => {
          const answer = attempt.answers[q.id];
          if (q.type === "choice") {
            const ok = answer === q.correctIndex;
            return (
              <Card key={q.id} className="opacity-80">
                <div className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 ${ok ? "text-earned" : "text-danger"}`}>{ok ? <Check size={16} /> : <X size={16} />}</span>
                  <div>
                    <div>
                      {i + 1}. {q.text}
                    </div>
                    <div className="text-xs text-muted">Odpowiedź: {typeof answer === "number" ? q.options?.[answer] : "—"} · sprawdzone automatycznie</div>
                  </div>
                </div>
              </Card>
            );
          }
          return (
            <Card key={q.id}>
              <div className="text-sm font-medium">
                {i + 1}. {q.text}
              </div>
              {q.items && <div className="mt-1 text-xs text-muted">Elementy: {q.items.map((it, k) => `${String.fromCharCode(65 + k)}. ${it}`).join(" · ")}</div>}
              <div className="mt-3 rounded-2xl bg-card-2 px-4 py-3 text-sm whitespace-pre-wrap">{typeof answer === "string" ? answer : <span className="text-muted">brak odpowiedzi</span>}</div>
              {q.modelAnswer && <div className="mt-2 rounded-2xl border border-line px-4 py-3 text-xs text-white/70">Wzorzec: {q.modelAnswer}</div>}
              {q.points > 0 ? (
                <label className="mt-3 flex items-center justify-end gap-2 text-sm">
                  Punkty (0–{pts(q.points)})
                  <input
                    name={`pts:${q.id}`}
                    type="number"
                    min={0}
                    max={q.points}
                    step={q.points < 1 ? 0.25 : 0.5}
                    required
                    disabled={reviewed}
                    defaultValue={attempt.review?.points[q.id]}
                    className="num w-24 rounded-xl border border-line bg-card-2 px-3 py-2 text-right"
                  />
                </label>
              ) : (
                <p className="mt-2 text-right text-xs text-muted">bez punktów — do rozmowy</p>
              )}
            </Card>
          );
        })}
        <textarea name="comment" rows={3} placeholder="Komentarz dla osoby (opcjonalnie)" disabled={reviewed} defaultValue={attempt.review?.comment} className="rounded-2xl border border-line bg-card-2 px-4 py-3 text-sm" />
        {!reviewed && <button className="rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium">Zapisz ocenę</button>}
      </form>
    </div>
  );
}
