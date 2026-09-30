import type { Role } from "@/lib/config/types";

export interface CompanyContract {
  type: "B2B" | "Umowa zlecenia";
  /** YYYY-MM-DD */
  endDate: string;
  /** Wariant umowy — pole wypełniane przez admina. */
  variant: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Powiązanie z pracownikiem w CRM (brak dla zarządu). */
  crmEmployeeId: string | null;
  /** Ścieżka kariery: handlowiec (managerzy też) albo audytor. */
  track: "sales" | "auditor" | null;
  contract: CompanyContract | null;
  hasCompanyCar: boolean;
  /** Najwyższy poziom zdobyty w historii (poziom nie spada). */
  highestLevel: number;
}

/**
 * UŻYTKOWNICY TESTOWI (Etap 0). W Etapie 1 zastąpi ich logowanie
 * Google Workspace przez Supabase + profil w bazie.
 */
export const demoUsers: AppUser[] = [
  {
    id: "u-ola",
    name: "Ola Nowak",
    email: "ola.nowak@nextlevelenergy.pl",
    role: "auditor",
    crmEmployeeId: "e-ola",
    track: "auditor",
    contract: { type: "Umowa zlecenia", endDate: "2027-06-30", variant: "Standard" },
    hasCompanyCar: false,
    highestLevel: 1,
  },
  {
    id: "u-marek",
    name: "Marek Wiśniewski",
    email: "marek.wisniewski@nextlevelenergy.pl",
    role: "sales",
    crmEmployeeId: "e-marek",
    track: "sales",
    contract: { type: "B2B", endDate: "2027-03-31", variant: "Premium" },
    hasCompanyCar: true,
    highestLevel: 1,
  },
  {
    id: "u-anna",
    name: "Anna Kowalska",
    email: "anna.kowalska@nextlevelenergy.pl",
    role: "manager",
    crmEmployeeId: "e-anna",
    track: "sales",
    contract: { type: "B2B", endDate: "2028-01-31", variant: "Kadra" },
    hasCompanyCar: true,
    highestLevel: 6,
  },
  {
    id: "u-kacper",
    name: "Kacper Król",
    email: "kacper.krol@nextlevelenergy.pl",
    role: "admin",
    crmEmployeeId: null,
    track: null,
    contract: null,
    hasCompanyCar: false,
    highestLevel: 1,
  },
];

export const roleLabels: Record<Role, string> = {
  auditor: "Audytor",
  sales: "Handlowiec",
  manager: "Manager",
  admin: "Zarząd",
};

export function findDemoUser(id: string | undefined): AppUser | null {
  return demoUsers.find((u) => u.id === id) ?? null;
}
