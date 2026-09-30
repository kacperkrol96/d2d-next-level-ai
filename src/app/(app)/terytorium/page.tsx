import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/session";

export default async function TerytoriumPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Terytorium"
      subtitle="Mapa rejonu i domy do odwiedzenia"
      stage="Etap 5"
      features={["Rejon narysowany przez managera, każdy dom jako punkt (dane Geoportalu)", "Statusy: otworzył / nie otworzył / nie zainteresowany / umówione / wrócić", "GPS potwierdza obecność przy domu (~30 m), tylko w godzinach pracy", "Procent „wyczyszczenia” rejonu i fala na mapie po odhaczeniu domu"]}
    />
  );
}
