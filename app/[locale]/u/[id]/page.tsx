import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtists } from "@/lib/artists-cache";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { loadPublicProfile } from "@/lib/lineups";
import { TEAM_SIZE } from "@/lib/team";
import { Avatar, ICONS, Icon } from "@/components/artist-ui";
import { UserAvatar } from "@/components/user-avatar";

// Profil publik memakai user_id (uuid): tidak perlu kolom slug, tidak bisa ditebak berurutan.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale) || !UUID.test(id)) return {};
  const C = DICT[locale];
  const data = await loadPublicProfile(id);
  const name = data?.ingameNickname ?? data?.name;
  return {
    title: name ? `${name} — ${C.profile.publicProfile}` : `${C.profile.publicProfile} — ${C.meta.title}`,
    description: C.profile.publicHint,
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw) || !UUID.test(id)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const [data, artists] = await Promise.all([loadPublicProfile(id), getArtists()]);
  if (!data) notFound();

  const name = data.ingameNickname ?? data.name ?? C.profile.userRole;
  const bySlug = new Map(artists.map((a) => [a.slug, a]));
  const uniqueArtists = new Set(data.lineups.flatMap((l) => l.slugs)).size;


  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-4 pb-28 sm:pt-6">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-4 sm:p-5">
        <span aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <UserAvatar src={data.avatarUrl} name={name} frame={data.avatarFrame} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
            <p className="truncate text-sm text-zinc-400">
              {data.name && data.ingameNickname ? `${data.name} · ` : ""}
              {data.ingameServer !== null ? `${C.profile.ingameServer} ${data.ingameServer}` : C.profile.publicHint}
            </p>
          </div>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-panel/70 p-3">
          <dt className="text-2xs font-semibold uppercase tracking-wide text-zinc-400">{C.profile.sharedLineups}</dt>
          <dd className="tabular mt-0.5 font-display text-xl font-bold text-zinc-100">{data.lineups.length}</dd>
        </div>
        <div className="rounded-xl border border-line bg-panel/70 p-3">
          <dt className="text-2xs font-semibold uppercase tracking-wide text-zinc-400">{C.profile.artists}</dt>
          <dd className="tabular mt-0.5 font-display text-xl font-bold text-zinc-100">{uniqueArtists}</dd>
        </div>
      </dl>

      <section aria-label={C.profile.sharedLineups} className="flex flex-col gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.profile.sharedLineups}</h2>
        {data.lineups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-zinc-400">{C.profile.noShared}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.lineups.map((l) => {
              return (
                <li key={l.id}>
                  <Link
                    href={`/${locale}/l/${l.shareSlug}`}
                    className="flex min-h-14 flex-col gap-2 rounded-xl border border-line bg-panel/70 p-3 transition-colors duration-200 hover:border-white/25 hover:bg-panel-2"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex shrink-0 -space-x-2">
                        {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                          const a = l.slugs[i] ? bySlug.get(l.slugs[i]) : undefined;
                          return a ? (
                            <span key={i} className="rounded-lg ring-2 ring-panel">
                              <Avatar artist={a} size="h-8 w-8" />
                            </span>
                          ) : (
                            <span key={i} aria-hidden="true" className="h-8 w-8 rounded-lg border border-dashed border-line bg-panel-2/60 ring-2 ring-panel" />
                          );
                        })}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{l.name}</span>
                        <span className="tabular block text-xs text-zinc-400">
                          {l.slugs.length}/{TEAM_SIZE}
                        </span>
                      </span>
                      <Icon d={ICONS.chevronRight} className="h-4 w-4 shrink-0 text-zinc-400" />
                    </span>
                    <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${(l.slugs.length / TEAM_SIZE) * 100}%` }} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        <Icon d={ICONS.home} className="h-4 w-4 shrink-0" />
        {C.isi.home}
      </Link>
    </main>
  );
}
