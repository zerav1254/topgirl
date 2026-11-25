"use client";

import { useMemo } from "react";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import type { Pool } from "@/lib/pool";

const chip = (active: boolean) =>
  `tabular min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
    active
      ? "border-gold/50 bg-gold/10 text-gold"
      : "border-white/10 bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
  }`;

// Pool = season server. Season di atasnya tidak bisa diperoleh, jadi tidak masuk peringkat.
export function PoolPicker({
  artists,
  pool,
  locale,
  onChange,
}: {
  artists: Artist[];
  pool: Pool;
  locale: Locale;
  onChange: (next: Pool) => void;
}) {
  const C = DICT[locale];
  // Season hanya dari artis aboard; season server tidak bisa melebihi data yang ada.
  const seasons = useMemo(() => {
    const set = new Set(artists.map((a) => a.season).filter((s): s is number => s !== null));
    return [...set].sort((a, b) => a - b);
  }, [artists]);

  return (
    <div className="flex flex-col gap-1.5">
      <span id="season-label" className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {C.pool.season}
      </span>
      <div role="group" aria-labelledby="season-label" className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange({ season: null })} aria-pressed={pool.season === null} className={chip(pool.season === null)}>
          {C.common.all}
        </button>
        {seasons.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ season: s })}
            aria-pressed={pool.season === s}
            className={chip(pool.season === s)}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-400">{pool.season === null ? C.pool.seasonAll : C.pool.seasonHint}</p>
    </div>
  );
}
