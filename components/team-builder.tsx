"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Artist } from "@/lib/artists";

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

const STAT_ORDER = ["Dmg pemain", "Dmg skill", "Serangan", "DPS", "Fan", "Fan rally", "Red. serangan", "Red. skill"];
const isPercent = (name: string) => name !== "DPS";
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
};

function TierBadge({ tier, className = "" }: { tier: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${TIER_STYLE[tier] ?? TIER_STYLE.D} ${className}`}>
      {tier}
    </span>
  );
}

function Avatar({ artist, size = "h-10 w-10" }: { artist: Artist; size?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${AVATAR_STYLE[artist.tier] ?? AVATAR_STYLE.D} ${size}`}>
      <Image
        src={`/assets/images/artists/thumb/${artist.slug}.webp`}
        alt=""
        width={96}
        height={96}
        sizes="96px"
        className="h-full w-full object-cover"
      />
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

  const bySlug = useMemo(() => new Map(artists.map((a) => [a.slug, a])), [artists]);
  const tiers = useMemo(() => ["Semua", ...new Set(artists.map((a) => a.tier))], [artists]);
  const genres = useMemo(() => ["Semua", ...new Set(artists.map((a) => a.genre))].sort(), [artists]);

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
        a.skills.some((s) => s.name.toLowerCase().includes(query.toLowerCase()))),
  );

  const summary = useMemo(() => {
    const genreCount = new Map<string, number>();
    const statTotal = new Map<string, number>();
    for (const a of team) {
      genreCount.set(a.genre, (genreCount.get(a.genre) ?? 0) + 1);
      for (const s of a.skills) {
        const value = Number.parseFloat(s.value);
        if (Number.isFinite(value)) statTotal.set(s.name, (statTotal.get(s.name) ?? 0) + value);
      }
    }
    const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]);
    const [topGenre, topCount] = genres[0] ?? ["", 0];
    const playerDmg = statTotal.get("Dmg pemain") ?? 0;
    const isBoosted = (n: string) => n === "Dmg skill" || n === "Serangan";
    return {
      genres,
      stats: STAT_ORDER.filter((n) => statTotal.has(n) || (isBoosted(n) && playerDmg > 0)).map((n) => [n, statTotal.get(n) ?? 0] as const),
      playerDmg,
      topGenre,
      topCount,
      genreBonus: GENRE_BONUS[topCount] ?? 0,
      tiers: team.map((a) => a.tier).join(" · "),
    };
  }, [team]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Team Builder</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Pilih {TEAM_SIZE} artist, lihat komposisi tier, genre, dan skill. Pilihan tersimpan otomatis di browser.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel/80 px-4 py-2.5">
          <Icon d={ICONS.users} className="h-5 w-5 text-gold" />
          <span className="tabular text-sm font-semibold">
            {team.length}/{TEAM_SIZE}
          </span>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-xs text-zinc-400">{artists.length} artist</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Roster */}
        <section aria-label="Daftar artist" className="order-2 lg:order-1">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Cari nama, genre, atau skill…"
                aria-label="Cari artist"
                className="w-full rounded-xl border border-white/10 bg-panel/80 py-2.5 pr-3 pl-9 text-sm placeholder:text-zinc-500 focus:border-brand/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter tier">
              {tiers.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  aria-pressed={tier === t}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
                    tier === t ? "border-gold/50 bg-gold/15 text-gold" : "border-white/10 bg-panel/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter genre">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  aria-pressed={genre === g}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                    genre === g ? "border-brand/50 bg-brand/15 text-red-300" : "border-white/10 bg-panel/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                  }`}
                >
                  <GenreIcon genre={g} className="h-3.5 w-3.5" />
                  {g}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((a) => {
              const active = picked.includes(a.slug);
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => toggle(a.slug)}
                    aria-pressed={active}
                    disabled={!active && full}
                    className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors duration-200 ${
                      active
                        ? "border-gold/45 bg-gold/10"
                        : "border-white/10 bg-panel/70 hover:border-white/25 hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    <Avatar artist={a} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{a.name}</span>
                        <TierBadge tier={a.tier} />
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                        {a.genre} · {a.skills.map((s) => `${s.name}${s.value ? ` ${s.value}` : ""}`).join(" / ")}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors duration-200 ${
                        active ? "border-gold/45 bg-gold/20 text-gold" : "border-white/10 text-zinc-500 group-hover:text-zinc-200"
                      }`}
                    >
                      <Icon d={active ? ICONS.check : ICONS.plus} className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {visible.length === 0 && <p className="mt-6 text-sm text-zinc-500">Tidak ada artist yang cocok dengan filter.</p>}
        </section>

        {/* Team panel */}
        <aside aria-label="Tim kamu" className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-panel/80 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-300">Tim Kamu</h2>
              {team.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked([])}
                  className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
                >
                  <Icon d={ICONS.trash} className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            <ol className="flex flex-col gap-2">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const a = team[i];
                return (
                  <li
                    key={i}
                    className={`flex min-h-[3.25rem] items-center gap-3 rounded-xl border p-2 ${
                      a ? "border-white/15 bg-panel-2" : "border-dashed border-white/10"
                    }`}
                  >
                    {a ? (
                      <>
                        <Avatar artist={a} size="h-9 w-9" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">{a.name}</span>
                            <TierBadge tier={a.tier} />
                          </span>
                          <span className="block truncate text-[11px] text-zinc-400">{a.genre}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => toggle(a.slug)}
                          aria-label={`Hapus ${a.name} dari tim`}
                          className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-zinc-500 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
                        >
                          <Icon d={ICONS.close} className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="px-1 text-xs text-zinc-600">Slot {i + 1} kosong</span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="border-t border-white/10 pt-3">
              {team.length === 0 ? (
                <p className="text-xs text-zinc-500">Klik artist di daftar untuk mengisi slot.</p>
              ) : (
                <dl className="flex flex-col gap-3 text-xs">
                  <div>
                    <dt className="text-zinc-500">Komposisi tier</dt>
                    <dd className="tabular mt-0.5 font-semibold text-zinc-200">{summary.tiers}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Genre</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {summary.genres.map(([g, n]) => (
                        <span key={g} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-zinc-300">
                          <GenreIcon genre={g} className="h-3 w-3" />
                          {g} <span className="text-zinc-500">×{n}</span>
                        </span>
                      ))}
                    </dd>
                    <dd className="mt-1.5 flex flex-wrap items-center gap-1">
                      {summary.genreBonus > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">
                          Sinergi {summary.topCount}× {summary.topGenre}: +{summary.genreBonus}%
                        </span>
                      ) : (
                        <span className="text-zinc-500">
                          Sinergi: {summary.topCount}× {summary.topGenre} — butuh 3 genre sama untuk +5%
                        </span>
                      )}
                      <span className="text-zinc-600">(info, tidak dihitung)</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Statistik total</dt>
                    <dd className="mt-1 flex flex-col gap-1">
                      {summary.stats.length === 0 && <span className="text-zinc-500">Tidak ada skill berangka.</span>}
                      {summary.stats.map(([name, value]) => {
                        const boosted = (name === "Dmg skill" || name === "Serangan") && summary.playerDmg > 0;
                        return (
                          <div key={name} className="flex items-baseline justify-between gap-2">
                            <span className="text-zinc-400">{name}</span>
                            <span className="tabular font-semibold text-zinc-200">
                              {formatStat(value)}
                              {isPercent(name) && "%"}
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
          </div>
        </aside>
      </div>
    </main>
  );
}
