"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artist, Effect } from "@/lib/artists";
import { EFFECT_LABEL } from "@/lib/score";

const TEAM_SIZE = 5;
const STORAGE_KEY = "topgirl.team.v1";

const TIER_STYLE: Record<string, string> = {
  "S+": "border-gold/45 bg-gold/15 text-gold",
  S: "border-brand/45 bg-brand/15 text-red-300",
  A: "border-purple-500/45 bg-purple-500/15 text-purple-300",
  B: "border-sky-500/45 bg-sky-500/15 text-sky-300",
  C: "border-emerald-500/45 bg-emerald-500/15 text-emerald-300",
  D: "border-zinc-500/45 bg-zinc-500/15 text-zinc-300",
};

const AVATAR_STYLE: Record<string, string> = {
  "S+": "from-gold/80 to-brand/70",
  S: "from-brand/80 to-brand/40",
  A: "from-purple-500/80 to-purple-700/50",
  B: "from-sky-500/80 to-sky-700/50",
  C: "from-emerald-500/80 to-emerald-700/50",
  D: "from-zinc-500/80 to-zinc-700/50",
};

const GENRE_IMAGE: Record<string, string> = {
  Pop: "pop",
  Rock: "rock",
  "Hip Hop": "hiphop",
  EDM: "edm",
  "R&B": "rnb",
};

// Genre synergy is informational here: 3/4/5 artists of one genre grant +5/+10/+25% in game.
const GENRE_BONUS: Record<number, number> = { 3: 5, 4: 10, 5: 25 };

const STAT_ORDER: Effect[] = [
  "player_dmg",
  "skill_dmg",
  "basic_atk",
  "dps_def",
  "dps_atk_company",
  "dps_atk_rally",
  "fan",
  "fan_rally",
  "basic_atk_red",
  "skill_dmg_red",
  "wbg_dmg",
  "gold",
  "drive",
];

const isPercent = (effect: Effect) => !effect.startsWith("dps");
const skillText = (s: Artist["skills"][number]) =>
  `${EFFECT_LABEL[s.effect]}${s.value !== null ? ` ${s.value}${isPercent(s.effect) ? "%" : ""}` : ""}`;
const formatStat = (v: number) => v.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  plus: "M12 5v14M5 12h14",
  close: "M18 6 6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  check: "M20 6 9 17l-5-5",
  chevron: "m6 9 6 6 6-6",
};

function TierBadge({ tier, className = "" }: { tier: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-display text-sm font-semibold ${TIER_STYLE[tier] ?? TIER_STYLE.D} ${className}`}>
      {tier}
    </span>
  );
}

function Avatar({ artist, size = "h-12 w-12" }: { artist: Artist; size?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${AVATAR_STYLE[artist.tier] ?? AVATAR_STYLE.D} ${size}`}>
      {artist.photoUrl ? (
        <Image
          src={artist.photoUrl}
          alt=""
          width={96}
          height={96}
          sizes="96px"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-lg font-bold text-white/80">
          {artist.name[0]}
        </span>
      )}
    </span>
  );
}

function GenreIcon({ genre, className = "h-4 w-4" }: { genre: string; className?: string }) {
  const file = GENRE_IMAGE[genre];
  if (!file) return null;
  return <Image src={`/assets/images/genres/${file}.png`} alt="" width={16} height={16} sizes="16px" className={`${className} object-contain`} />;
}

