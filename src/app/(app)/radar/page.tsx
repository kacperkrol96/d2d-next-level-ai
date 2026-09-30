import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/session";

export default async function RadarPage() {
  await requireUser();
  return (
    <ComingSoon
      title="Radar"
      subtitle="Oferty od audytorów z licznikiem 3 dni"
      stage="Etap 4"
      features={["Audytor zapisuje ofertę → handlowiec dostaje powiadomienie z pulsem radaru", "Dzień 1: przypomnienie · Dzień 3: oferta czerwona, wybór powodu z listy obiekcji, alert do managera", "Dzień 7: oferta trafia do Wieży (zostaw / przejmij / zamknij)", "Powody zasilają statystyki Akademii"]}
    />
  );
}
