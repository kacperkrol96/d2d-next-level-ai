import { BookOpenText, HelpCircle, MessagesSquare, PlayCircle } from "lucide-react";
import type { Lesson } from "@/lib/academy/types";

const icons = { script: BookOpenText, objections: MessagesSquare, video: PlayCircle, quiz: HelpCircle } as const;
export const lessonKindLabel: Record<Lesson["kind"], string> = { script: "Skrypt", objections: "Bank obiekcji", video: "Film", quiz: "Quiz" };

export function LessonIcon({ kind, size = 18, className }: { kind: Lesson["kind"]; size?: number; className?: string }) {
  const Icon = icons[kind];
  return <Icon size={size} strokeWidth={1.75} className={className} />;
}
