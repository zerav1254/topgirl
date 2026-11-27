"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import type { Rank } from "@/lib/pool";
import { TIER_ORDER, type Tier } from "@/lib/score";
import { TEAM_SIZE } from "@/lib/team";
import { ArtistFilterBar, type ArtistFilterState } from "./artist-filter";
import { GenreIcon, ICONS, Icon, RankBadge, RoleBadge, SkillList, TierBadge, formatStat } from "./artist-ui";

type Props = {
  artists: Artist[];
  // scoped = artis yang bisa diperoleh di pool; rank = peringkat relatif (null saat pool tidak aktif).
  scoped: Artist[];
  // Artis di atas season server: section terpisah, tetap bisa dilihat.
  blocked: Set<string>;
  rank: Map<string, Rank> | null;
  // Tier relatif pool (null saat pool tidak aktif): skor absolut tidak cocok untuk server baru.
  seasonTiers: Map<string, Tier> | null;
  // null = belum login: tombol koleksi disembunyikan.
  owned: Set<string> | null;
  onOwned: (slug: string, owned: boolean) => void;
  onToggle: (slug: string) => void;
  // Pesan gagal simpan koleksi; kosong = tidak ada error.
  ownedError?: string;
  pendingSlug?: string | null;
  picked: string[];
  locale: Locale;
  state: ArtistFilterState;
};

