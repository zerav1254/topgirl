"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { expBetween, classLevels, modTotals, starCardsForLevels, statDelta } from "@/lib/cost-calc";
import { tabIcon } from "@/lib/cost-icons";
import { DICT, numberLocale, type Locale } from "@/lib/i18n";
import type { CarClass, CostBook } from "@/lib/costs";
import { CarPartsPanel } from "./cost/car-parts";
import { CeoPanel } from "./cost/ceo";
import { CollectionPanel } from "./cost/collection";
import { chip, clamp, field, heading, invalid, label, NumberField, panel, result, Select, Stats, Totals } from "./cost/fields";
import { HqPanel } from "./cost/hq";
import { VillaPanel } from "./cost/villa";

// Satu tab = satu menu game; isinya beberapa panel (flat + persentase).
type Tab = "artist" | "car" | "hq" | "villa" | "collection" | "ceo";

const MOD_MIN = 0;
const MOD_MAX = 219;
const MOD_PARTS = 4;
const ARTIST_MIN = 1;
const ARTIST_MAX = 160;

export function CostCalculator({ book, locale, signedIn }: { book: CostBook; locale: Locale; signedIn: boolean }) {
  const C = DICT[locale].cost;
  const format = (value: number) => value.toLocaleString(numberLocale(locale));
  // Nilai persen game disimpan ×100 (mis. 250 = 2,5%).
  const formatPct = (value: number) => (value / 100).toLocaleString(numberLocale(locale), { maximumFractionDigits: 1 });

  const [tab, setTab] = useState<Tab>("artist");

  // Saat ganti tab, balik ke deretan tombol supaya konten tab baru tidak
  // terbuka di tengah. Lompatan pertama (mount) dilewati.
  const tabBar = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tabBar.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [tab]);

  const [artistId, setArtistId] = useState(book.artists[0]?.id ?? 0);
  const [levelFrom, setLevelFrom] = useState(ARTIST_MIN);
  const [levelTo, setLevelTo] = useState(ARTIST_MAX);

  const [modPart, setModPart] = useState(-1);
  const [modFrom, setModFrom] = useState(MOD_MIN);
  const [modTo, setModTo] = useState(MOD_MAX);

  const artist = book.artists.find((a) => a.id === artistId) ?? book.artists[0];
  const curve = artist ? (book.curves[artist.curve] ?? []) : [];
  const exp = expBetween(curve, levelFrom, levelTo);
  const starCards = starCardsForLevels(book.levelStars, book.star.amounts, levelFrom, levelTo);
  const artistBad = levelTo <= levelFrom;
  const modBad = modTo <= modFrom;

  const modTotalsResult = useMemo(
    () =>
      modTotals({
        items: book.costs.carMod[modPart === -1 ? 0 : modPart] ?? [],
        classCosts: book.costs.carModClass,
        classByLevel: book.classByLevel,
        from: modFrom,
        to: modTo,
        count: modPart === -1 ? MOD_PARTS : 1,
      }),
    [book.classByLevel, book.costs.carMod, book.costs.carModClass, modPart, modFrom, modTo],
  );

  // Helper kelas: pemain cukup pilih kelas yang tampil di mod kendaraan, level
  // terisi otomatis (awal = level pertama kelas, target = level terakhir kelas).
  const classRanges = useMemo(() => classLevels(book.classByLevel), [book.classByLevel]);
  const classOptions = book.classes.filter((c) => classRanges.has(c.id));
  const classLabel = (c: CarClass) => (c.star > 0 ? `${c.name} ★${c.star}` : c.name);
  const modLabels = [C.partEngine, C.partChassis, C.partSuspension, C.partWheels];

  // Komponen: nilai tabel = total kumulatif per level, jadi pakai selisih target - awal.
  const modStats = useMemo(() => {
    const total = { sing: 0, dance: 0, management: 0, fan: 0, speed: 0 };
    for (const part of modPart === -1 ? [0, 1, 2, 3] : [modPart]) {
      const delta = statDelta(
        book.modStats.filter((row) => row.part === part),
        modFrom,
        modTo,
      );
      total.sing += delta.sing;
      total.dance += delta.dance;
      total.management += delta.management;
      total.fan += delta.fan;
      total.speed += delta.speed;
    }
    return total;
  }, [book.modStats, modPart, modFrom, modTo]);

  const modStatRows = [
    { label: C.statSing, value: modStats.sing },
    { label: C.statDance, value: modStats.dance },
    { label: C.statManage, value: modStats.management },
    { label: C.statFan, value: modStats.fan },
    { label: C.statSpeed, value: modStats.speed },
  ]
    .filter((row) => row.value > 0)
    .map((row) => ({
      label: row.label,
      value: row.label === C.statSpeed ? `+${formatPct(row.value)}%` : `+${format(row.value)}`,
    }));

  // Semua panel tetap ter-mount (disembunyikan) supaya input tidak hilang saat ganti tab.
  // Museum ikut menu Koleksi: koleksi menambah stat flat, museum mengalikannya (persentase).
  const panels: { tab: Tab; id: string; node: ReactNode }[] = [
    {
      tab: "artist",
      id: "artist",
      node: (
        <section aria-label={C.tabArtist} className={panel}>
          <h2 className="sr-only">{C.tabArtist}</h2>
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
            <NumberField id="cost-level-from" text={C.levelFrom} value={levelFrom} min={ARTIST_MIN} max={ARTIST_MAX} invalid={artistBad} describedBy={artistBad ? "cost-artist-error" : undefined} onChange={(v) => setLevelFrom(clamp(v, ARTIST_MIN, ARTIST_MAX))} />
            <NumberField id="cost-level-to" text={C.levelTo} value={levelTo} min={ARTIST_MIN} max={ARTIST_MAX} invalid={artistBad} describedBy={artistBad ? "cost-artist-error" : undefined} onChange={(v) => setLevelTo(clamp(v, ARTIST_MIN, ARTIST_MAX))} />
          </div>

          {artistBad ? (
            <p id="cost-artist-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          {artistBad ? null : (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/10 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-zinc-300">{C.exp}</p>
                  <p className="tabular text-2xl font-bold break-words text-gold">{format(exp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-panel-2/60 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-zinc-300">{C.starCards}</p>
                  <p className="tabular text-2xl font-bold text-zinc-100">{format(starCards)}</p>
                  <p className="mt-1 text-xs text-zinc-400">{book.star.itemName}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      ),
    },
    {
      tab: "car",
      id: "parts",
      node: (
        <CarPartsPanel parts={book.parts} partStats={book.partStats} costs={book.costs.carPart} C={C} format={format} formatPct={formatPct} />
      ),
    },
    {
      tab: "car",
      id: "mods",
      node: (
        <section aria-label={C.tabMods} className={panel}>
          <h2 className={`${heading} mb-2`}>{C.tabMods}</h2>
          <div role="group" aria-label={C.modPart}>
            <p className={label}>{C.modPart}</p>
            <div className="mt-1">
              <button type="button" aria-pressed={modPart === -1} onClick={() => setModPart(-1)} className={chip(modPart === -1, "sm")}>
                {C.modAllParts}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {modLabels.map((name, index) => {
                const active = index === modPart;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    aria-label={name}
                    title={name}
                    onClick={() => setModPart(index)}
                    className={`flex min-h-11 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition-colors duration-200 ${
                      active ? "border-gold/50 bg-gold/10" : "border-line bg-panel/80 hover:border-white/25"
                    }`}
                  >
                    <span className={`text-2xs font-semibold ${active ? "text-gold" : "text-zinc-400"}`}>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Select
              id="cost-mod-class-from"
              text={C.classFrom}
              value={book.classByLevel[modFrom]}
              onChange={(id) => setModFrom(classRanges.get(id)?.from ?? modFrom)}
            >
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </Select>
            <Select
              id="cost-mod-class-to"
              text={C.targetClass}
              value={book.classByLevel[modTo]}
              onChange={(id) => setModTo(classRanges.get(id)?.to ?? modTo)}
            >
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-2 text-xs text-zinc-400">{C.classHint}</p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-mod-from" text={C.levelFrom} value={modFrom} min={MOD_MIN} max={MOD_MAX} invalid={modBad} describedBy={modBad ? "cost-mod-error" : undefined} onChange={(v) => setModFrom(clamp(v, MOD_MIN, MOD_MAX))} />
            <NumberField id="cost-mod-to" text={C.levelTo} value={modTo} min={MOD_MIN} max={MOD_MAX} invalid={modBad} describedBy={modBad ? "cost-mod-error" : undefined} onChange={(v) => setModTo(clamp(v, MOD_MIN, MOD_MAX))} />
          </div>

          {modBad ? (
            <p id="cost-mod-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          {modBad ? null : (
            <div className={result}>
              <Totals totals={modTotalsResult} note={C.modNote} empty={C.noCost} format={format} />
              <Stats title={C.statsTitle} rows={modStatRows} note={C.statsNote} />
            </div>
          )}
        </section>
      ),
    },
    { tab: "hq", id: "hq", node: <HqPanel hq={book.hq} C={C} format={format} /> },
    { tab: "villa", id: "villa", node: <VillaPanel villa={book.villa} C={C} format={format} /> },
    { tab: "collection", id: "collection", node: <CollectionPanel collection={book.collection} museum={book.museum} C={C} format={format} /> },
    { tab: "ceo", id: "ceo", node: <CeoPanel ceo={book.ceo} C={C} format={format} /> },
  ];

  const tabs: { id: Tab; label: string; glyph?: string }[] = [
    { id: "artist", label: C.tabArtist, glyph: "artist-glyph" },
    { id: "car", label: C.tabCar },
    { id: "hq", label: C.tabHq },
    { id: "villa", label: C.tabVilla },
    { id: "collection", label: C.tabCollection },
    { id: "ceo", label: C.tabCeo },
  ];
  // Tanpa login hanya tab artist yang tampil (dan datanya saja yang dikirim server).
  const visibleTabs = signedIn ? tabs : tabs.filter((item) => item.id === "artist");

  return (
    <div className="flex flex-col gap-4">
      {!signedIn && (
        <p className="rounded-xl border border-line bg-panel/70 px-3 py-2 text-sm text-zinc-400">
          {C.loginHint}{" "}
          <Link href={`/${locale}/login`} className="inline-flex min-h-11 items-center font-semibold text-gold underline-offset-2 hover:underline">
            {DICT[locale].auth.login}
          </Link>
        </p>
      )}

      {signedIn ? (
        <div ref={tabBar} role="group" aria-label={C.title} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`${chip(tab === item.id, "sm")} flex flex-col items-center justify-center gap-1 text-center leading-tight sm:flex-row sm:gap-2 sm:px-3 sm:text-sm`}
            >
              {item.glyph ? (
                <span aria-hidden="true" className={`${item.glyph} h-6 w-6 shrink-0`} />
              ) : (
                <Image
                  src={tabIcon(item.id)}
                  alt=""
                  width={24}
                  height={24}
                  sizes="24px"
                  className="h-6 w-6 shrink-0 object-contain"
                />
              )}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {visibleTabs.map((item) => (
        <div key={item.id} hidden={tab !== item.id} className="flex flex-col gap-4">
          {panels
            .filter((panelItem) => panelItem.tab === item.id)
            .map((panelItem) => (
              <div key={panelItem.id}>{panelItem.node}</div>
            ))}
        </div>
      ))}

      <p className="text-xs text-zinc-400">{C.hint}</p>
    </div>
  );
}
