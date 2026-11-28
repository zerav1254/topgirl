"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Artist } from "@/lib/artists";
import { FAN_CAP_MAX } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import type { Rank } from "@/lib/pool";
import { EFFECT_LABEL, type Tier } from "@/lib/score";
import { genreSynergy, TEAM_SIZE, teamFanCap, teamSkillTotals, withGenreBonus } from "@/lib/team";
import { ArtistFilterBar, type ArtistFilterState } from "./artist-filter";
import { Avatar, GenreIcon, ICONS, Icon, RankBadge, SkillList, StatIcon, TierBadge, formatStat, isPercent } from "./artist-ui";
import { SaveLineup } from "./save-lineup";

type Props = {
  artists: Artist[];
  // scoped = artis yang bisa diperoleh di pool; blocked = di atas season server.
  scoped: Artist[];
  blocked: Set<string>;
  rank: Map<string, Rank> | null;
  // Tier relatif pool (null saat pool tidak aktif).
  seasonTiers: Map<string, Tier> | null;
  team: Artist[];
  picked: string[];
  locale: Locale;
  // false = belum login: form simpan lineup diganti hint.
  signedIn: boolean;
  state: ArtistFilterState;
  onToggle: (slug: string) => void;
  onAssign: (index: number, slug: string) => void;
  onReset: () => void;
};

