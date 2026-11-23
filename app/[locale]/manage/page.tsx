import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadArtists } from "@/lib/artists";
import { isAdmin } from "@/lib/auth";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { loadLookups } from "@/lib/lookups";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ArtistEditor } from "@/components/artist-editor";
import { login } from "./actions";

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
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <LocaleSwitcher locale={locale} />
        </div>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">{C.isi.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{C.isi.subtitle}</p>
        <form action={login.bind(null, locale)} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            {C.isi.password}
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
            />
          </label>
          {errorText ? (
            <p role="alert" className="text-sm text-red-300">
              {errorText}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
          >
            {C.isi.submit}
          </button>
        </form>
      </main>
    );
  }

  const [artists, lookups] = await Promise.all([loadArtists(), loadLookups()]);

  return (
    <>
      {errorText ? (
        <p role="alert" className="mx-auto max-w-6xl px-4 pt-4 text-sm text-red-300 sm:px-6 lg:px-8">
          {errorText}
        </p>
      ) : null}
      <ArtistEditor artists={artists} lookups={lookups} defaultSlug={query.a} locale={locale} />
    </>
  );
}
