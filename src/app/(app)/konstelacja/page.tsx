import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireRole } from "@/lib/auth/session";

export default async function KonstelacjaPage() {
  await requireRole(["sales", "manager", "admin"]);
  return (
    <ComingSoon
      title="Konstelacja"
      subtitle="Twoja struktura jako gwiazdozbiór"
      stage="Etap 3 — razem z Wieżą"
      features={[
        "Na górze: „Twój zarobek ze struktury w tym miesiącu” (dyferencja + opieka nad zespołem) z animacją licznika",
        "Manager w centrum, handlowcy wokół, pod nimi audytorzy — awatary poziomów i linie powiązań",
        "Jasność gwiazdy = aktywność w tym tygodniu, kolor = alert",
        "Kliknięcie w osobę: jej klienci, KPI i ile zarobiłeś dzięki niej",
        "Eskadry: zewnętrzne grupy sprzedażowe z własnym liderem i zasadami (przełącznik w panelu admina)",
      ]}
    />
  );
}
