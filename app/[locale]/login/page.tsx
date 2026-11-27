import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DOCS, DOC_KEYS } from "@/lib/docs";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { DiscordMark, GoogleMark } from "@/components/provider-mark";
import { ICONS, Icon } from "@/components/artist-ui";
import { signIn, signOut } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "id";
  const C = DICT[l];
  const title = `${C.auth.title} — ${C.meta.title}`;
  return {
    title,
    robots: { index: false, follow: false },
    ...pageMetadata({ locale: l, basePath: "/login", title, description: C.meta.description }),
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const profile = await getProfile();

  // Fokus ring terlihat di atas panel gelap; tinggi 48px untuk target sentuh.
  const providerButton =
    "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 pt-10 pb-28">
      <section className="rounded-2xl border border-line bg-panel/80 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <LocaleSwitcher locale={locale} />
        </div>

        {profile ? (
          <>
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar src={profile.avatarUrl} name={profile.name ?? profile.email ?? "?"} px={44} />
              <div className="min-w-0">
                <h1 className="font-display truncate text-xl font-bold tracking-tight">{profile.name ?? profile.email}</h1>
                {profile.email && profile.name && <p className="truncate text-xs text-zinc-400">{profile.email}</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/${locale}/profile`}
                className={`${providerButton} border-line font-normal text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
              >
                <Icon d={ICONS.user} className="h-4 w-4 shrink-0" />
                {C.profile.title}
              </Link>
              <Link
                href={`/${locale}/lineups`}
                className={`${providerButton} border-line font-normal text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
              >
                <Icon d={ICONS.layers} className="h-4 w-4 shrink-0" />
                {C.lineup.title}
              </Link>
              <form action={signOut.bind(null, locale)}>
                <button type="submit" className={`${providerButton} border-line font-normal text-zinc-400 hover:border-red-500/40 hover:text-red-300`}>
                  <span aria-hidden="true" className="logout-glyph h-4 w-4 shrink-0" />
                  {C.auth.signOut}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display mt-3 text-2xl font-bold tracking-tight">{C.auth.title}</h1>
            <p className="mt-1.5 text-sm text-zinc-400">{C.auth.subtitle}</p>
            {query.error ? (
              <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
                {C.auth.error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2.5">
              <form action={signIn.bind(null, locale, "google")}>
                <button type="submit" className={`${providerButton} border-google-border bg-google-surface text-google-text hover:bg-google-hover`}>
                  <GoogleMark />
                  {C.auth.google}
                </button>
              </form>
              <form action={signIn.bind(null, locale, "discord")}>
                <button type="submit" className={`${providerButton} border-discord-hover bg-discord text-white hover:bg-discord-hover`}>
                  <DiscordMark />
                  {C.auth.discord}
                </button>
              </form>
            </div>
            <p className="mt-3 text-xs text-zinc-400">{C.auth.hint}</p>
          </>
        )}

        <Link
          href={`/${locale}`}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
        >
          <Icon d={ICONS.home} className="h-4 w-4 shrink-0" />
          {C.isi.home}
        </Link>

        <nav aria-label={C.profile.links} className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
          {DOC_KEYS.map((k) => (
            <Link
              key={k}
              href={`/${locale}/doc/${k}`}
              className="inline-flex min-h-11 items-center gap-1 text-zinc-400 underline-offset-2 transition-colors duration-200 hover:text-zinc-200 hover:underline"
            >
              <Icon d={k === "privacy" ? ICONS.shield : k === "legal" ? ICONS.file : ICONS.info} className="h-4 w-4 shrink-0" />
              {DOCS[locale][k].title}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

