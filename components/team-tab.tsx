"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Artist, Category, Effect } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { EFFECT_LABEL } from "@/lib/score";
import { GENRE_BONUS, STAT_ORDER, TEAM_SIZE } from "@/lib/team";
import { ArtistFilterBar, type ArtistFilterState } from "./artist-filter";
import { Avatar, GenreIcon, ICONS, Icon, TierBadge, formatStat, isPercent } from "./artist-ui";

type Props = {
  artists: Artist[];
  team: Artist[];
  picked: string[];
  locale: Locale;
  category: Category;
  state: ArtistFilterState;
  onToggle: (slug: string) => void;
  onAssign: (index: number, slug: string) => void;
  onReset: () => void;
};

export function TeamTab({ artists, team, picked, locale, category, state, onToggle, onAssign, onReset }: Props) {
  const C = DICT[locale];
  // Slot yang sedang dipilih; null = dialog tertutup. Picker menggantikan daftar panjang di bawah.
  const [slot, setSlot] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (slot !== null && !d.open) d.showModal();
    if (slot === null && d.open) d.close();
  }, [slot]);

  const current = slot === null ? undefined : team[slot];
  // Artist di slot aktif tetap tampil supaya bisa dibatalkan; yang lain sudah dipakai disembunyikan.
  const candidates = state.visible
    .filter((a) => a.slug === current?.slug || !picked.includes(a.slug))
    .sort((a, b) => b.scores[category] - a.scores[category]);

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
      tiers: team.map((a) => a.tiers[category]).join(" · "),
    };
  }, [team, category]);

  function open(index: number) {
    setSlot(index);
  }

  function choose(a: Artist) {
    if (slot === null) return;
    if (current?.slug !== a.slug) onAssign(slot, a.slug);
    setSlot(null);
  }

  return (
    <section aria-label={C.team.section} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.team.title}</h2>
        {team.length > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-11 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
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
              className={`flex min-h-[4rem] items-center gap-1 border p-2.5 ${
                a ? "rounded-xl border-white/15 bg-panel-2" : "rounded-xl border-dashed border-white/10"
              }`}
            >
              {a ? (
                <>
                  <button
                    type="button"
                    onClick={() => open(i)}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left transition-colors duration-200 hover:bg-white/5"
                  >
                    <Avatar artist={a} tier={a.tiers[category]} size="h-10 w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-base font-semibold">{a.name}</span>
                        <TierBadge tier={a.tiers[category]} />
                        <span className="tabular text-xs text-zinc-400">{formatStat(a.scores[category], locale)}</span>
                      </span>
                      <span className="block truncate text-sm text-zinc-400">{a.genre}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(a.slug)}
                    aria-label={t(C.team.remove, { name: a.name })}
                    className="grid h-11 w-11 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
                  >
                    <Icon d={ICONS.close} className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => open(i)}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-lg px-1 text-left text-sm text-zinc-400 transition-colors duration-200 hover:text-zinc-200"
                >
                  <Icon d={ICONS.plus} className="h-4 w-4 shrink-0" />
                  {t(C.team.emptySlot, { n: i + 1 })}
                </button>
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
                  <span className="text-zinc-400">{t(C.team.synergyNeed, { n: summary.topCount, genre: summary.topGenre })}</span>
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

      <dialog
        ref={dialog}
        aria-labelledby="team-picker-title"
        onClose={() => setSlot(null)}
        className="m-auto w-[min(100%-2rem,32rem)] rounded-2xl border border-white/10 bg-panel p-0 text-zinc-100 backdrop:bg-ink/80"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 p-3">
            <h2 id="team-picker-title" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
              {t(C.team.chooseSlot, { n: (slot ?? 0) + 1 })}
            </h2>
            <button
              type="button"
              onClick={() => setSlot(null)}
              aria-label={C.common.close}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-zinc-100"
            >
              <Icon d={ICONS.close} className="h-5 w-5" />
            </button>
          </div>
          <div className="p-3">
            <ArtistFilterBar artists={artists} locale={locale} state={state} bare />
          </div>
          <ul className="flex flex-col gap-2 overflow-y-auto px-3 pb-3">
            {candidates.map((a) => {
              const active = a.slug === current?.slug;
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => choose(a)}
                    aria-pressed={active}
                    className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border p-2 text-left transition-colors duration-200 ${
                      active ? "border-gold/45 bg-gold/10" : "border-white/10 bg-panel/70 hover:border-white/25 hover:bg-panel-2"
                    }`}
                  >
                    <Avatar artist={a} tier={a.tiers[category]} size="h-9 w-9" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{a.name}</span>
                        <TierBadge tier={a.tiers[category]} />
                      </span>
                      <span className="tabular block truncate text-xs text-zinc-400">
                        {a.genre} · {formatStat(a.scores[category], locale)}
                      </span>
                      <span className="mt-1 flex flex-col gap-0.5">
                        {a.skills.map((s, i) => (
                          <span key={i} className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="truncate text-zinc-400">{EFFECT_LABEL[s.effect][locale]}</span>
                            <span className="tabular shrink-0 font-semibold text-zinc-200">
                              {s.value === null ? "—" : `${formatStat(s.value, locale)}${isPercent(s.effect) ? "%" : ""}`}
                            </span>
                          </span>
                        ))}
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
          {candidates.length === 0 && <p className="px-3 pb-3 text-sm text-zinc-400">{C.team.empty}</p>}
        </div>
      </dialog>
    </section>
  );
}
