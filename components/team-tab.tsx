"use client";

import { useMemo, useState } from "react";
import type { Artist, Effect } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { EFFECT_LABEL } from "@/lib/score";
import { GENRE_BONUS, STAT_ORDER, TEAM_SIZE } from "@/lib/team";
import { Avatar, GenreIcon, ICONS, Icon, SearchInput, TierBadge, formatStat, isPercent } from "./artist-ui";

type Props = {
  artists: Artist[];
  team: Artist[];
  picked: string[];
  full: boolean;
  locale: Locale;
  onToggle: (slug: string) => void;
  onReset: () => void;
};

export function TeamTab({ artists, team, picked, full, locale, onToggle, onReset }: Props) {
  const C = DICT[locale];
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  // ponytail: sort ulang tiap render; roster ~60 baris, memo belum perlu.
  const pickable = artists
    .filter(
      (a) =>
        q === "" ||
        a.name.toLowerCase().includes(q) ||
        a.genre.toLowerCase().includes(q) ||
        a.skills.some((s) => EFFECT_LABEL[s.effect][locale].toLowerCase().includes(q)),
    )
    .sort((a, b) => b.score - a.score);

  const summary = useMemo(() => {
    const genreCount = new Map<string, number>();
    const statTotal = new Map<Effect, number>();
    for (const a of team) {
      genreCount.set(a.genre, (genreCount.get(a.genre) ?? 0) + 1);
      for (const s of a.skills) {
        if (s.value !== null) statTotal.set(s.effect, (statTotal.get(s.effect) ?? 0) + s.value);
      }
    }
    const genreList = [...genreCount.entries()].sort((a, b) => b[1] - a[1]);
    const [topGenre, topCount] = genreList[0] ?? ["", 0];
    const playerDmg = statTotal.get("player_dmg") ?? 0;
    const isBoosted = (e: Effect) => e === "skill_dmg" || e === "basic_atk";
    return {
      genreList,
      stats: STAT_ORDER.filter((e) => statTotal.has(e) || (isBoosted(e) && playerDmg > 0)).map((e) => [e, statTotal.get(e) ?? 0] as const),
      playerDmg,
      topGenre,
      topCount,
      genreBonus: GENRE_BONUS[topCount] ?? 0,
      tiers: team.map((a) => a.tier).join(" · "),
    };
  }, [team]);

  return (
    <section aria-label={C.team.section} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.team.title}</h2>
        {team.length > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
          >
            <Icon d={ICONS.trash} className="h-4 w-4" />
            {C.common.reset}
          </button>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {Array.from({ length: TEAM_SIZE }).map((_, i) => {
          const a = team[i];
          return (
            <li
              key={i}
              className={`flex min-h-[4rem] items-center gap-3 rounded-xl border p-2.5 ${
                a ? "border-white/15 bg-panel-2" : "border-dashed border-white/10"
              }`}
            >
              {a ? (
                <>
                  <Avatar artist={a} size="h-10 w-10" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-base font-semibold">{a.name}</span>
                      <TierBadge tier={a.tier} />
                      <span className="tabular text-xs text-zinc-400">{formatStat(a.score, locale)}</span>
                    </span>
                    <span className="block truncate text-sm text-zinc-400">{a.genre}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggle(a.slug)}
                    aria-label={t(C.team.remove, { name: a.name })}
                    className="grid h-10 w-10 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
                  >
                    <Icon d={ICONS.close} className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <span className="px-1 text-sm text-zinc-400">{t(C.team.emptySlot, { n: i + 1 })}</span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="border-t border-white/10 pt-3">
        {team.length === 0 ? (
          <p className="text-sm text-zinc-400">{C.team.pick}</p>
        ) : (
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-zinc-400">{C.team.tiers}</dt>
              <dd className="tabular mt-0.5 font-semibold text-zinc-200">{summary.tiers}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">{C.team.genre}</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {summary.genreList.map(([g, n]) => (
                  <span key={g} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-zinc-300">
                    <GenreIcon genre={g} className="h-3 w-3" />
                    {g} <span className="text-zinc-400">×{n}</span>
                  </span>
                ))}
              </dd>
              <dd className="mt-1.5 flex flex-wrap items-center gap-1">
                {summary.genreBonus > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">
                    {t(C.team.synergy, { n: summary.topCount, genre: summary.topGenre, bonus: summary.genreBonus })}
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    {t(C.team.synergyNeed, { n: summary.topCount, genre: summary.topGenre })}
                  </span>
                )}
                <span className="text-zinc-400">{C.team.infoOnly}</span>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400">{C.team.stats}</dt>
              <dd className="mt-1 flex flex-col gap-1.5">
                {summary.stats.length === 0 && <span className="text-zinc-400">{C.team.noStats}</span>}
                {summary.stats.map(([effect, value]) => {
                  const boosted = (effect === "skill_dmg" || effect === "basic_atk") && summary.playerDmg > 0;
                  return (
                    <div key={effect} className="flex items-baseline justify-between gap-2">
                      <span className="text-zinc-400">{EFFECT_LABEL[effect][locale]}</span>
                      <span className="tabular shrink-0 whitespace-nowrap font-semibold text-zinc-200">
                        {formatStat(value, locale)}
                        {isPercent(effect) && "%"}
                        {boosted && (
                          <span className="ml-1 font-normal text-emerald-300">
                            +{formatStat(summary.playerDmg, locale)}% = {formatStat(value + summary.playerDmg, locale)}%
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <h2 className="font-display mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.team.add}</h2>
        <SearchInput value={query} onChange={setQuery} locale={locale} />
        <ul className="mt-2 flex flex-col gap-2">
          {pickable.map((a) => {
            const active = picked.includes(a.slug);
            return (
              <li key={a.slug}>
                <button
                  type="button"
                  onClick={() => onToggle(a.slug)}
                  aria-pressed={active}
                  disabled={!active && full}
                  className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border p-2 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    active ? "border-gold/45 bg-gold/10" : "border-white/10 bg-panel/70 hover:border-white/25 hover:bg-panel-2"
                  }`}
                >
                  <Avatar artist={a} size="h-9 w-9" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{a.name}</span>
                      <TierBadge tier={a.tier} />
                    </span>
                    <span className="tabular block truncate text-xs text-zinc-400">
                      {a.genre} · {formatStat(a.score, locale)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${
                      active ? "border-gold/45 bg-gold/20 text-gold" : "border-white/15 text-zinc-300"
                    }`}
                  >
                    <Icon d={active ? ICONS.check : ICONS.plus} className="h-4 w-4" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {pickable.length === 0 && <p className="mt-3 text-sm text-zinc-400">{C.team.empty}</p>}
      </div>
    </section>
  );
}
