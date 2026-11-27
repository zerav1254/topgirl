"use client";

import { useParams } from "next/navigation";
import { DICT, localeOr } from "@/lib/i18n";

export default function Loading() {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params.locale === "string" ? localeOr(params.locale) : "id";
  return (
    <main id="main" aria-busy="true" className="mx-auto max-w-4xl px-4 pt-3 pb-28 sm:px-6 sm:pt-6">
      <p role="status" className="sr-only">
        {DICT[locale].common.loading}
      </p>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-panel-2" />
        <div className="min-w-0 flex-1">
          <div className="h-2.5 w-16 animate-pulse rounded bg-panel-2" />
          <div className="mt-1.5 h-6 w-40 max-w-full animate-pulse rounded bg-panel-2" />
        </div>
        <div className="h-11 w-20 shrink-0 animate-pulse rounded-lg bg-panel-2" />
      </div>
      <div className="mt-3 h-8 w-56 max-w-full animate-pulse rounded-lg bg-panel-2" />
      <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-panel-2" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-panel-2" />
        ))}
      </div>
    </main>
  );
}
