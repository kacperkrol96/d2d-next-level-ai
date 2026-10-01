import Link from "next/link";

/** Przełącznik w Skarbcu: Prowizje / Moje umowy. */
export function SkarbiecTabs({ active }: { active: "prowizje" | "umowy" }) {
  const tab = (key: "prowizje" | "umowy", href: string, label: string) => (
    <Link
      href={href}
      className={`flex-1 rounded-full px-4 py-2 text-center text-sm transition ${active === key ? "bg-card-2 text-white shadow" : "text-muted hover:text-white"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="mb-6 flex max-w-sm gap-1 rounded-full border border-line bg-card p-1">
      {tab("prowizje", "/skarbiec", "Prowizje")}
      {tab("umowy", "/skarbiec/umowy", "Moje umowy")}
    </div>
  );
}
