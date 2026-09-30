import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/session";

export default async function AkademiaPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Akademia"
      subtitle="Onboarding krok po kroku"
      stage="Etap 2"
      features={["Osobne ścieżki audytora i handlowca", "Skrypt, bank obiekcji, filmy, quizy", "Egzaminy sprawdzane automatycznie — etapy odblokowują się po zdaniu"]}
    />
  );
}
