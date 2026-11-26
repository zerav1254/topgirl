import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getIdentities, getProfile } from "@/lib/auth";
import { DOCS, DOC_KEYS } from "@/lib/docs";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ICONS, Icon } from "@/components/artist-ui";
import { UserAvatar } from "@/components/user-avatar";
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

  const name = profile.ingameNickname ?? profile.name ?? profile.email ?? C.profile.userRole;
  const secondary = [profile.name, profile.email].filter((v) => v && v !== name).join(" · ");
  const publicHref = `/${locale}/u/${profile.userId}`;
  const identity = [
    profile.ingameId !== null ? { label: C.profile.ingameId, value: String(profile.ingameId) } : null,
    profile.ingameServer !== null ? { label: C.profile.ingameServer, value: String(profile.ingameServer) } : null,
  ].filter((v): v is { label: string; value: string } => v !== null);

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-2xl">{C.profile.title}</h1>
        </div>
        <LocaleSwitcher locale={locale} />
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <span aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <UserAvatar src={profile.avatarUrl} name={name} frame={profile.avatarFrame} />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">{name}</p>
            <p className="truncate text-sm text-zinc-400">{secondary || C.profile.publicHint}</p>
            <span
              className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${
                profile.role === "admin"
                  ? "border-gold/45 bg-gold/10 text-gold"
                  : "border-white/15 bg-white/5 text-zinc-300"
              }`}
            >
              {profile.role === "admin" ? C.profile.adminRole : C.profile.userRole}
            </span>
          </div>
        </div>

        {identity.length > 0 ? (
          <dl className="relative mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            {identity.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-panel-2/60 px-3 py-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{item.label}</dt>
                <dd className="tabular text-sm font-semibold text-zinc-100">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="relative mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <Link
            href={publicHref}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold/15 px-3 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
          >
            <span aria-hidden="true" className="public-glyph h-4 w-4 shrink-0" />
            {C.profile.publicProfile}
          </Link>
          <form action={signOut.bind(null, locale)}>
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-red-500/40 hover:text-red-300"
            >
              <span aria-hidden="true" className="logout-glyph h-4 w-4 shrink-0" />
              {C.auth.signOut}
            </button>
          </form>
        </div>
      </section>

      <section aria-label={C.profile.editTitle}>
        <Link
          href={`/${locale}/profile/edit`}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-gold/45 bg-gold/15 px-4 py-3 text-gold transition-colors duration-200 hover:bg-gold/25"
        >
          <Icon d={ICONS.edit} className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-display font-semibold">{C.profile.editTitle}</span>
            <span className="block text-xs text-zinc-300">{C.profile.subtitle}</span>
          </span>
          <Icon d={ICONS.chevronRight} className="h-4 w-4 shrink-0" />
        </Link>
      </section>

      <section aria-labelledby="profile-accounts" className="rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <h2 id="profile-accounts" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {C.profile.accountsTitle}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{C.profile.accountsHint}</p>
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
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-zinc-400 transition-colors duration-200 hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:text-zinc-400"
                    >
                      <Icon d={ICONS.unlink} className="h-4 w-4 shrink-0" />
                      {C.profile.disconnect}
                    </button>
                  </form>
                ) : (
                  <form action={linkProvider.bind(null, locale, p.id)}>
                    <button
                      type="submit"
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-gold/45 bg-gold/10 px-3 text-xs font-semibold text-gold transition-colors duration-200 hover:bg-gold/20"
                    >
                      <Icon d={ICONS.link} className="h-4 w-4 shrink-0" />
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

      <section aria-labelledby="profile-links" className="flex flex-col gap-2">
        <h2 id="profile-links" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {C.profile.links}
        </h2>
        <nav aria-label={C.profile.links} className="grid grid-cols-1 gap-2">
          {[
            { href: `/${locale}/info`, label: C.header.info, icon: ICONS.info, rank: true },
            ...DOC_KEYS.map((k) => ({
              href: `/${locale}/doc/${k}`,
              label: DOCS[locale][k].title,
              icon: k === "privacy" ? ICONS.shield : k === "legal" ? ICONS.file : ICONS.info,
              rank: false,
            })),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center justify-start gap-1.5 rounded-lg border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
            >
              {item.rank ? (
                <span aria-hidden="true" className="rank-glyph h-4 w-4 shrink-0" />
              ) : (
                <Icon d={item.icon} className="h-4 w-4 shrink-0" />
              )}
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        <Icon d={ICONS.home} className="h-4 w-4 shrink-0" />
        {C.isi.home}
      </Link>
    </main>
  );
}
