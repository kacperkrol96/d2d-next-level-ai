import type { Role } from "@/lib/config/types";

export type PanelKey =
  | "kokpit"
  | "orbita"
  | "skarbiec"
  | "radar"
  | "misje"
  | "terytorium"
  | "akademia"
  | "konfigurator"
  | "wieza"
  | "mennica";

export interface NavItem {
  key: PanelKey;
  label: string;
  href: `/${PanelKey}`;
  description: string;
  roles: readonly Role[];
  /** Pozycja w dolnym pasku telefonu (5 ikon). */
  mobileBar: boolean;
}

const everyone: Role[] = ["auditor", "sales", "manager", "admin"];

export const navItems: NavItem[] = [
  { key: "kokpit", label: "Kokpit", href: "/kokpit", description: "Twój dzień", roles: everyone, mobileBar: true },
  { key: "radar", label: "Radar", href: "/radar", description: "Oferty od audytorów", roles: everyone, mobileBar: true },
  { key: "misje", label: "Misje", href: "/misje", description: "Kalendarz i zadania", roles: everyone, mobileBar: true },
  { key: "terytorium", label: "Terytorium", href: "/terytorium", description: "Mapa rejonu", roles: everyone, mobileBar: true },
  { key: "orbita", label: "Orbita", href: "/orbita", description: "Karta rozwoju", roles: ["auditor", "sales", "manager"], mobileBar: true },
  { key: "skarbiec", label: "Skarbiec", href: "/skarbiec", description: "Prowizje", roles: ["auditor", "sales", "manager"], mobileBar: false },
  { key: "akademia", label: "Akademia", href: "/akademia", description: "Onboarding i egzaminy", roles: everyone, mobileBar: false },
  { key: "konfigurator", label: "Konfigurator", href: "/konfigurator", description: "Kalkulator ofertowy", roles: ["sales", "manager", "admin"], mobileBar: false },
  { key: "wieza", label: "Wieża", href: "/wieza", description: "Panel managera", roles: ["sales", "manager", "admin"], mobileBar: false },
  { key: "mennica", label: "Mennica", href: "/mennica", description: "Rozliczenia zarządu", roles: ["admin"], mobileBar: false },
];

export function navFor(role: Role): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

export function canAccess(role: Role, key: PanelKey): boolean {
  return navItems.some((item) => item.key === key && item.roles.includes(role));
}
