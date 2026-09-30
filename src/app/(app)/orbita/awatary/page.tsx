import { Avatar } from "@/components/orbit/Avatar";
import { Card, PageHeader } from "@/components/ui/Card";
import { getConfig } from "@/lib/config";
import { requireUser } from "@/lib/auth/session";

/** Galeria wszystkich awatarów poziomów — do oceny wyglądu. */
export default async function AvatarGalleryPage() {
  await requireUser();
  const config = await getConfig();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Awatary poziomów" subtitle="Zestaw handlowców — wersja wektorowa (v2.0: grafiki 3D)" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {config.salesLevels.map((l) => (
          <Card key={l.level} className="flex flex-col items-center text-center">
            <Avatar level={l.level} size={150} />
            <div className="num mt-3 text-xs uppercase tracking-widest text-gold">Poziom {l.level}</div>
            <div className="mt-1 text-sm">{l.title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
