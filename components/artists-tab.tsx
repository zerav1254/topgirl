"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { TIER_ORDER, type Category } from "@/lib/score";
import { ArtistFilterBar, type ArtistFilterState } from "./artist-filter";
import { GenreIcon, ICONS, Icon, SkillList, TierBadge, formatStat } from "./artist-ui";

type Props = {
  artists: Artist[];
  picked: string[];
  locale: Locale;
  category: Category;
  state: ArtistFilterState;
};

// Season hanya bermakna untuk artist dari kota tuan rumah; origin lain tidak menampilkannya.
export function ArtistsTab({ artists, picked, locale, category, state }: Props) {
  const C = DICT[locale];
  const visible = state.visible;
  // Urutan chip ikut TIER_ORDER, bukan urutan data; tier tanpa artist tidak ditampilkan.
  const tiers = useMemo(() => {
    const present = new Set(artists.map((a) => a.tiers[category]));
    return TIER_ORDER.filter((tier) => present.has(tier));
  }, [artists, category]);

  return (
    <section aria-label={C.artists.section} className="flex min-w-0 flex-col">
      <div className="sm:sticky sm:top-0">
        <ArtistFilterBar artists={artists} locale={locale} state={state} />
      </div>

      <p aria-live="polite" className="sr-only">
        {t(C.artists.results, { n: visible.length })}
      </p>

      {tiers
        .map((tier) => [tier, visible.filter((a) => a.tiers[category] === tier)] as const)
        .filter(([, list]) => list.length > 0)
        .map(([tier, list]) => (
          <section key={tier} className="mt-4">
            <h2 className="mb-2 flex items-center gap-2">
              <TierBadge tier={tier} />
              <span className="text-xs font-normal text-zinc-400">{t(C.artists.tierCount, { n: list.length })}</span>
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {list.map((a) => {
                const inTeam = picked.includes(a.slug);
                return (
                  <li key={a.slug}>
                    {/* Kartu hanya info: pemilihan artist dilakukan di tab Team Builder. */}
                    <div
                      className={`relative flex w-full flex-col overflow-hidden rounded-xl border ${
                        inTeam ? "border-gold/30 bg-gold/5" : "border-white/10 bg-panel/70"
                      }`}
                    >
                      <span className="relative block aspect-[3/4] w-full bg-panel-2">
                        {a.photoUrl ? (
                          <Image src={a.photoUrl} alt="" fill sizes="(max-width: 640px) 45vw, (max-width: 768px) 33vw, 25vw" className="object-cover" />
                        ) : (
                          <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/25">
                            {a.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="absolute top-1.5 left-1.5 rounded-md bg-ink/70 p-0.5 backdrop-blur-sm">
                          <TierBadge tier={a.tiers[category]} />
                        </span>
                        {inTeam && (
                          <span className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-md border border-gold/45 bg-ink/80 text-gold">
                            <span className="sr-only">{C.artists.inTeam}</span>
                            <Icon d={ICONS.check} className="h-4 w-4" />
                          </span>
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
                          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                            {C.artists.origin}
                          </span>
                          <span className="truncate text-zinc-300">{a.origin ?? "—"}</span>
                        </span>
                        <SkillList skills={a.skills} locale={locale} className="mt-1 border-t border-white/10 pt-1" />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {visible.length === 0 && <p className="mt-6 text-base text-zinc-400">{C.artists.empty}</p>}
    </section>
  );
}
