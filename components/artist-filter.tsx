"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { EFFECTS, EFFECT_LABEL, type Effect } from "@/lib/score";
import { ICONS, Icon, SearchInput } from "./artist-ui";

// Sentinel filter, bukan teks tampil: label "Semua" datang dari dict.
const ALL = "all";

export type ArtistFilter = { genre: string; origin: string; skill: string; scope: string };
const EMPTY: ArtistFilter = { genre: ALL, origin: ALL, skill: ALL, scope: ALL };
const OWNED = "owned";
const MISSING = "missing";

// Store filter di level modul: tetap hidup saat pindah rute /{locale} <-> /{locale}/team
// (client navigation tidak me-reset modul), kembali kosong saat reload penuh.
type FilterState = { query: string; filter: ArtistFilter };
const INITIAL: FilterState = { query: "", filter: EMPTY };
let current = INITIAL;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const getSnapshot = () => current;
const getServerSnapshot = () => INITIAL;
function setState(next: FilterState) {
  current = next;
  emit();
}

export function useArtistFilter(artists: Artist[], locale: Locale, owned?: Set<string>) {
  const { query, filter } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      artists.filter(
        (a) =>
          (filter.genre === ALL || a.genre === filter.genre) &&
          (filter.origin === ALL || a.origin === filter.origin) &&
          (filter.skill === ALL || a.skills.some((s) => s.effect === filter.skill)) &&
          (!owned ||
            filter.scope === ALL ||
            (filter.scope === OWNED ? owned.has(a.slug) : !owned.has(a.slug))) &&
          (q === "" ||
            a.name.toLowerCase().includes(q) ||
            a.genre.toLowerCase().includes(q) ||
            a.skills.some((s) => EFFECT_LABEL[s.effect][locale].toLowerCase().includes(q))),
      ),
    [artists, filter, q, locale, owned],
  );
  const setQuery = (value: string) => setState({ ...current, query: value });
  const setFilter = (next: ArtistFilter | ((f: ArtistFilter) => ArtistFilter)) =>
    setState({ ...current, filter: typeof next === "function" ? next(current.filter) : next });
  return {
    query,
    setQuery,
    filter,
    setFilter,
    visible,
    active: query !== "" || Object.values(filter).some((v) => v !== ALL),
    reset: () => setState(INITIAL),
  };
}

export type ArtistFilterState = ReturnType<typeof useArtistFilter>;

function Select({
  label,
  value,
  onChange,
  options,
  locale,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: { id: string; text: string }[];
  locale: Locale;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full cursor-pointer rounded-lg border bg-panel/80 px-2.5 text-base font-semibold transition-colors duration-200 focus:border-brand/60 ${
          value === ALL ? "border-line text-zinc-300" : "border-brand/50 bg-brand/10 text-zinc-100"
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
  ownedTotal,
  ownedCount = 0,
}: {
  artists: Artist[];
  locale: Locale;
  state: ArtistFilterState;
  bare?: boolean;
  // undefined = belum login: chip koleksi disembunyikan.
  ownedTotal?: number;
  ownedCount?: number;
}) {
  const C = DICT[locale];
  const [open, setOpen] = useState(false);
  const set = (key: keyof ArtistFilter) => (id: string) => state.setFilter((f) => ({ ...f, [key]: id }));
  const activeCount = Object.values(state.filter).filter((v) => v !== ALL).length;

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
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput value={state.query} onChange={state.setQuery} locale={locale} />
        </div>
        {/* invisible, bukan unmount: lebar search tidak melompat saat filter dipasang/dilepas. */}
        <button
          type="button"
          onClick={state.reset}
          aria-label={C.artists.resetFilter}
          title={C.artists.resetFilter}
          className={`flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-panel/80 px-2 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 sm:px-3 ${
            state.active ? "" : "invisible"
          }`}
        >
          <Icon d={ICONS.close} className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">{C.artists.resetFilter}</span>
        </button>
        {!bare && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="artist-filter-panel"
            className="flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 sm:hidden"
          >
            <Icon d={ICONS.sliders} className="h-4 w-4 shrink-0" />
            {C.artists.filters}
            {activeCount > 0 && <span className="tabular text-gold"> {activeCount}</span>}
          </button>
        )}
      </div>

      <div id="artist-filter-panel" className={`flex flex-col gap-1.5 ${bare || open ? "" : "hidden sm:flex"}`}>
        {ownedTotal !== undefined && (
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              [ALL, C.common.all],
              [OWNED, C.collection.owned],
              [MISSING, C.collection.missing],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => set("scope")(id)}
                aria-pressed={state.filter.scope === id}
                className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
                  state.filter.scope === id
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-line bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
                }`}
              >
                {label}
              </button>
            ))}
            <span className="tabular text-xs text-zinc-400">{t(C.collection.count, { n: ownedCount, total: ownedTotal })}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            label={C.artists.skill}
            value={state.filter.skill}
            onChange={set("skill")}
            options={skills.map((e) => ({ id: e, text: EFFECT_LABEL[e as Effect][locale] }))}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
