import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArtists } from "@/lib/artists";
import { isAdmin } from "@/lib/auth";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ArtistEditor } from "@/components/artist-editor";

type ErrorKey = keyof (typeof DICT)["id"]["isi"]["errors"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = DICT[isLocale(locale) ? locale : "id"].meta;
  return {
    title: meta.adminTitle,
    description: meta.adminDescription,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; a?: string }>;
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const errorText = query.error && query.error in C.isi.errors ? C.isi.errors[query.error as ErrorKey] : null;

  if (!(await isAdmin())) {
    return (
      <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 pt-10 pb-28">
        <section className="rounded-2xl border border-white/10 bg-panel/80 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <LocaleSwitcher locale={locale} />
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tight">{C.isi.title}</h1>
          <p className="mt-1.5 text-sm text-zinc-400">{C.isi.subtitle}</p>
          {errorText ? (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {errorText}
            </p>
          ) : null}
          <Link
            href={`/${locale}/login`}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
          >
            {C.auth.login}
          </Link>
          <Link
            href={`/${locale}`}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            {C.isi.home}
          </Link>
        </section>
      </main>
    );
  }

  const artists = await loadArtists();

  return (
    <>
      {errorText ? (
        <p role="alert" className="mx-auto max-w-6xl px-4 pt-4 text-sm text-red-300 sm:px-6 lg:px-8">
          {errorText}
        </p>
      ) : null}
      <ArtistEditor artists={artists} defaultSlug={query.a} locale={locale} />
    </>
  );
}
