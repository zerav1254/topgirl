import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { loadPublicProfile } from "@/lib/lineups";
import { TEAM_SIZE } from "@/lib/team";

// Profil publik memakai user_id (uuid): tidak perlu kolom slug, tidak bisa ditebak berurutan.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  return {
    title: `${C.profile.publicProfile} — ${C.meta.title}`,
    description: C.profile.publicHint,
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw) || !UUID.test(id)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];
  const data = await loadPublicProfile(id);
  if (!data) notFound();

  const name = data.ingameNickname ?? data.name ?? C.profile.userRole;

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-4 pb-28 sm:pt-6">
      <section className="flex items-center gap-3 rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-panel-2">
          {data.avatarUrl ? (
            <Image src={data.avatarUrl} alt="" width={112} height={112} sizes="56px" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-lg font-bold text-white/25">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
          <p className="truncate text-xs text-zinc-400">
            {data.name && data.ingameNickname ? `${data.name} · ` : ""}
            {data.ingameServer !== null ? `${C.profile.ingameServer} ${data.ingameServer}` : C.profile.publicHint}
          </p>
        </div>
      </section>

      <section aria-label={C.profile.sharedLineups} className="flex flex-col gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.profile.sharedLineups}</h2>
        {data.lineups.length === 0 ? (
          <p className="text-sm text-zinc-400">{C.profile.noShared}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.lineups.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/${locale}/l/${l.shareSlug}`}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-white/10 bg-panel/70 p-3 transition-colors duration-200 hover:border-white/25 hover:bg-panel-2"
                >
                  <span className="min-w-0 truncate text-sm font-semibold">{l.name}</span>
                  <span className="tabular shrink-0 text-xs text-zinc-400">
                    {l.slugs.length}/{TEAM_SIZE}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
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