// Season hanya bermakna untuk artist dari kota tuan rumah; origin lain tidak menampilkannya.
export function ArtistsTab({ artists, scoped, blocked, rank, seasonTiers, owned, onOwned, onToggle, ownedError, pendingSlug, picked, locale, state }: Props) {
  const C = DICT[locale];
  const tierOf = (a: Artist) => seasonTiers?.get(a.slug) ?? a.tier;
  // Section tier hanya untuk artis di pool, jadi tier yang tak bisa dicapai tidak muncul.
  const inPool = useMemo(() => new Set(scoped.map((a) => a.slug)), [scoped]);
  const visible = useMemo(() => state.visible.filter((a) => inPool.has(a.slug)), [state.visible, inPool]);
  const unavailable = useMemo(() => state.visible.filter((a) => blocked.has(a.slug)), [state.visible, blocked]);
  // Urutan chip ikut TIER_ORDER, bukan urutan data; tier tanpa artist tidak ditampilkan.
  const tiers = useMemo(() => {
    const present = new Set(scoped.map((a) => seasonTiers?.get(a.slug) ?? a.tier));
    return TIER_ORDER.filter((tier) => present.has(tier));
  }, [scoped, seasonTiers]);
  const sortValue = (a: Artist) => rank?.get(a.slug)?.rank ?? -a.score;

  return (
    <section aria-label={C.artists.section} className="flex min-w-0 flex-col">
      <div className="lg:sticky lg:top-0">
        <ArtistFilterBar
          artists={artists}
          locale={locale}
          state={state}
          ownedTotal={owned ? scoped.length : undefined}
          ownedCount={owned ? scoped.filter((a) => owned.has(a.slug)).length : 0}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {t(C.artists.results, { n: visible.length })}
      </p>

      {ownedError !== "" && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">
          {ownedError}
        </p>
      )}

      {tiers
        .map((tier) => [tier, visible.filter((a) => tierOf(a) === tier).sort((a, b) => sortValue(a) - sortValue(b))] as const)
        .filter(([, list]) => list.length > 0)
        .map(([tier, list]) => {
          // Saat pool aktif, heading menampilkan rentang peringkat di tier pool.
          const ranks = rank ? list.map((a) => rank.get(a.slug)?.rank ?? 0).filter((n) => n > 0) : [];
          const range = ranks.length > 0 ? `#${Math.min(...ranks)}–#${Math.max(...ranks)}` : "";
          return (
          <section key={tier} className="mt-4">
            <h2 className="mb-2 flex items-center gap-2">
              <TierBadge tier={tier} />
              {rank && range ? (
                <span className="tabular rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-display text-sm font-semibold text-zinc-100">
                  {range}
                </span>
              ) : null}
              <span className="text-xs font-normal text-zinc-400">{t(C.artists.tierCount, { n: list.length })}</span>
            </h2>
            <ul className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 md:grid-cols-4">
              {list.map((a) => (
                <ArtistCard
                  key={a.slug}
                  artist={a}
                  rank={rank?.get(a.slug)}
                  tier={tierOf(a)}
                  owned={owned}
                  onOwned={onOwned}
                  onToggle={onToggle}
                  busy={pendingSlug === a.slug}
                  inTeam={picked.includes(a.slug)}
                  teamFull={picked.length >= TEAM_SIZE}
                  locale={locale}
                />
              ))}
            </ul>
          </section>
          );
        })}

      {visible.length === 0 && unavailable.length === 0 && <p className="mt-6 text-base text-zinc-400">{C.artists.empty}</p>}

      {unavailable.length > 0 && (
        <section className="mt-6 border-t border-white/10 pt-4">
          <h2 className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-sm font-semibold text-amber-300">
              <Icon d={ICONS.info} className="h-4 w-4 shrink-0" />
              {C.pool.blocked}
            </span>
            <span className="text-xs font-normal text-zinc-400">{t(C.artists.tierCount, { n: unavailable.length })}</span>
          </h2>
          <p className="mb-2 text-xs text-zinc-400">{C.pool.seasonHint}</p>
          <ul className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 md:grid-cols-4">
            {unavailable.map((a) => (
              <ArtistCard
                key={a.slug}
                artist={a}
                blocked
                tier={tierOf(a)}
                owned={owned}
                onOwned={onOwned}
                onToggle={onToggle}
                busy={pendingSlug === a.slug}
                inTeam={picked.includes(a.slug)}
                teamFull={picked.length >= TEAM_SIZE}
                locale={locale}
              />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

function ArtistCard({
  artist: a,
  rank: r,
  tier,
  blocked = false,
  owned,
  onOwned,
  onToggle,
  busy = false,
  inTeam,
  teamFull,
  locale,
}: {
  artist: Artist;
  rank?: Rank;
  tier: Tier;
  blocked?: boolean;
  owned: Set<string> | null;
  onOwned: (slug: string, owned: boolean) => void;
  onToggle: (slug: string) => void;
  // Aksi simpan untuk kartu ini masih berjalan.
  busy?: boolean;
  inTeam: boolean;
  teamFull: boolean;
  locale: Locale;
}) {
  const C = DICT[locale];
  const isOwned = owned?.has(a.slug) ?? false;
  return (
    <li>
      <details
        className={`group h-full overflow-hidden rounded-xl border ${
          inTeam ? "border-gold/30 bg-gold/5" : blocked ? "border-amber-500/25 bg-panel/50" : "border-white/10 bg-panel/70"
        }`}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-2 transition-colors duration-200 hover:bg-white/5 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-gold [&::-webkit-details-marker]:hidden">
          <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-panel-2">
            {a.photoUrl ? (
              <Image
                src={a.photoUrl}
                alt=""
                width={96}
                height={96}
                sizes="56px"
                className={`h-full w-full object-cover ${blocked ? "opacity-60 grayscale" : ""}`}
              />
            ) : (
              <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-base font-bold text-white/50">
                {a.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{a.name}</span>
            <span className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
              <GenreIcon image={a.genreImage} className="h-4 w-4 shrink-0" />
              <span className="truncate">{a.genre}</span>
              {a.role && <RoleBadge role={a.role} locale={locale} className="shrink-0" />}
              {inTeam && <Icon d={ICONS.check} className="ml-auto h-3.5 w-3.5 shrink-0 text-gold" />}
            </span>
          </span>
          <Icon
            d={ICONS.chevronDown}
            className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="border-t border-white/10 px-2 pt-1.5 pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              {r && <RankBadge rank={r.rank} size={r.size} label={t(C.pool.rank, { n: r.rank, total: r.size })} />}
              <TierBadge tier={tier} />
            </span>
            <span className="tabular shrink-0 text-xs text-zinc-400">
              {C.info.score} <span className="font-semibold text-zinc-100">{formatStat(a.score, locale)}</span>
            </span>
          </div>
          <p className="min-w-0 truncate text-xs text-zinc-400">
            {a.origin ?? "\u2014"}
            {a.season !== null && ` \u00b7 S${a.season}`}
          </p>
          {a.singMax !== null && a.danceMax !== null && (
            <p className="tabular mt-0.5 flex gap-2 text-xs text-zinc-400">
              <span>
                {C.artists.sing} <span className="font-semibold text-zinc-200">{formatStat(a.singMax, locale)}</span>
              </span>
              <span>
                {C.artists.dance} <span className="font-semibold text-zinc-200">{formatStat(a.danceMax, locale)}</span>
              </span>
            </p>
          )}
          {blocked && (
            <p className="mt-1.5 rounded-md border border-amber-500/40 bg-ink/85 px-1.5 py-0.5 text-center text-[11px] font-semibold text-amber-300">
              {C.pool.blocked}
            </p>
          )}
          <SkillList baseDmg={a.baseDmg} skills={a.skills} locale={locale} className="mt-1.5 border-t border-white/10 pt-1" />
        </div>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onToggle(a.slug)}
            aria-pressed={inTeam}
            disabled={!inTeam && teamFull}
            title={!inTeam && teamFull ? C.team.full : undefined}
            aria-label={inTeam ? t(C.artists.removeFromTeamLabel, { name: a.name }) : t(C.artists.addToTeamLabel, { name: a.name })}
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 border-t px-2 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              inTeam
                ? "border-gold/30 bg-gold/10 text-gold hover:bg-gold/15"
                : "border-white/10 text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            <Icon d={inTeam ? ICONS.check : ICONS.plus} className="h-3.5 w-3.5 shrink-0" />
            {inTeam ? C.artists.removeFromTeam : C.artists.addToTeam}
          </button>
          {owned && (
            <button
              type="button"
              onClick={() => onOwned(a.slug, !isOwned)}
              aria-pressed={isOwned}
              disabled={busy}
              aria-label={isOwned ? t(C.collection.markMissing, { name: a.name }) : t(C.collection.markOwned, { name: a.name })}
              className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 border-t px-2 text-xs font-semibold transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 ${
                isOwned
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                  : "border-white/10 text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              <Icon d={isOwned ? ICONS.check : ICONS.plus} className="h-3.5 w-3.5 shrink-0" />
              {busy ? C.collection.saving : isOwned ? C.collection.saved : C.collection.save}
            </button>
          )}
        </div>
      </details>
    </li>
  );

}
