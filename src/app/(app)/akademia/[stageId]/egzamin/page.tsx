import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExamRunner } from "@/components/academy/ExamRunner";
import { requireUser } from "@/lib/auth/session";
import { getExam } from "@/lib/services/academy";

export default async function EgzaminPage(props: PageProps<"/akademia/[stageId]/egzamin">) {
  const user = await requireUser();
  const { stageId } = await props.params;
  // Tylko wersja publiczna (bez klucza odpowiedzi) — i tylko gdy egzamin jest otwarty.
  const data = await getExam(user, stageId);
  if (!data) redirect(`/akademia/${stageId}`);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/akademia/${stageId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> {data.view.status.stage.code} · {data.view.status.stage.title}
      </Link>
      <ExamRunner stageId={stageId} exam={data.exam} backHref={`/akademia/${stageId}`} />
    </div>
  );
}
