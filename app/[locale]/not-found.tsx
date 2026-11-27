"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DICT, localeOr } from "@/lib/i18n";
import { ICONS, Icon } from "@/components/artist-ui";

// not-found tidak menerima params: locale dibaca dari segmen pertama URL.
export default function NotFound() {
  const pathname = usePathname() ?? "";
  const first = pathname.split("/")[1] ?? "";
  const locale = first ? localeOr(first) : "id";
  const C = DICT[locale].notFound;
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 pt-10 pb-28">
      <section className="rounded-2xl border border-line bg-panel/80 p-5 text-center sm:p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">{C.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{C.description}</p>
        <Link
          href={`/${locale}`}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
        >
          <Icon d={ICONS.home} className="h-4 w-4 shrink-0" />
          {C.home}
        </Link>
      </section>
    </main>
  );
}
