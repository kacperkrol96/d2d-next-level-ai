import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireRole } from "@/lib/auth/session";

export default async function WiezaPage() {
  await requireRole(["sales", "manager", "admin"]);
  return (
    <ComingSoon
      title="Wieża"
      subtitle="Panel managera"
      stage="Etap 2"
      features={["Zespół, rejony (rysowanie na mapie) i postępy w Akademii", "Alerty z Radaru", "Zatwierdzanie opinii 5★ jednym kliknięciem"]}
    />
  );
}
