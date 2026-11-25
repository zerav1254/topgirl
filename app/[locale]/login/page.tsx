import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signIn, signOut } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  return { title: `${C.auth.title} — ${C.meta.title}`, robots: { index: false, follow: false } };
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

  const providerButton =
    "inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors duration-200";

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 pt-10 pb-28">
      <section className="rounded-2xl border border-white/10 bg-panel/80 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <LocaleSwitcher locale={locale} />
        </div>

        {profile ? (
          <>
            <h1 className="font-display mt-3 text-2xl font-bold tracking-tight">{C.auth.as.replace("{name}", profile.name ?? profile.email ?? "")}</h1>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/${locale}/profile`}
                className={`${providerButton} border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
              >
                {C.profile.title}
              </Link>
              <Link
                href={`/${locale}/lineups`}
                className={`${providerButton} border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
              >
                {C.lineup.title}
              </Link>
              <form action={signOut.bind(null, locale)}>
                <button type="submit" className={`${providerButton} border-white/10 text-zinc-400 hover:border-white/25 hover:text-red-300`}>
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
              <p role="alert" className="mt-3 text-sm text-red-300">
                {C.auth.error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <form action={signIn.bind(null, locale, "google")}>
                <button type="submit" className={`${providerButton} border-gold/45 bg-gold/15 text-gold hover:bg-gold/25`}>
                  {C.auth.google}
                </button>
              </form>
              <form action={signIn.bind(null, locale, "discord")}>
                <button type="submit" className={`${providerButton} border-brand/45 bg-brand/10 text-zinc-100 hover:bg-brand/20`}>
                  {C.auth.discord}
                </button>
              </form>
            </div>
            <p className="mt-3 text-xs text-zinc-400">{C.auth.hint}</p>
          </>
        )}

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
