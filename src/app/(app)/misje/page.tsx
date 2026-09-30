import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/session";

export default async function MisjePage() {
  await requireUser();
  return (
    <ComingSoon
      title="Misje"
      subtitle="Kalendarz, zadania i spotkania"
      stage="Etap 4"
      features={["Spotkania tworzone przy wpisywaniu klienta", "Linki do klienta w CRM", "Synchronizacja z Kalendarzem Google"]}
    />
  );
}