export function TeamBuilder({ artists }: { artists: Artist[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("Semua");
  const [genre, setGenre] = useState("Semua");
  const [panelOpen, setPanelOpen] = useState(false);

  const bySlug = useMemo(() => new Map(artists.map((a) => [a.slug, a])), [artists]);
  const tiers = useMemo(() => ["Semua", ...new Set(artists.map((a) => a.tier))], [artists]);
  const genres = useMemo(() => ["Semua", ...new Set(artists.map((a) => a.genre).filter(Boolean))].sort(), [artists]);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setPicked(saved.filter((s) => typeof s === "string" && bySlug.has(s)).slice(0, TEAM_SIZE));
    } catch {
      // corrupt storage: start empty
    }
  }, [bySlug]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
  }, [picked]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  const team = picked.map((slug) => bySlug.get(slug)).filter((a): a is Artist => Boolean(a));
  const full = team.length >= TEAM_SIZE;

  function toggle(slug: string) {
    setPicked((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= TEAM_SIZE ? prev : [...prev, slug]));
  }

  const visible = artists.filter(
    (a) =>
      (tier === "Semua" || a.tier === tier) &&
      (genre === "Semua" || a.genre === genre) &&
      (query === "" ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.genre.toLowerCase().includes(query.toLowerCase()) ||
        a.skills.some((s) => EFFECT_LABEL[s.effect].toLowerCase().includes(query.toLowerCase()))),
  );

  const summary = useMemo(() => {
    const genreCount = new Map<string, number>();
    const statTotal = new Map<Effect, number>();
    for (const a of team) {
      genreCount.set(a.genre, (genreCount.get(a.genre) ?? 0) + 1);
      for (const s of a.skills) {
        if (s.value !== null) statTotal.set(s.effect, (statTotal.get(s.effect) ?? 0) + s.value);
      }
    }
    const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]);
    const [topGenre, topCount] = genres[0] ?? ["", 0];
    const playerDmg = statTotal.get("player_dmg") ?? 0;
    const isBoosted = (e: Effect) => e === "skill_dmg" || e === "basic_atk";
    return {
      genres,
      stats: STAT_ORDER.filter((e) => statTotal.has(e) || (isBoosted(e) && playerDmg > 0)).map((e) => [e, statTotal.get(e) ?? 0] as const),
      playerDmg,
      topGenre,
      topCount,
      genreBonus: GENRE_BONUS[topCount] ?? 0,
      tiers: team.map((a) => a.tier).join(" · "),
    };
  }, [team]);

  const panel = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold tracking-wide uppercase text-zinc-300">Tim Kamu</h2>
        <div className="flex items-center gap-1">
          {team.length > 0 && (
            <button
              type="button"
              onClick={() => setPicked([])}
              className="flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
            >
              <Icon d={ICONS.trash} className="h-4 w-4" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Tutup panel tim"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-zinc-200 lg:hidden"
          >
            <Icon d={ICONS.close} className="h-5 w-5" />
          </button>
        </div>
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
                      <span className="tabular text-xs text-zinc-400">{formatStat(a.score)}</span>
                    </span>
                    <span className="block truncate text-sm text-zinc-400">{a.genre}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(a.slug)}
                    aria-label={`Hapus ${a.name} dari tim`}
                    className="grid h-10 w-10 cursor-pointer place-items-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
                  >
                    <Icon d={ICONS.close} className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <span className="px-1 text-sm text-zinc-400">Slot {i + 1} kosong</span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="border-t border-white/10 pt-3">
        {team.length === 0 ? (
          <p className="text-sm text-zinc-400">Klik artist di daftar untuk mengisi slot.</p>
        ) : (
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-zinc-400">Komposisi tier</dt>
              <dd className="tabular mt-0.5 font-semibold text-zinc-200">{summary.tiers}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Genre</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {summary.genres.map(([g, n]) => (
                  <span key={g} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-zinc-300">
                    <GenreIcon genre={g} className="h-3 w-3" />
                    {g} <span className="text-zinc-400">×{n}</span>
                  </span>
                ))}
              </dd>
              <dd className="mt-1.5 flex flex-wrap items-center gap-1">
                {summary.genreBonus > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">
                    Sinergi {summary.topCount}× {summary.topGenre}: +{summary.genreBonus}%
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    Sinergi: {summary.topCount}× {summary.topGenre} — butuh 3 genre sama untuk +5%
                  </span>
                )}
                <span className="text-zinc-400">(info, tidak dihitung)</span>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400">Statistik total</dt>
              <dd className="mt-1 flex flex-col gap-1.5">
                {summary.stats.length === 0 && <span className="text-zinc-400">Tidak ada skill berangka.</span>}
                {summary.stats.map(([effect, value]) => {
                  const boosted = (effect === "skill_dmg" || effect === "basic_atk") && summary.playerDmg > 0;
                  return (
                    <div key={effect} className="flex items-baseline justify-between gap-2">
                      <span className="text-zinc-400">{EFFECT_LABEL[effect]}</span>
                      <span className="tabular shrink-0 whitespace-nowrap font-semibold text-zinc-200">
                        {formatStat(value)}
                        {isPercent(effect) && "%"}
                        {boosted && (
                          <span className="ml-1 font-normal text-emerald-300">
                            +{formatStat(summary.playerDmg)}% = {formatStat(value + summary.playerDmg)}%
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
    </>
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-6 pb-32 sm:px-6 sm:pb-8 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/icon-topgirl.webp"
            alt=""
            width={96}
            height={96}
            sizes="48px"
            priority
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
          />
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-4xl">Team Builder</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">
              Pilih {TEAM_SIZE} artist, lihat tier hasil skor skill, genre, dan statistik. Pilihan tersimpan otomatis di browser.
            </p>
          </div>
        </div>
        <Link
          href="/isi"
          className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
        >
          Isi stat
        </Link>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-panel/80 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <Icon d={ICONS.users} className="h-5 w-5 text-gold" />
          <span className="tabular text-sm font-semibold sm:text-base">
            {team.length}/{TEAM_SIZE}
          </span>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-sm text-zinc-400">{artists.length} artist</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Roster */}
        <section aria-label="Daftar artist" className="min-w-0">
          <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-2 border-b border-white/5 bg-ink/95 px-4 pt-2 pb-2 backdrop-blur sm:static sm:mx-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <div className="relative">
              <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Cari nama, genre, atau skill…"
                aria-label="Cari artist"
                className="w-full rounded-xl border border-white/10 bg-panel/80 py-3 pr-3 pl-9 text-base placeholder:text-zinc-400 focus:border-brand/60"
              />
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter tier"
            >
              {tiers.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  aria-pressed={tier === t}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border px-3 py-1 text-sm font-semibold transition-colors duration-200 ${
                    tier === t ? "border-gold/50 bg-gold/15 text-gold" : "border-white/10 bg-panel/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter genre"
            >
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  aria-pressed={genre === g}
                  className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-medium transition-colors duration-200 ${
                    genre === g ? "border-brand/50 bg-brand/15 text-red-300" : "border-white/10 bg-panel/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  <GenreIcon genre={g} className="h-4 w-4" />
                  {g}
                </button>
              ))}
            </div>
          </div>

          {tiers
            .filter((t) => t !== "Semua")
            .map((t) => [t, visible.filter((a) => a.tier === t)] as const)
            .filter(([, list]) => list.length > 0)
            .map(([t, list]) => (
              <section key={t} className="mt-4">
                <h2 className="mb-2 flex items-center gap-2">
                  <TierBadge tier={t} />
                  <span className="text-xs font-normal text-zinc-400">{list.length} artist</span>
                </h2>
                <ul className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  {list.map((a) => {
                    const active = picked.includes(a.slug);
                    return (
                      <li key={a.slug} className="shrink-0 snap-start sm:shrink">
                        <button
                          type="button"
                          onClick={() => toggle(a.slug)}
                          aria-pressed={active}
                          disabled={!active && full}
                          className={`group relative flex w-36 cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-colors duration-200 sm:w-full ${
                            active
                              ? "border-gold/45 bg-gold/10"
                              : "border-white/10 bg-panel/70 hover:border-white/25 hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
                          }`}
                        >
                          <span className="relative block aspect-[9/16] w-full bg-panel-2">
                            {a.photoUrl ? (
                              <Image
                                src={a.photoUrl}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 144px, 200px"
                                className="object-cover"
                              />
                            ) : (
                              <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/25">
                                {a.name[0]}
                              </span>
                            )}
                            <span className="absolute top-1.5 left-1.5 rounded-md bg-ink/70 p-0.5 backdrop-blur-sm">
                              <TierBadge tier={a.tier} />
                            </span>
                            <span
                              aria-hidden="true"
                              className={`absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-md border transition-colors duration-200 ${
                                active
                                  ? "border-gold/45 bg-gold/20 text-gold"
                                  : "border-white/15 bg-ink/70 text-zinc-300 group-hover:text-zinc-100"
                              }`}
                            >
                              <Icon d={active ? ICONS.check : ICONS.plus} className="h-4 w-4" />
                            </span>
                          </span>
                          <span className="block min-w-0 p-2">
                            <span className="flex items-baseline justify-between gap-1">
                              <span className="block truncate text-sm font-semibold">{a.name}</span>
                              <span className="tabular shrink-0 text-xs font-semibold text-zinc-300">{formatStat(a.score)}</span>
                            </span>
                            <span className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                              <GenreIcon genre={a.genre} className="h-3 w-3 shrink-0" />
                              <span className="truncate">{a.genre}</span>
                            </span>
                            <span className="mt-1 hidden truncate text-xs text-zinc-400 sm:block">
                              {a.skills.map(skillText).join(" / ")}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

          {visible.length === 0 && <p className="mt-6 text-base text-zinc-400">Tidak ada artist yang cocok dengan filter.</p>}
        </section>

        {/* Team panel (desktop) */}
        <aside aria-label="Tim kamu" className="hidden lg:block">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-panel/80 p-4">{panel}</div>
        </aside>
      </div>

      {/* Team dock (mobile) */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-panel/95 px-4 pt-2 backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label="Buka panel tim"
          aria-expanded={panelOpen}
          className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {team.length === 0 ? (
              <span className="text-sm text-zinc-400">Tim kosong — pilih artist</span>
            ) : (
              team.map((a) => <Avatar key={a.slug} artist={a} size="h-8 w-8 text-xs" />)
            )}
            {summary.genreBonus > 0 && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
                +{summary.genreBonus}%
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="tabular text-sm font-semibold">
              {team.length}/{TEAM_SIZE}
            </span>
            <Icon d={ICONS.chevron} className="h-4 w-4 rotate-180 text-zinc-400" />
          </span>
        </button>
      </div>

      {/* Team sheet (mobile) */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Tutup panel tim"
            className="absolute inset-0 h-full w-full cursor-pointer bg-black/60"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tim kamu"
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-panel p-4 shadow-2xl"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" aria-hidden="true" />
            <div className="flex flex-col gap-4">{panel}</div>
          </div>
        </div>
      )}
    </main>
  );
}
