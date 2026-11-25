import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { ICONS, Icon } from "@/components/artist-ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AvatarForm } from "@/components/avatar-form";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  return { title: `${C.profile.editTitle} — ${C.meta.title}`, robots: { index: false, follow: false } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const profile = await getProfile();
  if (!profile) redirect(`/${locale}/login`);

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-2">
        <Link
          href={`/${locale}/profile`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
        >
          <Icon d={ICONS.arrowLeft} className="h-4 w-4 shrink-0" />
          {C.profile.back}
        </Link>
        <LocaleSwitcher locale={locale} />
      </header>

      <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-2xl">{C.profile.editTitle}</h1>

      <section className="rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <AvatarForm locale={locale} />
        <div className="my-4 border-t border-white/10" />
        <ProfileForm profile={profile} locale={locale} />
      </section>
    </main>
  );
}
