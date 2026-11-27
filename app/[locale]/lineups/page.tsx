import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getArtists } from "@/lib/artists-cache";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { loadLineups, loadPublicLineups } from "@/lib/lineups";
import { SITE_URL } from "@/lib/site";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LineupsTab } from "@/components/lineups-tab";
import { PublicLineups } from "@/components/public-lineups";
import { ICONS, Icon } from "@/components/artist-ui";

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
  // Dipakai bersama oleh daftar publik dan preview lineup sendiri.
  const [publicLineups, artists] = await Promise.all([loadPublicLineups(), getArtists()]);
  const publicUsed = new Set(publicLineups.flatMap((l) => l.slugs));
  const publicPreview = artists.filter((a) => publicUsed.has(a.slug));

  // Tanpa redirect: nav Lineup selalu terlihat, jadi halaman ini yang menjelaskan, bukan lompat diam-diam.
  if (!profile) {
    return (
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-2xl">{C.header.lineups}</h1>
          </div>
          <LocaleSwitcher locale={locale} />
        </header>
        <p className="text-sm text-zinc-400">{C.lineup.loginHint}</p>
        <Link
          href={`/${locale}/login`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
        >
          <Icon d={ICONS.user} className="h-4 w-4 shrink-0" />
          {C.auth.login}
        </Link>
        <PublicLineups lineups={publicLineups} preview={publicPreview} locale={locale} />
      </main>
    );
  }

  const lineups = await loadLineups(profile.userId);
  // Avatar mini di kartu lineup: hanya artis yang dipakai, bukan seluruh roster.
  const used = new Set(lineups.flatMap((l) => l.slugs));
  const preview = artists.filter((a) => used.has(a.slug));

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display text-lg font-bold tracking-tight sm:text-2xl">{C.lineup.title}</h1>
        </div>
        <LocaleSwitcher locale={locale} />
      </header>
      <p className="text-sm text-zinc-400">{C.lineup.subtitle}</p>
      <LineupsTab lineups={lineups} preview={preview} locale={locale} siteUrl={SITE_URL} />
      <PublicLineups lineups={publicLineups} preview={publicPreview} locale={locale} />
      <Link
        href={`/${locale}/team`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        <Icon d={ICONS.users} className="h-4 w-4 shrink-0" />
        {C.header.team}
      </Link>
    </main>
  );
}
