import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireRole } from "@/lib/auth/session";

export default async function MennicaPage() {
  await requireRole(["admin"]);
  return (
    <ComingSoon
      title="Mennica"
      subtitle="Rozliczenia zarządu"
      stage="Etap 3"
      features={["Rozliczenie okresu liczone automatycznie (CRM + tabele + KPI)", "Akceptacja lub korekta z powodem i pełną historią zmian", "B2B: dane do faktury · Umowa zlecenia: rachunek PDF wysyłany mailem"]}
    />
  );
}
