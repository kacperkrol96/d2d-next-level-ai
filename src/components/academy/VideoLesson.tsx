"use client";

import { Check } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { markLessonDone, reportVideo } from "@/app/(app)/akademia/actions";
import { VideoPlayer } from "./VideoPlayer";

/** Lekcja filmowa: przycisk „dalej” odblokowuje się po obejrzeniu wymaganej części filmu. */
export function VideoLesson({
  stageId,
  lessonId,
  youtubeId,
  watched,
  required,
  done,
}: {
  stageId: string;
  lessonId: string;
  youtubeId: string | null;
  watched: number;
  required: number;
  done: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [share, setShare] = useState(watched);
  const ok = done || share >= required;
  const onProgress = useCallback(
    async (s: number) => {
      setShare((x) => Math.max(x, s));
      await reportVideo(stageId, lessonId, s);
    },
    [stageId, lessonId],
  );

  return (
    <>
      <VideoPlayer youtubeId={youtubeId} initialWatched={watched} required={required} onProgress={onProgress} onComplete={() => form.current?.requestSubmit()} />
      <form ref={form} action={markLessonDone} className="mt-6">
        <input type="hidden" name="stageId" value={stageId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <button
          disabled={!ok}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-accent to-accent-soft py-4 font-medium shadow-[0_10px_30px_-10px_rgba(142,17,191,0.8)] disabled:opacity-40"
        >
          <Check size={18} /> {done ? "Ukończone — dalej" : ok ? "Obejrzane — dalej" : `Obejrzyj min. ${Math.round(required * 100)}% filmu`}
        </button>
      </form>
    </>
  );
}
