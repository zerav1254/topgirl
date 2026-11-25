import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getIdentities, getProfile } from "@/lib/auth";
import { DOCS, DOC_KEYS } from "@/lib/docs";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AvatarForm } from "@/components/avatar-form";
import { ProfileForm } from "@/components/profile-form";
import { DiscordMark, GoogleMark } from "@/components/provider-mark";
import { signOut } from "@/app/[locale]/login/actions";
import { linkProvider, unlinkProvider } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  return { title: `${C.profile.title} — ${C.meta.title}`, robots: { index: false, follow: false } };
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
  if (!profile) redirect(`/${locale}/login`);

  const identities = await getIdentities();
  const linked = new Set(identities.map((i) => i.provider));
  // Minimal satu identitas harus tersisa supaya akun tetap bisa dimasuki.
  const onlyIdentity = identities.length < 2;
  const providers = [
    { id: "google" as const, label: "Google", mark: <GoogleMark /> },
    { id: "discord" as const, label: "Discord", mark: <DiscordMark className="h-5 w-5 text-[#5865f2]" /> },
  ];

  const name = profile.name ?? profile.email ?? C.profile.userRole;
  const publicHref = `/${locale}/u/${profile.userId}`;

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-2xl">{C.profile.title}</h1>
        </div>
        <LocaleSwitcher locale={locale} />
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-panel-2">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" width={96} height={96} sizes="48px" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-base font-bold text-white/50">
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
        <h2 className="text-sm font-semibold">{C.profile.accountsTitle}</h2>
        <p className="mt-0.5 text-xs text-zinc-400">{C.profile.accountsHint}</p>
        {query.error ? (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
            {query.error === "unlink" ? C.profile.unlinkError : C.profile.linkError}
          </p>
        ) : null}
        <ul className="mt-3 flex flex-col gap-2">
          {providers.map((p) => {
            const isLinked = linked.has(p.id);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink/60">{p.mark}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className={`text-xs ${isLinked ? "text-emerald-300" : "text-zinc-400"}`}>
                    {isLinked ? C.profile.connected : C.profile.notConnected}
                  </p>
                </div>
                {isLinked ? (
                  <form action={unlinkProvider.bind(null, locale, p.id)}>
                    <button
                      type="submit"
                      disabled={onlyIdentity}
                      title={onlyIdentity ? C.profile.disconnectHint : undefined}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/10 px-3 text-xs font-semibold text-zinc-400 transition-colors duration-200 hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-zinc-400"
                    >
                      {C.profile.disconnect}
                    </button>
                  </form>
                ) : (
                  <form action={linkProvider.bind(null, locale, p.id)}>
                    <button
                      type="submit"
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-gold/45 bg-gold/10 px-3 text-xs font-semibold text-gold transition-colors duration-200 hover:bg-gold/20"
                    >
                      {C.profile.connect}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-zinc-400">{C.profile.disconnectHint}</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <p className="mb-3 text-sm text-zinc-400">{C.profile.subtitle}</p>
        <AvatarForm locale={locale} />
        <div className="my-4 border-t border-white/10" />
        <ProfileForm profile={profile} locale={locale} />
      </section>

      <nav aria-label={C.profile.links} className="grid grid-cols-2 gap-2">
        {[
          { href: `/${locale}/info`, label: C.header.info },
          ...DOC_KEYS.map((k) => ({ href: `/${locale}/doc/${k}`, label: DOCS[locale][k].title })),
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        {C.isi.home}
      </Link>
    </main>
  );
}
