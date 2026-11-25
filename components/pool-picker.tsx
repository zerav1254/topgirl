"use client";

import { useMemo } from "react";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";

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
  pool: string[];
  locale: Locale;
  onChange: (next: string[]) => void;
}) {
  const C = DICT[locale];
  const origins = useMemo(() => {
    const present = new Set(artists.map((a) => a.origin).filter((o): o is string => Boolean(o)));
    return originOrder.filter((id) => present.has(id));
  }, [artists, originOrder]);

  const toggle = (id: string) => onChange(pool.includes(id) ? pool.filter((o) => o !== id) : [...pool, id]);

  return (
    <div className="flex flex-col gap-1.5">
      <span id="pool-label" className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {C.pool.label}
      </span>
      <div role="group" aria-labelledby="pool-label" className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange([])}
          aria-pressed={pool.length === 0}
          className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
            pool.length === 0
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-white/10 bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
          }`}
        >
          {C.common.all}
        </button>
        {origins.map((id) => {
          const active = pool.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              aria-pressed={active}
              className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
                active
                  ? "border-brand/50 bg-brand/10 text-zinc-100"
                  : "border-white/10 bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
              }`}
            >
              {id}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-400">{pool.length === 0 ? C.pool.hintAll : C.pool.hint}</p>
    </div>
  );
}
