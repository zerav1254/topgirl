"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Artist, Effect } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { EFFECTS, EFFECT_LABEL, TIER_ORDER } from "@/lib/score";
import { GenreIcon, ICONS, Icon, SearchInput, TierBadge, formatStat, isPercent } from "./artist-ui";

type Props = {
  artists: Artist[];
  picked: string[];
  locale: Locale;
};

type Filter = { genre: string; origin: string; tier: string; skill: string };
type Option = { id: string; text: string };

// Sentinel filter, bukan teks tampil: label "Semua" datang dari dict.
const ALL = "all";

function FilterRow({
  label,
  value,
  onChange,
  options: base,
  locale,
  tone = "brand",
  genreIcon = false,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: Option[];
  locale: Locale;
  tone?: "gold" | "brand";
  genreIcon?: boolean;
}) {
  const active = tone === "gold" ? "border-gold/50 bg-gold/15 text-gold" : "border-brand/50 bg-brand/15 text-red-300";
  // "Semua" hanya muncul saat baris terfilter, sebagai jalan lepas filter baris itu.
  const options = value === ALL ? base : [{ id: ALL, text: DICT[locale].common.all }, ...base];
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      <div className="relative min-w-0 flex-1">
        <div
          className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label={t(DICT[locale].artists.filterLabel, { label })}
        >
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(value === o.id ? ALL : o.id)}
              aria-pressed={value === o.id}
              className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-sm font-semibold transition-colors duration-200 ${
                value === o.id ? active : "border-white/10 bg-panel/60 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
              }`}
            >
              {genreIcon && <GenreIcon genre={o.id} className="h-4 w-4" />}
              {o.text}
            </button>
          ))}
        </div>
        {/* ponytail: fade tetap ada walau sudah di ujung; sembunyikan lewat scroll listener kalau mengganggu. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-ink to-transparent"
        />
      </div>
    </div>
  );
}

export function ArtistsTab({ artists, picked, locale }: Props) {
  const C = DICT[locale];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>({ genre: ALL, origin: ALL, tier: ALL, skill: ALL });
  const set = (key: keyof Filter) => (id: string) => setFilter((f) => ({ ...f, [key]: id }));
  const filtered = Object.values(filter).some((v) => v !== ALL);

  const genres = useMemo(() => [...new Set(artists.map((a) => a.genre).filter(Boolean))].sort(), [artists]);
  const origins = useMemo(
    () => [...new Set(artists.map((a) => a.origin).filter((r): r is string => Boolean(r)))].sort(),
    [artists],
  );
  // Urutan chip ikut TIER_ORDER, bukan urutan data; tier tanpa artist tidak ditampilkan.
  const tiers = useMemo(() => {
    const present = new Set(artists.map((a) => a.tier));
    return TIER_ORDER.filter((tier) => present.has(tier));
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
    a.skills.some((s) => EFFECT_LABEL[s.effect][locale].toLowerCase().includes(q));

  const visible = artists.filter(
    (a) =>
      (filter.genre === ALL || a.genre === filter.genre) &&
      (filter.origin === ALL || a.origin === filter.origin) &&
      (filter.tier === ALL || a.tier === filter.tier) &&
      (filter.skill === ALL || a.skills.some((s) => s.effect === filter.skill)) &&
      matches(a),
  );

  return (
    <section aria-label={C.artists.section} className="flex min-w-0 flex-col">
      <div className="z-20 -mx-4 flex flex-col gap-1.5 border-b border-white/5 bg-ink/95 px-4 pt-2 pb-2 sm:sticky sm:top-0 sm:-mx-6 sm:px-6 sm:backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput value={query} onChange={setQuery} locale={locale} />
          </div>
          {/* invisible, bukan unmount: lebar search tidak melompat saat filter dipasang/dilepas. */}
          <button
            type="button"
            onClick={() => setFilter({ genre: ALL, origin: ALL, tier: ALL, skill: ALL })}
            className={`flex min-h-11 shrink-0 cursor-pointer items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 ${
              filtered ? "" : "invisible"
            }`}
          >
            {C.artists.resetFilter}
          </button>
        </div>

        {(
          [
            [C.artists.genre, "genre", genres.map((g) => ({ id: g, text: g })), "brand", true],
            [C.artists.origin, "origin", origins.map((r) => ({ id: r, text: r })), "brand", false],
            [C.artists.tier, "tier", tiers.map((t) => ({ id: t, text: t })), "gold", false],
            [
              C.artists.skill,
              "skill",
              skillIds.map((e) => ({ id: e, text: EFFECT_LABEL[e as Effect][locale] })),
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
            locale={locale}
            tone={tone}
            genreIcon={genreIcon}
          />
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {t(C.artists.results, { n: visible.length })}
      </p>

      {tiers
        .map((tier) => [tier, visible.filter((a) => a.tier === tier)] as const)
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
                          <Image src={a.photoUrl} alt="" fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover" />
                        ) : (
                          <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/25">
                            {a.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="absolute top-1.5 left-1.5 rounded-md bg-ink/70 p-0.5 backdrop-blur-sm">
                          <TierBadge tier={a.tier} />
                        </span>
                        {inTeam && (
                          <span className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-md border border-gold/45 bg-ink/80 text-gold">
                            <Icon d={ICONS.check} className="h-4 w-4" />
                          </span>
                        )}
                      </span>
                      <span className="block min-w-0 p-2">
                        <span className="flex items-baseline justify-between gap-1">
                          <span className="block truncate text-sm font-semibold">{a.name}</span>
                          <span className="tabular shrink-0 text-xs font-semibold text-zinc-300">{formatStat(a.score, locale)}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                          <GenreIcon genre={a.genre} className="h-3 w-3 shrink-0" />
                          <span className="truncate">{a.genre}</span>
                        </span>
                        <span className="mt-0.5 flex items-baseline justify-between gap-2 text-xs">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            {C.artists.origin}
                          </span>
                          <span className="truncate text-zinc-300">{a.origin ?? "—"}</span>
                        </span>
                        <span className="mt-1 flex flex-col gap-0.5 border-t border-white/10 pt-1">
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
