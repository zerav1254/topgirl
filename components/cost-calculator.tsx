"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { expBetween, modTotals, starBetween, sumLevels } from "@/lib/cost-calc";
import { DICT, numberLocale, type Locale } from "@/lib/i18n";
import type { CarPart, CostBook } from "@/lib/costs";
import { CeoPanel } from "./cost/ceo";
import { CollectionPanel } from "./cost/collection";
import { chip, clamp, field, invalid, label, NumberField, panel, result, Totals } from "./cost/fields";
import { HqPanel } from "./cost/hq";
import { MuseumPanel } from "./cost/museum";
import { VillaPanel } from "./cost/villa";

type Tab = "artist" | "parts" | "mods" | "museum" | "hq" | "villa" | "collection" | "ceo";

const PART_MIN = 1;
const PART_MAX = 60;
const MOD_MIN = 0;
const MOD_MAX = 219;
const ARTIST_MIN = 1;
const ARTIST_MAX = 160;
const STAR_MIN = 0;
const STAR_MAX = 21;

export function CostCalculator({ book, locale }: { book: CostBook; locale: Locale }) {
  const C = DICT[locale].cost;
  const format = (value: number) => value.toLocaleString(numberLocale(locale));

  const [tab, setTab] = useState<Tab>("artist");

  const [artistId, setArtistId] = useState(book.artists[0]?.id ?? 0);
  const [levelFrom, setLevelFrom] = useState(ARTIST_MIN);
  const [levelTo, setLevelTo] = useState(ARTIST_MAX);
  const [starFrom, setStarFrom] = useState(STAR_MIN);
  const [starTo, setStarTo] = useState(STAR_MAX);

  const [partId, setPartId] = useState(book.parts[0]?.id ?? 0);
  const [partFrom, setPartFrom] = useState(PART_MIN);
  const [partTo, setPartTo] = useState(PART_MAX);

  const [modPart, setModPart] = useState(0);
  const [modFrom, setModFrom] = useState(MOD_MIN);
  const [modTo, setModTo] = useState(MOD_MAX);

  const artist = book.artists.find((a) => a.id === artistId) ?? book.artists[0];
  const curve = artist ? (book.curves[artist.curve] ?? []) : [];
  const exp = expBetween(curve, levelFrom, levelTo);
  const starCards = starBetween(book.star.amounts, starFrom, starTo);

  const partTotals = useMemo(
    () => sumLevels(book.costs.carPart[partId] ?? [], partFrom, partTo),
    [book.costs.carPart, partId, partFrom, partTo],
  );

  const modTotalsResult = useMemo(
    () =>
      modTotals({
        items: book.costs.carMod[modPart] ?? [],
        classCosts: book.costs.carModClass,
        classByLevel: book.classByLevel,
        from: modFrom,
        to: modTo,
      }),
    [book.classByLevel, book.costs.carMod, book.costs.carModClass, modPart, modFrom, modTo],
  );

  const targetClass = book.classes.find((c) => c.id === book.classByLevel[modTo]);
  const partGroups = (["steering", "chip", "sound"] as const).map((slot) => ({
    slot,
    label: slot === "steering" ? C.slotSteering : slot === "chip" ? C.slotChip : C.slotSound,
    parts: book.parts.filter((p) => p.slot === slot),
  }));
  const modLabels = [C.partEngine, C.partChassis, C.partSuspension, C.partWheels];

  const tabs: { id: Tab; label: string }[] = [
    { id: "artist", label: C.tabArtist },
    { id: "parts", label: C.tabParts },
    { id: "mods", label: C.tabMods },
    { id: "museum", label: C.tabMuseum },
    { id: "hq", label: C.tabHq },
    { id: "villa", label: C.tabVilla },
    { id: "collection", label: C.tabCollection },
    { id: "ceo", label: C.tabCeo },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={C.title} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={chip(tab === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "artist" ? (
        <section aria-label={C.tabArtist} className={panel}>
          <div className="flex flex-col gap-1">
            <label htmlFor="cost-artist" className={label}>
              {C.artist}
            </label>
            <select id="cost-artist" value={artistId} onChange={(e) => setArtistId(Number(e.target.value))} className={field}>
              {book.artists.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-level-from" text={C.levelFrom} value={levelFrom} min={ARTIST_MIN} max={ARTIST_MAX} invalid={levelTo <= levelFrom} describedBy="cost-artist-error" onChange={(v) => setLevelFrom(clamp(v, ARTIST_MIN, ARTIST_MAX))} />
            <NumberField id="cost-level-to" text={C.levelTo} value={levelTo} min={ARTIST_MIN} max={ARTIST_MAX} invalid={levelTo <= levelFrom} describedBy="cost-artist-error" onChange={(v) => setLevelTo(clamp(v, ARTIST_MIN, ARTIST_MAX))} />
            <NumberField id="cost-star-from" text={C.starFrom} value={starFrom} min={STAR_MIN} max={STAR_MAX} invalid={starTo <= starFrom} describedBy="cost-artist-error" onChange={(v) => setStarFrom(clamp(v, STAR_MIN, STAR_MAX))} />
            <NumberField id="cost-star-to" text={C.starTo} value={starTo} min={STAR_MIN} max={STAR_MAX} invalid={starTo <= starFrom} describedBy="cost-artist-error" onChange={(v) => setStarTo(clamp(v, STAR_MIN, STAR_MAX))} />
          </div>

          {levelTo <= levelFrom || starTo <= starFrom ? (
            <p id="cost-artist-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">{C.exp}</p>
              <p className="tabular text-2xl font-bold text-gold">{format(exp)}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">{C.starCards}</p>
                <p className="tabular text-2xl font-bold text-zinc-100">{format(starCards)}</p>
                <p className="mt-1 text-xs text-zinc-400">{book.star.itemName}</p>
              </div>
              <Image
                src="/assets/images/upgrades/UI_Item_Props_UpStar_Orange.webp"
                alt=""
                width={56}
                height={56}
                sizes="56px"
                className="h-14 w-14 shrink-0 object-contain"
              />
            </div>
          </div>
        </section>
      ) : tab === "parts" ? (
        <section aria-label={C.tabParts} className={panel}>
          <div className="flex flex-col gap-1">
            <label htmlFor="cost-part" className={label}>
              {C.part}
            </label>
            <select id="cost-part" value={partId} onChange={(e) => setPartId(Number(e.target.value))} className={field}>
              {partGroups.map((group) => (
                <optgroup key={group.slot} label={group.label}>
                  {group.parts.map((part: CarPart) => (
                    <option key={part.id} value={part.id}>
                      {part.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-part-from" text={C.levelFrom} value={partFrom} min={PART_MIN} max={PART_MAX} invalid={partTo <= partFrom} describedBy="cost-part-error" onChange={(v) => setPartFrom(clamp(v, PART_MIN, PART_MAX))} />
            <NumberField id="cost-part-to" text={C.levelTo} value={partTo} min={PART_MIN} max={PART_MAX} invalid={partTo <= partFrom} describedBy="cost-part-error" onChange={(v) => setPartTo(clamp(v, PART_MIN, PART_MAX))} />
          </div>

          {partTo <= partFrom ? (
            <p id="cost-part-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          <div className={result}>
            <Totals totals={partTotals} note={C.partNote} empty={C.noCost} format={format} />
          </div>
        </section>
      ) : tab === "mods" ? (
        <section aria-label={C.tabMods} className={panel}>
          <div className="flex flex-col gap-1">
            <label htmlFor="cost-mod" className={label}>
              {C.modPart}
            </label>
            <select id="cost-mod" value={modPart} onChange={(e) => setModPart(Number(e.target.value))} className={field}>
              {modLabels.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-mod-from" text={C.levelFrom} value={modFrom} min={MOD_MIN} max={MOD_MAX} invalid={modTo <= modFrom} describedBy="cost-mod-error" onChange={(v) => setModFrom(clamp(v, MOD_MIN, MOD_MAX))} />
            <NumberField id="cost-mod-to" text={C.levelTo} value={modTo} min={MOD_MIN} max={MOD_MAX} invalid={modTo <= modFrom} describedBy="cost-mod-error" onChange={(v) => setModTo(clamp(v, MOD_MIN, MOD_MAX))} />
          </div>

          {modTo <= modFrom ? (
            <p id="cost-mod-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          {targetClass ? (
            <p className="mt-3 text-xs text-zinc-400">
              {C.targetClass}: <span className="font-semibold text-zinc-200">{targetClass.name}</span>
            </p>
          ) : null}

          <div className={result}>
            <Totals totals={modTotalsResult} note={C.modNote} empty={C.noCost} format={format} />
          </div>
        </section>
      ) : tab === "museum" ? (
        <MuseumPanel tiers={book.museum} C={C} format={format} />
      ) : tab === "hq" ? (
        <HqPanel hq={book.hq} C={C} format={format} />
      ) : tab === "villa" ? (
        <VillaPanel villa={book.villa} C={C} format={format} />
      ) : tab === "collection" ? (
        <CollectionPanel collection={book.collection} C={C} format={format} />
      ) : (
        <CeoPanel ceo={book.ceo} C={C} format={format} />
      )}

      <p className="text-xs text-zinc-400">{C.hint}</p>
    </div>
  );
}
