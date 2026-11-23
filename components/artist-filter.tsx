"use client";

import { useMemo, useState } from "react";
import type { Artist, Category } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import { CATEGORIES, EFFECTS, EFFECT_LABEL, type Effect } from "@/lib/score";
import { SearchInput } from "./artist-ui";

// Sentinel filter, bukan teks tampil: label "Semua" datang dari dict.
const ALL = "all";

export type ArtistFilter = { genre: string; origin: string; specialty: string; skill: string };
const EMPTY: ArtistFilter = { genre: ALL, origin: ALL, specialty: ALL, skill: ALL };

export const isCategory = (value: string): value is Category => (CATEGORIES as readonly string[]).includes(value);

// Spesialis = kategori dengan skor tertinggi; seri dimenangkan urutan CATEGORIES (solo dulu).
export function specialtyOf(a: Artist): Category {
  return CATEGORIES.reduce((best, c) => (a.scores[c] > a.scores[best] ? c : best), CATEGORIES[0]);
}

export function useArtistFilter(artists: Artist[], locale: Locale) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ArtistFilter>(EMPTY);
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      artists.filter(
        (a) =>
          (filter.genre === ALL || a.genre === filter.genre) &&
          (filter.origin === ALL || a.origin === filter.origin) &&
          (filter.specialty === ALL || specialtyOf(a) === filter.specialty) &&
          (filter.skill === ALL || a.skills.some((s) => s.effect === filter.skill)) &&
          (q === "" ||
            a.name.toLowerCase().includes(q) ||
            a.genre.toLowerCase().includes(q) ||
            a.skills.some((s) => EFFECT_LABEL[s.effect][locale].toLowerCase().includes(q))),
      ),
    [artists, filter, q, locale],
  );
  return {
    query,
    setQuery,
    filter,
    setFilter,
    visible,
    active: Object.values(filter).some((v) => v !== ALL),
    reset: () => setFilter(EMPTY),
  };
}

export type ArtistFilterState = ReturnType<typeof useArtistFilter>;

function Select({
  label,
  value,
  onChange,
  options,
  locale,
  tone = "brand",
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: { id: string; text: string }[];
  locale: Locale;
  tone?: "gold" | "brand";
}) {
  const active = tone === "gold" ? "border-gold/50 bg-gold/10 text-gold" : "border-brand/50 bg-brand/10 text-zinc-100";
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full cursor-pointer rounded-lg border bg-panel/80 px-2.5 text-base font-semibold transition-colors duration-200 focus:border-brand/60 ${
          value === ALL ? "border-white/10 text-zinc-300" : active
        }`}
      >
        <option value={ALL}>{DICT[locale].common.all}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ArtistFilterBar({
  artists,
  locale,
  state,
  bare = false,
}: {
  artists: Artist[];
  locale: Locale;
  state: ArtistFilterState;
  bare?: boolean;
}) {
  const C = DICT[locale];
  const set = (key: keyof ArtistFilter) => (id: string) => state.setFilter((f) => ({ ...f, [key]: id }));

  const genres = useMemo(() => [...new Set(artists.map((a) => a.genre).filter(Boolean))].sort(), [artists]);
  const origins = useMemo(
    () => [...new Set(artists.map((a) => a.origin).filter((r): r is string => Boolean(r)))].sort(),
    [artists],
  );
  const skills = useMemo(() => {
    const present = new Set(artists.flatMap((a) => a.skills.map((s) => s.effect)));
    return EFFECTS.filter((e) => present.has(e));
  }, [artists]);

  return (
    <div
      className={
        bare
          ? "flex flex-col gap-1.5"
          : "z-20 -mx-4 flex flex-col gap-1.5 border-b border-white/5 bg-ink/95 px-4 pt-2 pb-2 sm:-mx-6 sm:px-6"
      }
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput value={state.query} onChange={state.setQuery} locale={locale} />
        </div>
        {/* invisible, bukan unmount: lebar search tidak melompat saat filter dipasang/dilepas. */}
        <button
          type="button"
          onClick={state.reset}
          className={`flex min-h-11 shrink-0 cursor-pointer items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 ${
            state.active ? "" : "invisible"
          }`}
        >
          {C.artists.resetFilter}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          label={C.artists.genre}
          value={state.filter.genre}
          onChange={set("genre")}
          options={genres.map((g) => ({ id: g, text: g }))}
          locale={locale}
        />
        <Select
          label={C.artists.origin}
          value={state.filter.origin}
          onChange={set("origin")}
          options={origins.map((r) => ({ id: r, text: r }))}
          locale={locale}
        />
        <Select
          label={C.artists.specialty}
          value={state.filter.specialty}
          onChange={set("specialty")}
          options={CATEGORIES.map((c) => ({ id: c, text: C.categories[c] }))}
          locale={locale}
          tone="gold"
        />
        <Select
          label={C.artists.skill}
          value={state.filter.skill}
          onChange={set("skill")}
          options={skills.map((e) => ({ id: e, text: EFFECT_LABEL[e as Effect][locale] }))}
          locale={locale}
        />
      </div>
    </div>
  );
}
