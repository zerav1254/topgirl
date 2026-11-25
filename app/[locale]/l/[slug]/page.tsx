import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArtists } from "@/lib/artists";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { loadShared } from "@/lib/lineups";
import { Avatar, GenreIcon, SkillList, TierBadge, formatStat } from "@/components/artist-ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  const shared = await loadShared(slug);
  return {
    title: shared ? `${C.lineup.shareTitle.replace("{name}", shared.lineup.name)} — ${C.meta.title}` : C.lineup.notFound,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];

  const [shared, artists] = await Promise.all([loadShared(slug), loadArtists()]);
  if (!shared) notFound();

  const bySlug = new Map(artists.map((a) => [a.slug, a]));
  const team = shared.lineup.slugs.map((s) => bySlug.get(s)).filter((a) => a !== undefined);

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-lg font-bold tracking-tight sm:text-2xl">
          {C.lineup.shareTitle.replace("{name}", shared.lineup.name)}
        </h1>
        <p className="text-sm text-zinc-400">
          {shared.ownerName ? C.lineup.by.replace("{name}", shared.ownerName) : ""}
          {shared.ownerServer ? ` · ${C.profile.ingameServer} ${shared.ownerServer}` : ""}
        </p>
      </header>

      <ol className="flex flex-col gap-2">
        {team.map((a) => (
          <li key={a.slug} className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel/70 p-2.5">
            <Avatar artist={a} tier={a.tiers.solo} size="h-10 w-10" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-base font-semibold">{a.name}</span>
                <TierBadge tier={a.tiers.solo} />
                <span className="tabular text-xs text-zinc-400">{formatStat(a.scores.solo, locale)}</span>
              </span>
              <span className="flex items-center gap-1 text-sm text-zinc-400">
                <GenreIcon genre={a.genre} className="h-3 w-3 shrink-0" />
                <span className="truncate">{a.genre}</span>
              </span>
              <SkillList skills={a.skills} locale={locale} className="mt-1" />
            </span>
          </li>
        ))}
      </ol>

      {team.length === 0 && <p className="text-sm text-zinc-400">{C.lineup.notFound}</p>}

      <Link
        href={`/${locale}/team`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        {C.header.team}
      </Link>
    </main>
  );
}
