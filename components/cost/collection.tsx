"use client";

import { useMemo, useState } from "react";
import { sumLevels } from "@/lib/cost-calc";
import type { CostBook, CostItem } from "@/lib/costs";
import { clamp, NumberField, Segmented, Select, Totals, type CostDict } from "./fields";

type Mode = "platform" | "star";

const PLATFORM_MIN = 1;
const PLATFORM_MAX = 50;
const EMPTY: CostItem[] = [];

export function CollectionPanel({
  collection,
  C,
  format,
}: {
  collection: CostBook["collection"];
  C: CostDict;
  format: (value: number) => string;
}) {
  const [mode, setMode] = useState<Mode>("platform");
  const [slot, setSlot] = useState(1);
  const [platformFrom, setPlatformFrom] = useState(PLATFORM_MIN);
  const [platformTo, setPlatformTo] = useState(PLATFORM_MAX);
  const [quality, setQuality] = useState(1);
  const [starFrom, setStarFrom] = useState(0);
  const [starTo, setStarTo] = useState(1);

  const slots = Object.keys(collection.platforms).map(Number);
  const qualities = Object.keys(collection.stars).map(Number);
  const starItems = collection.stars[quality] ?? EMPTY;
  const starMax = Math.max(...starItems.map((item) => Object.keys(item.amounts).length), 1);

  const platformTotals = useMemo(
    () => sumLevels(collection.platforms[slot - 1] ?? [], platformFrom, platformTo),
    [collection.platforms, slot, platformFrom, platformTo],
  );
  const starTotals = useMemo(() => sumLevels(starItems, starFrom, starTo), [starItems, starFrom, starTo]);

  return (
    <section aria-label={C.tabCollection} className="rounded-2xl border border-white/10 bg-panel/70 p-4 sm:p-5">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { id: "platform", label: C.collectionPlatform },
          { id: "star", label: C.collectionStar },
        ]}
      />

      {mode === "platform" ? (
        <>
          <Select id="cost-collection-slot" text={C.platform} value={slot} onChange={setSlot}>
            {slots.map((value) => (
              <option key={value} value={value + 1}>
                {C.platform} {value + 1}
              </option>
            ))}
          </Select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-collection-from" text={C.levelFrom} value={platformFrom} min={PLATFORM_MIN} max={PLATFORM_MAX} onChange={(v) => setPlatformFrom(clamp(v, PLATFORM_MIN, PLATFORM_MAX))} />
            <NumberField id="cost-collection-to" text={C.levelTo} value={platformTo} min={PLATFORM_MIN} max={PLATFORM_MAX} onChange={(v) => setPlatformTo(clamp(v, PLATFORM_MIN, PLATFORM_MAX))} />
          </div>

          {platformTo <= platformFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals totals={platformTotals} note={C.collectionNote} empty={C.noCost} format={format} />
          </div>
        </>
      ) : (
        <>
          <Select id="cost-collection-quality" text={C.quality} value={quality} onChange={setQuality}>
            {qualities.map((value) => (
              <option key={value} value={value}>
                {collection.stars[value]?.[0]?.itemName ?? `${C.quality} ${value}`}
              </option>
            ))}
          </Select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-collection-star-from" text={C.starFrom} value={starFrom} min={0} max={starMax} onChange={(v) => setStarFrom(clamp(v, 0, starMax))} />
            <NumberField id="cost-collection-star-to" text={C.starTo} value={starTo} min={0} max={starMax} onChange={(v) => setStarTo(clamp(v, 0, starMax))} />
          </div>

          {starTo <= starFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals totals={starTotals} note={C.collectionStarNote} empty={C.noCost} format={format} />
          </div>
        </>
      )}
    </section>
  );
}
