"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { expBetween, starCardsForLevels } from "@/lib/cost-calc";
import { tabIcon } from "@/lib/cost-icons";
import type { PrivateCostOptions } from "@/lib/cost-private";
import { DICT, numberLocale, type Locale } from "@/lib/i18n";
import type { ArtistCostBook } from "@/lib/costs";
import { chip, clamp, field, invalid, label, NumberField, panel } from "./cost/fields";
import { PeakPanel } from "./cost/peak";
import { PrivateCalculator } from "./cost/private-calculator";

type Tab = "artist" | "car" | "hq" | "villa" | "collection" | "ceo";
const ARTIST_MIN = 1;
const ARTIST_MAX = 160;

export function CostCalculator({ book, privateOptions, locale }: { book: ArtistCostBook; privateOptions: PrivateCostOptions | null; locale: Locale }) {
  const C = DICT[locale].cost;
  const format = (value: number) => value.toLocaleString(numberLocale(locale));
  const formatPct = (value: number) => (value / 100).toLocaleString(numberLocale(locale), { maximumFractionDigits: 1 });
  const [tab, setTab] = useState<Tab>("artist");
  const [artistId, setArtistId] = useState(book.artists[0]?.id ?? 0);
  const [levelFrom, setLevelFrom] = useState(ARTIST_MIN);
  const [levelTo, setLevelTo] = useState(ARTIST_MAX);
  const artist = book.artists.find((item) => item.id === artistId) ?? book.artists[0];
  const bad = levelTo <= levelFrom;
  const tabs = ([
    { id: "artist", label: C.tabArtist }, { id: "car", label: C.tabCar }, { id: "hq", label: C.tabHq },
    { id: "villa", label: C.tabVilla }, { id: "collection", label: C.tabCollection }, { id: "ceo", label: C.tabCeo },
  ] satisfies { id: Tab; label: string }[]).map((item) => ({ ...item, icon: tabIcon(item.id) }));

  return <div className="flex flex-col gap-4">
    {!privateOptions ? <p className="rounded-xl border border-line bg-panel/70 px-3 py-2 text-sm text-zinc-400">{C.loginHint} <Link href={`/${locale}/login`} className="inline-flex min-h-11 items-center font-semibold text-gold underline-offset-2 hover:underline">{DICT[locale].auth.login}</Link></p> : null}
    {privateOptions ? <div role="group" aria-label={C.title} className="grid grid-cols-3 gap-2 sm:grid-cols-6">{tabs.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={`${chip(tab === item.id, "sm")} flex flex-col items-center justify-center gap-1 text-center leading-tight sm:flex-row sm:gap-2 sm:px-3 sm:text-sm`}>{item.icon ? <Image src={item.icon} alt="" width={24} height={24} sizes="24px" className="h-6 w-6 shrink-0 object-contain"/> : null}{item.label}</button>)}</div> : null}

    {tab === "artist" ? <>
      <section aria-label={C.tabArtist} className={panel}>
        <div className="flex flex-col gap-1"><label htmlFor="cost-artist" className={label}>{C.artist}</label><select id="cost-artist" value={artistId} onChange={(event) => setArtistId(Number(event.target.value))} className={field}>{book.artists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        <div className="mt-3 grid grid-cols-2 gap-3"><NumberField id="cost-level-from" text={C.levelFrom} value={levelFrom} min={ARTIST_MIN} max={ARTIST_MAX} invalid={bad} onChange={(value) => setLevelFrom(clamp(value, ARTIST_MIN, ARTIST_MAX))}/><NumberField id="cost-level-to" text={C.levelTo} value={levelTo} min={ARTIST_MIN} max={ARTIST_MAX} invalid={bad} onChange={(value) => setLevelTo(clamp(value, ARTIST_MIN, ARTIST_MAX))}/></div>
        {bad ? <p role="status" className={invalid}>{C.invalid}</p> : <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><Result label={C.exp} value={format(expBetween(artist ? book.curves[artist.curve] ?? [] : [], levelFrom, levelTo))}/><Result label={C.starCards} value={format(starCardsForLevels(book.levelStars, book.star.amounts, levelFrom, levelTo))} note={book.star.itemName}/></div>}
      </section>
      <PeakPanel peak={book.peak} artist={artist} C={C} format={format} formatPct={formatPct}/>
    </> : privateOptions ? <PrivateCalculator tab={tab} options={privateOptions} locale={locale}/> : null}
    <p className="text-xs text-zinc-400">{C.hint}</p>
  </div>;
}

function Result({ label: text, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-xl border border-line bg-panel-2/60 px-3 py-3"><p className="text-2xs font-semibold uppercase tracking-wide text-zinc-300">{text}</p><p className="tabular text-2xl font-bold break-words text-gold">{value}</p>{note ? <p className="mt-1 text-xs text-zinc-400">{note}</p> : null}</div>;
}
