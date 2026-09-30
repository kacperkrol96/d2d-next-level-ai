import { redirect } from "next/navigation";
import { demoLogin } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { demoUsers, roleLabels } from "@/lib/auth/users";
import { Avatar } from "@/components/orbit/Avatar";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/kokpit");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pb-12 pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-accent/25 blur-[120px]" />
      <div className="relative w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <Avatar level={10} size={120} />
          <h1 className="num mt-6 text-3xl font-semibold">D2D Next Level</h1>
          <p className="mt-2 text-muted">Next Level Energy · Fundusz Remontowy</p>
        </div>

        <div className="card p-6">
          <button
            disabled
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/90 py-3.5 font-medium text-black opacity-40"
            title="Logowanie Google Workspace włączymy w Etapie 1"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Zaloguj kontem firmowym Google
          </button>
          <p className="mt-2 text-center text-xs text-muted">Logowanie Google włączymy w Etapie 1.</p>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-line" />
            TRYB TESTOWY — wybierz osobę
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="flex flex-col gap-2">
            {demoUsers.map((u) => (
              <form key={u.id} action={demoLogin}>
                <input type="hidden" name="userId" value={u.id} />
                <button className="flex w-full items-center justify-between rounded-2xl border border-line bg-card-2 px-4 py-3.5 text-left transition hover:border-accent/60 active:scale-[0.99]">
                  <span>
                    <span className="block font-medium">{u.name}</span>
                    <span className="block text-xs text-muted">{u.email}</span>
                  </span>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent-soft">{roleLabels[u.role]}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
