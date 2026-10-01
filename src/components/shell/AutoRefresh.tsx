"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Odświeża dane z CRM co `minutes` minut i po powrocie do aplikacji. */
export function AutoRefresh({ minutes }: { minutes: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), minutes * 60 * 1000);
    const onVisible = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [minutes, router]);
  return null;
}
