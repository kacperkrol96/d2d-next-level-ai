import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ExamRunner } from "@/components/academy/ExamRunner";
import { requireUser } from "@/lib/auth/session";
import { getStage, publicQuestions } from "@/lib/services/academy";

export default async function EgzaminPage(props: PageProps<"/akademia/[stageId]/egzamin">) {
  const user = await requireUser();
  const { stageId } = await props.params;
  const { track } = await props.searchParams;
  const view = await getStage(user, stageId, typeof track === "string" ? track : null);
  if (!view) notFound();
  const q = user.role === "admin" && typeof track === "string" ? `?track=${track}` : "";
  if (!view.status.examOpen) redirect(`/akademia/${stageId}${q}`);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/akademia/${stageId}${q}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft size={16} /> {view.status.stage.title}
      </Link>
      <ExamRunner stageId={stageId} stageTitle={view.status.stage.title} questions={publicQuestions(view.status.stage)} backHref={`/akademia${q}`} />
    </div>
  );
}
