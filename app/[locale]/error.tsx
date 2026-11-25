"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DICT, localeOr } from "@/lib/i18n";
import { ICONS, Icon } from "@/components/artist-ui";

// Error boundary wajib client di Next; satu-satunya "use client" di luar komponen interaktif.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params.locale === "string" ? localeOr(params.locale) : "id";
  const C = DICT[locale].error;
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 pt-10 pb-28">
      <section className="rounded-2xl border border-white/10 bg-panel/80 p-5 text-center sm:p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">{C.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{C.description}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
          >
            <Icon d={ICONS.refresh} className="h-4 w-4 shrink-0" />
            {C.retry}
          </button>
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            <Icon d={ICONS.home} className="h-4 w-4 shrink-0" />
            {DICT[locale].notFound.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
