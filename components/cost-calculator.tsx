"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { expBetween, modTotals, starBetween, sumLevels } from "@/lib/cost-calc";
import { DICT, numberLocale, type Locale } from "@/lib/i18n";
import type { CarPart, CostBook } from "@/lib/costs";

type Tab = "artist" | "parts" | "mods";
type Total = { name: string; amount: number };

const PART_MIN = 1;
const PART_MAX = 60;
const MOD_MIN = 0;
const MOD_MAX = 219;
const ARTIST_MIN = 1;
const ARTIST_MAX = 160;
const STAR_MIN = 0;
const STAR_MAX = 21;

const clamp = (value: string, min: number, max: number) => Math.max(min, Math.min(max, Number(value) || min));

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

  const tabButton = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={tab === id}
      onClick={() => setTab(id)}
      className={`min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 ${
        tab === id
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-white/10 bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
      }`}
    >
      {label}
    </button>
  );

  const field = "h-11 w-full rounded-lg border border-white/10 bg-panel/80 px-2.5 text-base font-semibold tabular text-zinc-100";
  const label = "text-[11px] font-semibold uppercase tracking-wide text-zinc-400";

  const numberField = (
    id: string,
    text: string,
    value: number,
    min: number,
    max: number,
    onChange: (value: string) => void,
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={label}>
        {text}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      />
    </div>
  );

  const totalsList = (totals: Total[], note?: string) => (
    <>
      {totals.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {totals.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 break-words text-zinc-300">{item.name}</span>
              <span className="tabular shrink-0 font-bold text-gold">{format(item.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400">{C.noCost}</p>
      )}
      {note ? <p className="mt-3 text-xs text-zinc-400">{note}</p> : null}
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={C.title} className="grid grid-cols-3 gap-2">
        {tabButton("artist", C.tabArtist)}
        {tabButton("parts", C.tabParts)}
        {tabButton("mods", C.tabMods)}
      </div>

      {tab === "artist" ? (
        <section aria-label={C.tabArtist} className="rounded-2xl border border-white/10 bg-panel/70 p-4 sm:p-5">
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
            {numberField("cost-level-from", C.levelFrom, levelFrom, ARTIST_MIN, ARTIST_MAX, (v) =>
              setLevelFrom(clamp(v, ARTIST_MIN, ARTIST_MAX)),
            )}
            {numberField("cost-level-to", C.levelTo, levelTo, ARTIST_MIN, ARTIST_MAX, (v) =>
              setLevelTo(clamp(v, ARTIST_MIN, ARTIST_MAX)),
            )}
            {numberField("cost-star-from", C.starFrom, starFrom, STAR_MIN, STAR_MAX, (v) =>
              setStarFrom(clamp(v, STAR_MIN, STAR_MAX)),
            )}
            {numberField("cost-star-to", C.starTo, starTo, STAR_MIN, STAR_MAX, (v) =>
              setStarTo(clamp(v, STAR_MIN, STAR_MAX)),
            )}
          </div>

          {levelTo <= levelFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}
          {starTo <= starFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

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
        <section aria-label={C.tabParts} className="rounded-2xl border border-white/10 bg-panel/70 p-4 sm:p-5">
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
            {numberField("cost-part-from", C.levelFrom, partFrom, PART_MIN, PART_MAX, (v) =>
              setPartFrom(clamp(v, PART_MIN, PART_MAX)),
            )}
            {numberField("cost-part-to", C.levelTo, partTo, PART_MIN, PART_MAX, (v) =>
              setPartTo(clamp(v, PART_MIN, PART_MAX)),
            )}
          </div>

          {partTo <= partFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">{totalsList(partTotals, C.partNote)}</div>
        </section>
      ) : (
        <section aria-label={C.tabMods} className="rounded-2xl border border-white/10 bg-panel/70 p-4 sm:p-5">
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
            {numberField("cost-mod-from", C.levelFrom, modFrom, MOD_MIN, MOD_MAX, (v) =>
              setModFrom(clamp(v, MOD_MIN, MOD_MAX)),
            )}
            {numberField("cost-mod-to", C.levelTo, modTo, MOD_MIN, MOD_MAX, (v) =>
              setModTo(clamp(v, MOD_MIN, MOD_MAX)),
            )}
          </div>

          {modTo <= modFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          {targetClass ? (
            <p className="mt-3 text-xs text-zinc-400">
              {C.targetClass}: <span className="font-semibold text-zinc-200">{targetClass.name}</span>
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">{totalsList(modTotalsResult, C.modNote)}</div>
        </section>
      )}

      <p className="text-xs text-zinc-400">{C.hint}</p>
    </div>
  );
}
