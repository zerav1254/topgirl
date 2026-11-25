"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import type { Rank } from "@/lib/pool";
import { TIER_ORDER, type Category } from "@/lib/score";
import { ArtistFilterBar, type ArtistFilterState } from "./artist-filter";
import { GenreIcon, ICONS, Icon, RankBadge, SkillList, TierBadge, formatStat } from "./artist-ui";

type Props = {
  artists: Artist[];
  // scoped = artis yang bisa diperoleh di pool; rank = peringkat relatif (null saat pool tidak aktif).
  scoped: Artist[];
  // Artis di atas season server: section terpisah, tetap bisa dilihat.
  blocked: Set<string>;
  rank: Map<string, Rank> | null;
  // null = belum login: tombol koleksi disembunyikan.
  owned: Set<string> | null;
  onOwned: (slug: string, owned: boolean) => void;
  picked: string[];
  locale: Locale;
  category: Category;
  state: ArtistFilterState;
};

// Season hanya bermakna untuk artist dari kota tuan rumah; origin lain tidak menampilkannya.
export function ArtistsTab({ artists, scoped, blocked, rank, owned, onOwned, picked, locale, category, state }: Props) {
  const C = DICT[locale];
  // Section tier hanya untuk artis di pool, jadi tier yang tak bisa dicapai tidak muncul.
  const inPool = useMemo(() => new Set(scoped.map((a) => a.slug)), [scoped]);
  const visible = useMemo(() => state.visible.filter((a) => inPool.has(a.slug)), [state.visible, inPool]);
  const unavailable = useMemo(() => state.visible.filter((a) => blocked.has(a.slug)), [state.visible, blocked]);
  // Urutan chip ikut TIER_ORDER, bukan urutan data; tier tanpa artist tidak ditampilkan.
  const tiers = useMemo(() => {
    const present = new Set(scoped.map((a) => a.tiers[category]));
    return TIER_ORDER.filter((tier) => present.has(tier));
  }, [scoped, category]);
  const sortValue = (a: Artist) => rank?.get(a.slug)?.rank ?? -a.scores[category];

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

      {tiers
        .map((tier) => [tier, visible.filter((a) => a.tiers[category] === tier).sort((a, b) => sortValue(a) - sortValue(b))] as const)
        .filter(([, list]) => list.length > 0)
        .map(([tier, list]) => {
          // Saat pool aktif, heading menampilkan rentang peringkat, bukan tier absolut:
          // dua skala bercampur membingungkan.
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
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {list.map((a) => (
                <ArtistCard
                  key={a.slug}
                  artist={a}
                  rank={rank?.get(a.slug)}
                  owned={owned}
                  onOwned={onOwned}
                  inTeam={picked.includes(a.slug)}
                  locale={locale}
                  category={category}
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
              <Icon d={ICONS.info} className="h-4 w-4" />
              {C.pool.blocked}
            </span>
            <span className="text-xs font-normal text-zinc-400">{t(C.artists.tierCount, { n: unavailable.length })}</span>
          </h2>
          <p className="mb-2 text-xs text-zinc-400">{C.pool.seasonHint}</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {unavailable.map((a) => (
              <ArtistCard
                key={a.slug}
                artist={a}
                blocked
                owned={owned}
                onOwned={onOwned}
                inTeam={picked.includes(a.slug)}
                locale={locale}
                category={category}
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
  blocked = false,
  owned,
  onOwned,
  inTeam,
  locale,
  category,
}: {
  artist: Artist;
  rank?: Rank;
  blocked?: boolean;
  owned: Set<string> | null;
  onOwned: (slug: string, owned: boolean) => void;
  inTeam: boolean;
  locale: Locale;
  category: Category;
}) {
  const C = DICT[locale];
  return (
    <li>
      {/* Kartu hanya info: pemilihan artist dilakukan di tab Team Builder. */}
      <div
        className={`relative flex h-full w-full flex-col overflow-hidden rounded-xl border ${
          inTeam ? "border-gold/30 bg-gold/5" : blocked ? "border-amber-500/25 bg-panel/50" : "border-white/10 bg-panel/70"
        }`}
      >
        <span className="relative block aspect-[3/4] w-full bg-panel-2">
          {a.photoUrl ? (
            <Image
              src={a.photoUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 768px) 33vw, 25vw"
              className={`object-cover ${blocked ? "opacity-60 grayscale" : ""}`}
            />
          ) : (
            <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/25">
              {a.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1 rounded-md bg-ink/70 p-0.5 backdrop-blur-sm">
            {r && <RankBadge rank={r.rank} size={r.size} label={t(C.pool.rank, { n: r.rank, total: r.size })} />}
            <TierBadge tier={a.tiers[category]} />
          </span>
          {blocked ? (
            <span className="absolute inset-x-1.5 bottom-1.5 rounded-md border border-amber-500/40 bg-ink/85 px-1.5 py-0.5 text-center text-[11px] font-semibold text-amber-300">
              {C.pool.blocked}
            </span>
          ) : (
            inTeam && (
              <span className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-md border border-gold/45 bg-ink/80 text-gold">
                <span className="sr-only">{C.artists.inTeam}</span>
                <Icon d={ICONS.check} className="h-4 w-4" />
              </span>
            )
          )}
        </span>
        <span className="block min-w-0 p-2">
          <span className="flex items-baseline justify-between gap-1">
            <span className="block truncate text-sm font-semibold">{a.name}</span>
            <span className="tabular shrink-0 text-xs font-semibold text-zinc-300">{formatStat(a.scores[category], locale)}</span>
          </span>
          <span className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <GenreIcon genre={a.genre} className="h-3 w-3 shrink-0" />
            <span className="truncate">{a.genre}</span>
          </span>
          <span className="mt-0.5 flex items-baseline justify-between gap-2 text-xs">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.artists.origin}</span>
            <span className="truncate text-zinc-300">
              {a.origin ?? "—"}
              {a.season !== null && ` · S${a.season}`}
            </span>
          </span>
          <SkillList skills={a.skills} locale={locale} className="mt-1 border-t border-white/10 pt-1" />
        </span>
        {owned && (
          <button
            type="button"
            onClick={() => onOwned(a.slug, !owned.has(a.slug))}
            aria-pressed={owned.has(a.slug)}
            aria-label={owned.has(a.slug) ? t(C.collection.markMissing, { name: a.name }) : t(C.collection.markOwned, { name: a.name })}
            className={`mt-auto min-h-11 cursor-pointer border-t px-2 text-xs font-semibold transition-colors duration-200 ${
              owned.has(a.slug)
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {owned.has(a.slug) ? C.collection.owned : C.collection.missing}
          </button>
        )}
      </div>
    </li>
  );
}
