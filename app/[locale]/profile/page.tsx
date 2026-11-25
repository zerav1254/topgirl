import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ProfileForm } from "@/components/profile-form";
import { signOut } from "@/app/[locale]/login/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  return { title: `${C.profile.title} — ${C.meta.title}`, robots: { index: false, follow: false } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);

  const name = profile.name ?? profile.email ?? C.profile.userRole;
  const publicHref = `/${locale}/u/${profile.userId}`;

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold tracking-tight sm:text-2xl">{C.profile.title}</h1>
        <LocaleSwitcher locale={locale} />
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-panel-2">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" width={96} height={96} sizes="48px" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-base font-bold text-white/25">
                {name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate text-xs text-zinc-400">{profile.email ?? "—"}</p>
          </div>
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${
              profile.role === "admin"
                ? "border-gold/45 bg-gold/10 text-gold"
                : "border-white/15 bg-white/5 text-zinc-300"
            }`}
          >
            {profile.role === "admin" ? C.profile.adminRole : C.profile.userRole}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <Link
            href={publicHref}
            className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            {C.profile.publicProfile}
          </Link>
          <form action={signOut.bind(null, locale)}>
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-red-300"
            >
              {C.auth.signOut}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <p className="mb-3 text-sm text-zinc-400">{C.profile.subtitle}</p>
        <ProfileForm profile={profile} locale={locale} />
      </section>

      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        {C.isi.home}
      </Link>
    </main>
  );
}
