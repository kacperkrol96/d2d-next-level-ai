import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireRole } from "@/lib/auth/session";

export default async function KonfiguratorPage() {
  await requireRole(["sales", "manager", "admin"]);
  return (
    <ComingSoon
      title="Konfigurator"
      subtitle="Kalkulator ofertowy"
      stage="Etap 4"
      features={["Logika obliczeń z repozytorium kalkulator-nle (bez kopiowania)", "Oferta prosto z iPada u klienta"]}
    />
  );
}
