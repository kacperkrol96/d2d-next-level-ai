import { BookOpenText, PlayCircle, Rocket, ScrollText } from "lucide-react";
import type { Lesson } from "@/lib/academy/types";

const icons = { reading: BookOpenText, contract: ScrollText, video: PlayCircle, launchpad: Rocket } as const;
export const lessonKindLabel: Record<Lesson["kind"], string> = { reading: "Lekcja", contract: "Kontrakt", video: "Film", launchpad: "Plan 90 dni" };

export function LessonIcon({ kind, size = 18, className }: { kind: Lesson["kind"]; size?: number; className?: string }) {
  const Icon = icons[kind];
  return <Icon size={size} strokeWidth={1.75} className={className} />;
}
