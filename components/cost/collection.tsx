"use client";

import { useMemo, useState } from "react";
import { statDelta, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { t } from "@/lib/i18n";
import { clamp, heading, invalid, NumberField, panel, result, Select, Stats, Totals, type CostDict } from "./fields";
import { MuseumPanel } from "./museum";

const ITEM_MIN = 1;
const ITEM_MAX = 65;

// Rarity config 2/3/4 = R/SR/SSR.
const RARITY = { 2: "R", 3: "SR", 4: "SSR" } as const;

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
      <h2 className={heading}>{C.tabCollection}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Select id="cost-collection-zone" text={C.collectionZone} value={zone} onChange={pickZone}>
          {zones.map((entry) => (
            <option key={entry.zone} value={entry.zone}>
              {`${entry.name} · ${entry.genre}`}
            </option>
          ))}
        </Select>
        <Select id="cost-collection-item" text={C.item} value={item?.id ?? 0} onChange={setItemId}>
          {zoneItems.map((it) => (
            <option key={it.id} value={it.id}>
              {`${RARITY[it.rarity as keyof typeof RARITY]} · ${it.name}`}
            </option>
          ))}
        </Select>
      </div>

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
