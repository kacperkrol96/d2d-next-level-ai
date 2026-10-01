import { CalendarClock, Clock } from "lucide-react";
import { Card, CardTitle, PageHeader } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { getDataSource } from "@/lib/data";
import { upcomingBriefings } from "@/lib/domain/rhythm";

const dayFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function MisjePage() {
  await requireUser();
  const config = await getDataSource().getConfig();
  const briefings = upcomingBriefings(new Date(), 7, config.rhythm, config.timeZone);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Misje" subtitle="Kalendarz, odprawy i spotkania" />
      <Card className="mb-4">
        <CardTitle hint="stałe wydarzenia">
          <span className="flex items-center gap-2">
            <CalendarClock size={16} className="text-accent-soft" /> Odprawy — najbliższe 7 dni
          </span>
        </CardTitle>
        <ul className="flex flex-col gap-2">
          {briefings.map((b) => (
            <li key={`${b.day}-${b.time}-${b.title}`} className="flex items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3 text-sm">
              <span>
                <span className="block">{b.title}</span>
                <span className="block text-xs capitalize text-muted">{dayFmt.format(new Date(`${b.day}T12:00:00Z`))} · {b.place}</span>
              </span>
              <span className="num text-lg font-semibold">{b.time}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Clock size={16} className="text-gold" /> Zamknij dzień
          </span>
        </CardTitle>
        <p className="text-sm text-muted">
          Każdy dzień pracy zamykasz podsumowaniem do <span className="num text-white">{config.rhythm.closeDayDeadline}</span>. Bez tego dzień się nie liczy, a aplikacja
          sama wystawia żółtą kartkę „Brak raportu”. Pełny kalendarz, spotkania i synchronizacja z Kalendarzem Google — w etapie Misji.
        </p>
      </Card>
    </div>
  );
}