export function TeamTab({ artists, scoped, blocked, rank, seasonTiers, team, picked, locale, signedIn, state, onToggle, onAssign, onReset }: Props) {
  const C = DICT[locale];
  const tierOf = (a: Artist) => seasonTiers?.get(a.slug) ?? a.tier;
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
  // Kandidat = artis pool; artis di atas season server tetap boleh dipilih tapi diberi peringatan.
  const inPool = useMemo(() => new Set(scoped.map((a) => a.slug)), [scoped]);
  const sortValue = (a: Artist) => rank?.get(a.slug)?.rank ?? -a.score;
  const candidates = useMemo(
    () =>
      state.visible
        .filter((a) => inPool.has(a.slug) || blocked.has(a.slug))
        .filter((a) => a.slug === current?.slug || !picked.includes(a.slug))
        .sort((a, b) => sortValue(a) - sortValue(b)),
    // sortValue hanya bergantung pada rank; dimasukkan lewat deps di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.visible, inPool, blocked, current?.slug, picked, rank],
  );

  const genreImages = useMemo(() => new Map(artists.map((a) => [a.genre, a.genreImage])), [artists]);

  const summary = useMemo(() => {
    const synergy = genreSynergy(team);
    const sing = team.reduce((n, a) => n + (a.singMax ?? 0), 0);
    const dance = team.reduce((n, a) => n + (a.danceMax ?? 0), 0);
    return {
      genreList: synergy.genres,
      ...teamSkillTotals(team),
      sing: withGenreBonus(sing, synergy.bonus),
      dance: withGenreBonus(dance, synergy.bonus),
      fans: teamFanCap(team),
      hasMax: team.some((a) => a.singMax !== null),
      topGenre: synergy.genre,
      topCount: synergy.count,
      genreBonus: synergy.bonus,
      tiers: team.map((a) => seasonTiers?.get(a.slug) ?? a.tier).join(" · "),
    };
  }, [team, seasonTiers]);

  function open(index: number) {
    // Tim disimpan rapat tanpa slot kosong: klik slot setelah celah tetap mengisi posisi berikutnya.
    setSlot(index);
  }

  function choose(a: Artist) {
    if (slot === null) return;
    if (current?.slug !== a.slug) onAssign(slot, a.slug);
    setSlot(null);
  }

  return (
    <section aria-label={C.team.section} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.team.title}</h2>
        <div className="flex items-center gap-1">
          {team.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(C.team.confirmReset)) onReset();
              }}
              className="flex min-h-11 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors duration-200 hover:bg-surface hover:text-red-300"
            >
              <Icon d={ICONS.trash} className="h-4 w-4 shrink-0" />
              {C.common.reset}
            </button>
          )}
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {Array.from({ length: TEAM_SIZE }).map((_, i) => {
          const a = team[i];
          return (
            <li
              key={i}
              className={`flex min-h-[4rem] items-center gap-1 border p-2.5 ${
                a ? "rounded-xl border-white/15 bg-panel-2" : "rounded-xl border-dashed border-line"
              }`}
            >
              {a ? (
                <>
                  <button
                    type="button"
                    onClick={() => open(i)}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left transition-colors duration-200 hover:bg-surface"
                  >
                    <Avatar artist={a} tier={tierOf(a)} size="h-10 w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-base font-semibold">{a.name}</span>
                        <TierBadge tier={tierOf(a)} />
                        <span className="tabular text-xs text-zinc-400">{formatStat(a.score, locale)}</span>
                      </span>
                      <span className="block truncate text-sm text-zinc-400">{a.genre}</span>
                      {blocked.has(a.slug) && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-300">
                          <Icon d={ICONS.info} className="h-3.5 w-3.5 shrink-0" />
                          {C.pool.blocked}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(a.slug)}
                    aria-label={t(C.team.remove, { name: a.name })}
                    className="grid h-11 w-11 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-surface hover:text-red-300"
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

      <div className="border-t border-line pt-3">
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
                  <span key={g} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-zinc-300">
                    <GenreIcon image={genreImages.get(g) ?? null} className="h-3 w-3 shrink-0" />
                    {g} <span className="text-zinc-400">×{n}</span>
                  </span>
                ))}
              </dd>
              <dd className="mt-1.5 flex flex-wrap items-center gap-1">
                {summary.genreBonus > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">
                      {t(C.team.synergy, { n: summary.topCount, genre: summary.topGenre, bonus: summary.genreBonus })}
                    </span>
                    <span className="text-zinc-400">{C.team.synergyApplied}</span>
                  </>
                ) : (
                  <span className="text-zinc-400">{t(C.team.synergyNeed, { n: summary.topCount, genre: summary.topGenre })}</span>
                )}
              </dd>
            </div>
            {summary.hasMax && (
              <div>
                <dt className="text-zinc-400">{C.team.statsMax}</dt>
                <dd className="tabular mt-0.5 flex gap-3 font-semibold text-zinc-200">
                  <span className="inline-flex items-center gap-1">
                    <StatIcon stat="sing" />
                    <span className="sr-only">{C.artists.sing}</span>
                    {formatStat(summary.sing, locale)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <StatIcon stat="dance" />
                    <span className="sr-only">{C.artists.dance}</span>
                    {formatStat(summary.dance, locale)}
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-400">{C.team.stats}</dt>
              <dd className="mt-1 flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 text-zinc-400">{C.team.fanCap}</span>
                  <span className="tabular text-right font-semibold text-zinc-200">{formatStat(summary.fans.total, locale)}</span>
                </div>
                {summary.stats.length === 0 && summary.fans.total === 0 && (
                  <span className="text-zinc-400">{C.team.noStats}</span>
                )}
                {summary.stats.map(([effect, value]) => {
                  const boosted = (effect === "skill_dmg" || effect === "basic_atk") && summary.playerDmg > 0;
                  return (
                    <div key={effect} className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-zinc-400">{EFFECT_LABEL[effect][locale]}</span>
                      <span className="tabular text-right font-semibold text-zinc-200">
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
              <dd className="mt-1 text-xs text-zinc-400">
                {t(C.team.fanCapNote, { base: formatStat(FAN_CAP_MAX, locale) })}
                {summary.fans.pct > 0 && ` ${t(C.team.fanCapBoost, { n: formatStat(summary.fans.pct, locale) })}`}
              </dd>
              <dd className="mt-1 text-xs text-zinc-400">{C.team.statsNote}</dd>
            </div>
          </dl>
        )}
      </div>

      <SaveLineup slugs={picked} locale={locale} signedIn={signedIn} />

      <dialog
        ref={dialog}
        aria-labelledby="team-picker-title"
        onClose={() => setSlot(null)}
        onClick={(e) => {
          // Klik backdrop jatuh ke elemen dialog sendiri, bukan isinya.
          if (e.target === e.currentTarget) setSlot(null);
        }}
        className="m-auto w-[min(100%-2rem,32rem)] rounded-2xl border border-line bg-panel p-0 text-zinc-100 backdrop:bg-ink/80"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-line p-3">
            <h2 id="team-picker-title" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
              {t(C.team.chooseSlot, { n: (slot ?? 0) + 1 })}
            </h2>
            <button
              type="button"
              onClick={() => setSlot(null)}
              aria-label={C.common.close}
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-surface hover:text-zinc-100"
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
              const r = rank?.get(a.slug);
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => choose(a)}
                    aria-pressed={active}
                    className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border p-2 text-left transition-colors duration-200 ${
                      active ? "border-gold/45 bg-gold/10" : "border-line bg-panel/70 hover:border-white/25 hover:bg-panel-2"
                    }`}
                  >
                    <Avatar artist={a} tier={tierOf(a)} size="h-9 w-9" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{a.name}</span>
                        {r ? <RankBadge rank={r.rank} size={r.size} label={t(C.pool.rank, { n: r.rank, total: r.size })} /> : <TierBadge tier={tierOf(a)} />}
                      </span>
                      <span className="tabular block truncate text-xs text-zinc-400">
                        {a.genre} · {formatStat(a.score, locale)}
                      </span>
                      <SkillList baseDmg={a.baseDmg} skills={a.skills} locale={locale} className="mt-1" />
                      {blocked.has(a.slug) && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-300">
                          <Icon d={ICONS.info} className="h-3.5 w-3.5 shrink-0" />
                          {C.pool.blocked}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${
                        active ? "border-gold/45 bg-gold/20 text-gold" : "border-white/15 text-zinc-300"
                      }`}
                    >
                      <Icon d={active ? ICONS.check : ICONS.plus} className="h-4 w-4 shrink-0" />
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
