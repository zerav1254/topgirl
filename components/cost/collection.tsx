"use client";

import { useMemo, useState } from "react";
import { statDelta, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { t } from "@/lib/i18n";
import { clamp, heading, invalid, NumberField, panel, result, Stats, Totals, type CostDict } from "./fields";
import { MuseumPanel } from "./museum";

const ITEM_MIN = 1;
const ITEM_MAX = 65;

// Rarity config 2/3/4 = R/SR/SSR.
const RARITY = { 2: "R", 3: "SR", 4: "SSR" } as const;
const RARITY_STYLE = {
  2: "border-zinc-400/40 text-zinc-300",
  3: "border-sky-400/40 text-sky-300",
  4: "border-gold/50 text-gold",
} as const;

export function CollectionPanel({
  collection,
  collectionStats,
  museum,
  museumStats,
  C,
  format,
  formatPct,
}: {
  collection: CostBook["collection"];
  collectionStats: CostBook["collectionStats"];
  museum: CostBook["museum"];
  museumStats: CostBook["museumStats"];
  C: CostDict;
  format: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  return (
    <section aria-label={C.tabCollection} className="flex flex-col gap-4">
      <CollectionRoom collection={collection} collectionStats={collectionStats} C={C} format={format} />
      <MuseumPanel tiers={museum} stats={museumStats} C={C} format={format} formatPct={formatPct} />
    </section>
  );
}

function CollectionRoom({
  collection,
  collectionStats,
  C,
  format,
}: {
  collection: CostBook["collection"];
  collectionStats: CostBook["collectionStats"];
  C: CostDict;
  format: (value: number) => string;
}) {
  const zones = collection.zones;
  const [zone, setZone] = useState(zones[0]?.zone ?? 1);
  const zoneItems = useMemo(() => collection.items.filter((item) => item.zone === zone), [collection.items, zone]);
  const [itemId, setItemId] = useState(zoneItems[0]?.id ?? 0);
  const [itemFrom, setItemFrom] = useState(ITEM_MIN);
  const [itemTo, setItemTo] = useState(ITEM_MAX);

  const item = zoneItems.find((it) => it.id === itemId) ?? zoneItems[0];
  const itemBad = itemTo <= itemFrom;
  const itemLabel = item ? `${item.name} · ${RARITY[item.rarity as keyof typeof RARITY]}` : "";

  const itemTotals = useMemo(
    () => sumLevels(item ? [item.cost] : [], itemFrom, itemTo),
    [item, itemFrom, itemTo],
  );

  // Stat flat item = total kumulatif per level -> pakai selisih target - awal.
  const stats = useMemo(() => {
    const rows = item ? collectionStats.filter((row) => row.itemId === item.id) : [];
    return statDelta(rows, itemFrom, itemTo);
  }, [collectionStats, item, itemFrom, itemTo]);
  const zoneGenre = zones.find((entry) => entry.zone === zone)?.genre ?? "";
  const statRows = [
    { label: `${C.statSing} (${zoneGenre})`, value: stats.sing },
    { label: `${C.statDance} (${zoneGenre})`, value: stats.dance },
    { label: `${C.statManage} (${zoneGenre})`, value: stats.management },
  ]
    .filter((row) => row.value > 0)
    .map((row) => ({ label: row.label, value: `+${format(row.value)}` }));

  const pickZone = (next: number) => {
    setZone(next);
    const first = collection.items.find((entry) => entry.zone === next);
    if (first) setItemId(first.id);
  };

  return (
    <div className={panel}>
      <div role="group" aria-label={C.tabCollection}>
        <h2 className={heading}>{C.tabCollection}</h2>
        <div className="mt-1 flex flex-col gap-2">
          {zones.map((entry) => {
            const active = entry.zone === zone;
            return (
              <button
                key={entry.zone}
                type="button"
                aria-pressed={active}
                aria-label={entry.name}
                title={entry.name}
                onClick={() => pickZone(entry.zone)}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors duration-200 ${
                  active ? "border-gold/50 bg-gold/10" : "border-line bg-panel/80 hover:border-white/25"
                }`}
              >
                <span className={`text-sm font-semibold ${active ? "text-gold" : "text-zinc-200"}`}>{entry.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {zoneItems.map((it) => {
          const active = it.id === item?.id;
          const rarity = it.rarity as keyof typeof RARITY;
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={active}
              aria-label={`${it.name} (${RARITY[rarity]})`}
              title={it.name}
              onClick={() => setItemId(it.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center transition-colors duration-200 ${
                active ? "border-gold/50 bg-gold/10" : "border-line bg-panel/80 hover:border-white/25"
              }`}
            >
              <span className={`rounded border px-1 text-2xs font-semibold ${RARITY_STYLE[rarity]}`}>
                {RARITY[rarity]}
              </span>
              <span className="line-clamp-2 text-2xs font-medium leading-tight text-zinc-300">{it.name}</span>
            </button>
          );
        })}
      </div>
      {item ? <p className="mt-2 text-sm font-semibold text-zinc-200">{itemLabel}</p> : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-collection-item-from" text={C.levelFrom} value={itemFrom} min={ITEM_MIN} max={ITEM_MAX} invalid={itemBad} describedBy={itemBad ? "cost-collection-item-error" : undefined} onChange={(v) => setItemFrom(clamp(v, ITEM_MIN, ITEM_MAX))} />
        <NumberField id="cost-collection-item-to" text={C.levelTo} value={itemTo} min={ITEM_MIN} max={ITEM_MAX} invalid={itemBad} describedBy={itemBad ? "cost-collection-item-error" : undefined} onChange={(v) => setItemTo(clamp(v, ITEM_MIN, ITEM_MAX))} />
      </div>

      {itemBad ? (
        <p id="cost-collection-item-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {itemBad ? null : (
        <div className={result}>
          <Totals totals={itemTotals} note={`${itemLabel} · ${C.collectionItemNote}`} empty={C.noCost} format={format} />
          <Stats title={C.statsTitle} rows={statRows} note={t(C.collectionStatNote, { genre: zoneGenre })} />
        </div>
      )}
    </div>
  );
}
