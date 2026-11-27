"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { COLLECTION_PLATFORMS, collectionPlatformIcon } from "@/lib/cost-icons";
import { clamp, invalid, label, NumberField, panel, result, Totals, type CostDict } from "./fields";

const PLATFORM_MIN = 1;
const PLATFORM_MAX = 50;

// ponytail: mode bintang disembunyikan (belum jelas di game). Data
// collection.stars tetap ada di CostBook; tambah mode lagi kalau fitur rilis.
export function CollectionPanel({
  collection,
  C,
  format,
}: {
  collection: CostBook["collection"];
  C: CostDict;
  format: (value: number) => string;
}) {
  const [slot, setSlot] = useState(1);
  const [platformFrom, setPlatformFrom] = useState(PLATFORM_MIN);
  const [platformTo, setPlatformTo] = useState(PLATFORM_MAX);

  // Slot 8-9 ada di config tapi belum rilis; tampilkan 7 platform pertama saja.
  const slots = Object.keys(collection.platforms)
    .map(Number)
    .filter((index) => index < COLLECTION_PLATFORMS);
  const platformBad = platformTo <= platformFrom;
  const platformName = `${C.platform} ${slot}`;

  const platformTotals = useMemo(
    () => sumLevels(collection.platforms[slot - 1] ?? [], platformFrom, platformTo),
    [collection.platforms, slot, platformFrom, platformTo],
  );

  return (
    <section aria-label={C.tabCollection} className={panel}>
      <div role="group" aria-label={C.platform}>
        <p className={label}>{C.platform}</p>
        <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {slots.map((index) => {
            const active = index + 1 === slot;
            const name = `${C.platform} ${index + 1}`;
            return (
              <button
                key={index}
                type="button"
                aria-pressed={active}
                aria-label={name}
                title={name}
                onClick={() => setSlot(index + 1)}
                className={`flex min-h-11 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition-colors duration-200 ${
                  active ? "border-gold/50 bg-gold/10" : "border-white/10 bg-panel/80 hover:border-white/25"
                }`}
              >
                <Image
                  src={collectionPlatformIcon(index)}
                  alt=""
                  width={48}
                  height={48}
                  sizes="48px"
                  className="h-12 w-12 object-contain"
                />
                <span className={`text-[10px] font-semibold ${active ? "text-gold" : "text-zinc-400"}`}>
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-collection-from" text={C.levelFrom} value={platformFrom} min={PLATFORM_MIN} max={PLATFORM_MAX} invalid={platformBad} describedBy={platformBad ? "cost-collection-error" : undefined} onChange={(v) => setPlatformFrom(clamp(v, PLATFORM_MIN, PLATFORM_MAX))} />
        <NumberField id="cost-collection-to" text={C.levelTo} value={platformTo} min={PLATFORM_MIN} max={PLATFORM_MAX} invalid={platformBad} describedBy={platformBad ? "cost-collection-error" : undefined} onChange={(v) => setPlatformTo(clamp(v, PLATFORM_MIN, PLATFORM_MAX))} />
      </div>

      {platformBad ? (
        <p id="cost-collection-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {platformBad ? null : (
        <div className={result}>
          <Totals
            totals={platformTotals}
            note={`${platformName} · ${C.collectionNote}`}
            empty={C.noCost}
            format={format}
          />
        </div>
      )}
    </section>
  );
}
