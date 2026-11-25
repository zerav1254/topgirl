"use client";

import { useMemo } from "react";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import { poolActive, type Pool } from "@/lib/pool";

const chip = (active: boolean, accent: "gold" | "brand") =>
  `min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
    active
      ? accent === "gold"
        ? "border-gold/50 bg-gold/10 text-gold"
        : "border-brand/50 bg-brand/10 text-zinc-100"
      : "border-white/10 bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
  }`;

// Urutan chip dari tabel origins (kolom sort), bukan alfabet: Tokyo sengaja lebih dulu.
export function PoolPicker({
  artists,
  originOrder,
  pool,
  locale,
  onChange,
}: {
  artists: Artist[];
  originOrder: string[];
  pool: Pool;
  locale: Locale;
  onChange: (next: Pool) => void;
}) {
  const C = DICT[locale];
  const origins = useMemo(() => {
    const present = new Set(artists.map((a) => a.origin).filter((o): o is string => Boolean(o)));
    return originOrder.filter((id) => present.has(id));
  }, [artists, originOrder]);
  // Season hanya dari artis aboard; season server tidak bisa melebihi data yang ada.
  const seasons = useMemo(() => {
    const set = new Set(artists.map((a) => a.season).filter((s): s is number => s !== null));
    return [...set].sort((a, b) => a - b);
  }, [artists]);

  const toggleOrigin = (id: string) =>
    onChange({
      ...pool,
      origins: pool.origins.includes(id) ? pool.origins.filter((o) => o !== id) : [...pool.origins, id],
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <span id="pool-label" className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {C.pool.label}
        </span>
        <div role="group" aria-labelledby="pool-label" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...pool, origins: [] })}
            aria-pressed={pool.origins.length === 0}
            className={chip(pool.origins.length === 0, "gold")}
          >
            {C.common.all}
          </button>
          {origins.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleOrigin(id)}
              aria-pressed={pool.origins.includes(id)}
              className={chip(pool.origins.includes(id), "brand")}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {seasons.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span id="season-label" className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {C.pool.season}
          </span>
          <div role="group" aria-labelledby="season-label" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...pool, season: null })}
              aria-pressed={pool.season === null}
              className={chip(pool.season === null, "gold")}
            >
              {C.common.all}
            </button>
            {seasons.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...pool, season: s })}
                aria-pressed={pool.season === s}
                className={`tabular ${chip(pool.season === s, "brand")}`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400">{pool.season === null ? C.pool.seasonAll : C.pool.seasonHint}</p>
        </div>
      )}

      <p className="text-xs text-zinc-400">{poolActive(pool) ? C.pool.hint : C.pool.hintAll}</p>
    </div>
  );
}
