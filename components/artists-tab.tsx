"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Artist, Effect } from "@/lib/artists";
import { EFFECTS, EFFECT_LABEL, TIER_ORDER } from "@/lib/score";
import { TEAM_SIZE } from "@/lib/team";
import { GenreIcon, ICONS, Icon, SearchInput, TierBadge, formatStat, skillList } from "./artist-ui";

type Props = {
  artists: Artist[];
  picked: string[];
  full: boolean;
  onToggle: (slug: string) => void;
  onOpenTeam: () => void;
};

type Filter = { genre: string; region: string; tier: string; skill: string };
type Option = { id: string; text: string };

function FilterRow({
  label,
  value,
  onChange,
  options: base,
  tone = "brand",
  genreIcon = false,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: Option[];
  tone?: "gold" | "brand";
  genreIcon?: boolean;
}) {
  const active = tone === "gold" ? "border-gold/50 bg-gold/15 text-gold" : "border-brand/50 bg-brand/15 text-red-300";
  // "Semua" hanya muncul saat baris terfilter, sebagai jalan lepas filter baris itu.
  const options = value === "Semua" ? base : [{ id: "Semua", text: "Semua" }, ...base];
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <div
        className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={`Filter ${label}`}
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(value === o.id ? "Semua" : o.id)}
            aria-pressed={value === o.id}
            className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-semibold transition-colors duration-200 ${
              value === o.id ? active : "border-white/10 bg-panel/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
            }`}
          >
            {genreIcon && <GenreIcon genre={o.id} className="h-4 w-4" />}
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ArtistsTab({ artists, picked, full, onToggle, onOpenTeam }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>({ genre: "Semua", region: "Semua", tier: "Semua", skill: "Semua" });
  const set = (key: keyof Filter) => (id: string) => setFilter((f) => ({ ...f, [key]: id }));
  const filtered = Object.values(filter).some((v) => v !== "Semua");

  const genres = useMemo(() => [...new Set(artists.map((a) => a.genre).filter(Boolean))].sort(), [artists]);
  const regions = useMemo(
    () => [...new Set(artists.map((a) => a.region).filter((r): r is string => Boolean(r)))].sort(),
    [artists],
  );
  // Urutan chip ikut TIER_ORDER, bukan urutan data; tier tanpa artist tidak ditampilkan.
  const tiers = useMemo(() => {
    const present = new Set(artists.map((a) => a.tier));
    return TIER_ORDER.filter((t) => present.has(t));
  }, [artists]);
  const skillIds = useMemo(() => {
    const present = new Set(artists.flatMap((a) => a.skills.map((s) => s.effect)));
    return EFFECTS.filter((e) => present.has(e));
  }, [artists]);

  const q = query.trim().toLowerCase();
  const matches = (a: Artist) =>
    q === "" ||
    a.name.toLowerCase().includes(q) ||
    a.genre.toLowerCase().includes(q) ||
    a.skills.some((s) => EFFECT_LABEL[s.effect].toLowerCase().includes(q));

  const visible = artists.filter(
    (a) =>
      (filter.genre === "Semua" || a.genre === filter.genre) &&
      (filter.region === "Semua" || a.region === filter.region) &&
      (filter.tier === "Semua" || a.tier === filter.tier) &&
      (filter.skill === "Semua" || a.skills.some((s) => s.effect === filter.skill)) &&
      matches(a),
  );

  return (
    <section aria-label="Artists" className="flex min-w-0 flex-col">
      <div className="z-20 -mx-4 flex flex-col gap-1.5 border-b border-white/5 bg-ink/95 px-4 pt-2 pb-2 sm:sticky sm:top-0 sm:-mx-6 sm:px-6 sm:backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput value={query} onChange={setQuery} />
          </div>
          {/* invisible, bukan unmount: lebar search tidak melompat saat filter dipasang/dilepas. */}
          <button
            type="button"
            onClick={() => setFilter({ genre: "Semua", region: "Semua", tier: "Semua", skill: "Semua" })}
            className={`flex min-h-11 shrink-0 cursor-pointer items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 ${
              filtered ? "" : "invisible"
            }`}
          >
            Reset filter
          </button>
        </div>

        {(
          [
            ["Genre", "genre", genres.map((g) => ({ id: g, text: g })), "brand", true],
            ["Region", "region", regions.map((r) => ({ id: r, text: r })), "brand", false],
            ["Tier", "tier", tiers.map((t) => ({ id: t, text: t })), "gold", false],
            [
              "Skill",
              "skill",
              skillIds.map((e) => ({ id: e, text: EFFECT_LABEL[e as Effect] })),
              "brand",
              false,
            ],
          ] as const
        ).map(([label, key, options, tone, genreIcon]) => (
          <FilterRow
            key={key}
            label={label}
            value={filter[key]}
            onChange={set(key)}
            options={options}
            tone={tone}
            genreIcon={genreIcon}
          />
        ))}
      </div>

      {full && (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-zinc-200">
          Tim penuh {TEAM_SIZE}/{TEAM_SIZE} — hapus satu artist untuk memilih yang lain.
          <button type="button" onClick={onOpenTeam} className="cursor-pointer font-semibold text-gold underline-offset-2 hover:underline">
            Atur tim
          </button>
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {visible.length} artist cocok dengan filter.
      </p>

      {tiers
        .map((t) => [t, visible.filter((a) => a.tier === t)] as const)
        .filter(([, list]) => list.length > 0)
        .map(([t, list]) => (
          <section key={t} className="mt-4">
            <h2 className="mb-2 flex items-center gap-2">
              <TierBadge tier={t} />
              <span className="text-xs font-normal text-zinc-400">{list.length} artist</span>
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {list.map((a) => {
                const active = picked.includes(a.slug);
                return (
                  <li key={a.slug}>
                    <button
                      type="button"
                      onClick={() => onToggle(a.slug)}
                      aria-pressed={active}
                      disabled={!active && full}
                      className={`group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-colors duration-200 ${
                        active
                          ? "border-gold/45 bg-gold/10"
                          : "border-white/10 bg-panel/70 hover:border-white/25 hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-60"
                      }`}
                    >
                      <span className="relative block aspect-[3/4] w-full bg-panel-2">
                        {a.photoUrl ? (
                          <Image src={a.photoUrl} alt="" fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover" />
                        ) : (
                          <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/25">
                            {a.name.slice(0, 2).toUpperCase()}
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
                        <span className="mt-1 line-clamp-2 block text-xs text-zinc-400">{skillList(a.skills)}</span>
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
  );
}
