import {
  Calculator,
  Castle,
  Coins,
  GraduationCap,
  LayoutDashboard,
  Landmark,
  ListChecks,
  Map,
  Orbit,
  Radar,
  type LucideProps,
} from "lucide-react";
import type { PanelKey } from "@/lib/nav";

const icons: Record<PanelKey, React.ComponentType<LucideProps>> = {
  kokpit: LayoutDashboard,
  orbita: Orbit,
  skarbiec: Coins,
  radar: Radar,
  misje: ListChecks,
  terytorium: Map,
  akademia: GraduationCap,
  konfigurator: Calculator,
  wieza: Castle,
  mennica: Landmark,
};

export function NavIcon({ panel, ...props }: { panel: PanelKey } & LucideProps) {
  const Icon = icons[panel];
  return <Icon strokeWidth={1.75} {...props} />;
}
