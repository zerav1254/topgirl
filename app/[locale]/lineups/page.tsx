import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { loadLineups } from "@/lib/lineups";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LineupsTab } from "@/components/lineups-tab";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  return { title: `${C.lineup.title} — ${C.meta.title}`, robots: { index: false, follow: false } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);

  const lineups = await loadLineups(profile.userId);

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold tracking-tight sm:text-2xl">{C.lineup.title}</h1>
        <LocaleSwitcher locale={locale} />
      </header>
      <p className="text-sm text-zinc-400">{C.lineup.subtitle}</p>
      <LineupsTab lineups={lineups} locale={locale} signedIn />
      <Link
        href={`/${locale}/team`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        {C.header.team}
      </Link>
    </main>
  );
}
