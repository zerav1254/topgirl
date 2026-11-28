"use client";

import { useState, useTransition } from "react";
import { calculateCarCost, calculateCeoCost, calculateCollectionCost, calculateHqCost, calculateVillaCost } from "@/app/[locale]/upgrade/actions";
import type { PrivateCostError, PrivateCostOptions, PrivateCostResponse, PrivateCostResult } from "@/lib/cost-private";
import { DICT, numberLocale, t, type Locale } from "@/lib/i18n";
import { chip, clamp, invalid, NumberField, panel, result, Select, Stats, Totals } from "./fields";

type Tab = "car" | "hq" | "villa" | "collection" | "ceo";
type Mode = "first" | "second";
type Range = { from: number; to: number };
const RARITY: Record<number, string> = { 2: "R", 3: "SR", 4: "SSR" };

export function PrivateCalculator({ tab, options, locale }: { tab: Tab; options: PrivateCostOptions; locale: Locale }) {
  const C = DICT[locale].cost;
  const format = (value: number) => value.toLocaleString(numberLocale(locale));
  const formatPct = (value: number) => (value / 100).toLocaleString(numberLocale(locale), { maximumFractionDigits: 1 });
  const [mode, setMode] = useState<Mode>("first");
  const [ranges, setRanges] = useState<Record<string, Range>>({ part: { from: 1, to: 60 }, mod: { from: 0, to: 219 }, building: { from: 1, to: 800 }, room: { from: 1, to: 60 }, suite: { from: 0, to: 10 }, staff: { from: 1, to: 60 }, item: { from: 1, to: 65 }, museum: { from: 1, to: 60 }, appearance: { from: 0, to: 10 }, sport: { from: 1, to: 60 } });
  const [tier, setTier] = useState<Record<Tab, number>>({ car: options.car.partTiers[0] ?? 1, hq: options.hq.rooms[0]?.tier ?? 1, villa: options.villa.staff[0]?.tier ?? 1, collection: options.collection.museumTiers[0] ?? 1, ceo: options.ceo.sportTiers[0] ?? 1 });
  const [part, setPart] = useState<Record<Tab, number>>({ car: 0, hq: 0, villa: 0, collection: 0, ceo: 0 });
  const [modPart, setModPart] = useState(-1);
  const [stage, setStage] = useState<Record<"villa" | "ceo", { from: number; to: number; item: number }>>({ villa: { from: 0, to: options.villa.stages.at(-1)?.id ?? 1, item: 0 }, ceo: { from: 0, to: options.ceo.stages.at(-1)?.id ?? 1, item: 0 } });
  const [zone, setZone] = useState(options.collection.zones[0]?.id ?? 0);
  const firstItem = options.collection.items.find((item) => item.zone === zone)?.id ?? 0;
  const [collectionItem, setCollectionItem] = useState(firstItem);
  const [buildingLevel, setBuildingLevel] = useState(800);
  const [data, setData] = useState<Partial<Record<Mode, PrivateCostResult>>>({});
  const [error, setError] = useState<PrivateCostError | null>(null);
  const [pending, startTransition] = useTransition();

  const key = tab === "car" ? (mode === "first" ? "part" : "mod") : tab === "hq" ? (mode === "first" ? "building" : "room") : tab === "villa" ? (mode === "first" ? "suite" : "staff") : tab === "collection" ? (mode === "first" ? "item" : "museum") : mode === "first" ? "appearance" : "sport";
  const range = ranges[key];
  const max = { part: 60, mod: 219, building: 800, room: 60, suite: selectedMax("villa"), staff: 60, item: 65, museum: 60, appearance: selectedMax("ceo"), sport: 60 }[key];
  const min = key === "mod" || key === "suite" || key === "appearance" ? 0 : 1;
  const bad = range.to <= range.from || range.to > max;
  const labels: Record<Tab, [string, string]> = { car: [C.tabParts, C.tabMods], hq: [C.hqBuilding, C.hqRooms], villa: [C.villaSuite, C.villaStaff], collection: [C.tabCollection, C.tabMuseum], ceo: [C.ceoAppearance, C.ceoSport] };
  const roomTiers = [...new Set(options.hq.rooms.map((item) => item.tier))];
  const staffTiers = [...new Set(options.villa.staff.map((item) => item.tier))];
  const tierValues = tab === "car" ? options.car.partTiers : tab === "hq" ? roomTiers : tab === "villa" ? staffTiers : tab === "collection" ? options.collection.museumTiers : options.ceo.sportTiers;

  function selectedMax(domain: "villa" | "ceo") {
    const children = domain === "villa" ? options.villa.suites : options.ceo.outfits;
    return children.find((item) => item.stage === stage[domain].to)?.max ?? 0;
  }
  function setRange(field: keyof Range, value: string) {
    setRanges({ ...ranges, [key]: { ...range, [field]: clamp(value, min, max) } });
  }
  function switchMode(next: Mode) { setMode(next); setError(null); }
  function run() {
    setError(null);
    startTransition(async () => {
      try {
        let response: PrivateCostResponse;
        if (tab === "car") response = mode === "first" ? await calculateCarCost({ locale, kind: "part", tier: tier.car, slot: part.car as 0 | 1 | 2 | 3, ...range }) : await calculateCarCost({ locale, kind: "mod", part: modPart as -1 | 0 | 1 | 2 | 3, ...range });
        else if (tab === "hq") response = mode === "first" ? await calculateHqCost({ locale, kind: "building", ...range }) : await calculateHqCost({ locale, kind: "room", tier: tier.hq, slot: part.hq, buildingLevel, ...range });
        else if (tab === "villa") response = mode === "first" ? await calculateVillaCost({ locale, kind: "suite", stageFrom: stage.villa.from, stageTo: stage.villa.to, itemId: stage.villa.item, itemFrom: range.from, itemTo: range.to, ...range }) : await calculateVillaCost({ locale, kind: "staff", tier: tier.villa, staffType: part.villa, base: data.first?.stats ?? { sing: 0, dance: 0, management: 0 }, ...range });
        else if (tab === "collection") response = mode === "first" ? await calculateCollectionCost({ locale, kind: "item", itemId: collectionItem, ...range }) : await calculateCollectionCost({ locale, kind: "museum", tier: tier.collection, part: (["all", "case", "wall", "floor"] as const)[part.collection] ?? "all", ...range });
        else response = mode === "first" ? await calculateCeoCost({ locale, kind: "appearance", stageFrom: stage.ceo.from, stageTo: stage.ceo.to, itemId: stage.ceo.item, itemFrom: range.from, itemTo: range.to, ...range }) : await calculateCeoCost({ locale, kind: "sport", tier: tier.ceo, base: data.first?.stats ?? { sing: 0, dance: 0, management: 0 }, ...range });
        if (!response.ok) return setError(response.error);
        setData({ ...data, [mode]: response.data });
      } catch { setError("server_error"); }
    });
  }
  function stats(value: PrivateCostResult["stats"] | undefined, percent = false, icon: string | null = null) {
    return value ? [{ label: C.statSing, value: value.sing }, { label: C.statDance, value: value.dance }, { label: C.statManage, value: value.management }, { label: C.statFan, value: value.fan ?? 0 }, { label: C.statSpeed, value: value.speed ?? 0 }].filter((row) => row.value > 0).map((row) => ({ label: row.label, value: `+${percent || row.label === C.statSpeed ? `${formatPct(row.value)}%` : format(row.value)}`, icon })) : [];
  }

  const stageDomain = tab === "villa" || tab === "ceo" ? tab : null;
  const stageOptions = stageDomain ? options[stageDomain].stages : [];
  const children = stageDomain ? (stageDomain === "villa" ? options.villa.suites : options.ceo.outfits).filter((item) => item.stage === stage[stageDomain].to) : [];
  const rooms = options.hq.rooms.filter((item) => item.tier === tier.hq);
  const staff = options.villa.staff.filter((item) => item.tier === tier.villa);
  const zoneItems = options.collection.items.filter((item) => item.zone === zone);
  const modClass = (level: number) => options.car.modClasses.find((item) => level >= item.from && level <= item.to)?.id ?? options.car.modClasses[0]?.id ?? 0;

  return <section className={panel} aria-label={labels[tab][mode === "first" ? 0 : 1]}>
    <div role="group" aria-label={C.title} className="mb-3 grid grid-cols-2 gap-2">{labels[tab].map((text, index) => { const value = index ? "second" : "first"; return <button key={text} type="button" className={chip(mode === value, "sm")} aria-pressed={mode === value} onClick={() => switchMode(value)}>{text}</button>; })}</div>

    {key === "mod" ? <div className="grid grid-cols-2 gap-3"><Select id="mod-class-from" text={C.classFrom} value={modClass(range.from)} onChange={(id) => setRanges({ ...ranges, mod: { ...range, from: options.car.modClasses.find((item) => item.id === id)?.from ?? range.from } })}>{options.car.modClasses.map((item) => <option key={item.id} value={item.id}>{item.star ? `${item.name} ★${item.star}` : item.name}</option>)}</Select><Select id="mod-class-to" text={C.targetClass} value={modClass(range.to)} onChange={(id) => setRanges({ ...ranges, mod: { ...range, to: options.car.modClasses.find((item) => item.id === id)?.to ?? range.to } })}>{options.car.modClasses.map((item) => <option key={item.id} value={item.id}>{item.star ? `${item.name} ★${item.star}` : item.name}</option>)}</Select></div> : null}
    {stageDomain && mode === "first" ? <div className="grid grid-cols-2 gap-3"><Select id={`${tab}-stage-from`} text={tab === "ceo" ? C.appearanceFrom : C.stageFrom} value={stage[stageDomain].from} onChange={(value) => setStage({ ...stage, [stageDomain]: { ...stage[stageDomain], from: value } })}><option value={0}>{C.stageNone}</option>{stageOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select id={`${tab}-stage-to`} text={tab === "ceo" ? C.appearanceTo : C.stageTo} value={stage[stageDomain].to} onChange={(value) => { const child = (stageDomain === "villa" ? options.villa.suites : options.ceo.outfits).find((item) => item.stage === value); setStage({ ...stage, [stageDomain]: { ...stage[stageDomain], to: value, item: 0 } }); if (child) setRanges({ ...ranges, [key]: { from: 0, to: child.max } }); }} >{stageOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>{children.length ? <Select id={`${tab}-child`} text={tab === "villa" ? C.villaSuite : C.ceoAppearance} value={stage[stageDomain].item} onChange={(value) => setStage({ ...stage, [stageDomain]: { ...stage[stageDomain], item: value } })}><option value={0}>{tab === "villa" ? C.villaAllSuites : C.ceoAllOutfits}</option>{children.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select> : null}</div> : null}
    {key === "item" ? <div className="grid grid-cols-2 gap-3"><Select id="collection-zone" text={C.collectionZone} value={zone} onChange={(value) => { setZone(value); setCollectionItem(options.collection.items.find((item) => item.zone === value)?.id ?? 0); }}>{options.collection.zones.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.genre}</option>)}</Select><Select id="collection-item" text={C.item} value={collectionItem} onChange={setCollectionItem}>{zoneItems.map((item) => <option key={item.id} value={item.id}>{RARITY[item.rarity]} · {item.name}</option>)}</Select></div> : null}
    {tierValues.length && ["part", "room", "staff", "museum", "sport"].includes(key) ? <Select id={`${tab}-tier`} text={key === "room" ? C.hqRooms : C.tier} value={tier[tab]} onChange={(value) => { setTier({ ...tier, [tab]: value }); setPart({ ...part, [tab]: 0 }); }}>{tierValues.map((value) => <option key={value} value={value}>{key === "room" ? options.hq.rooms.find((item) => item.tier === value)?.room : `${C.tier} ${value}`}</option>)}</Select> : null}
    {key === "part" ? <Select id="car-part" text={C.part} value={part.car} onChange={(value) => setPart({ ...part, car: value })}><option value={0}>{C.partAll}</option><option value={1}>{C.slotSteering}</option><option value={2}>{C.slotChip}</option><option value={3}>{C.slotSound}</option></Select> : null}
    {key === "mod" ? <Select id="car-mod" text={C.modPart} value={modPart} onChange={setModPart}><option value={-1}>{C.modAllParts}</option>{[C.partEngine, C.partChassis, C.partSuspension, C.partWheels].map((name, index) => <option key={name} value={index}>{name}</option>)}</Select> : null}
    {key === "room" ? <><Select id="hq-room" text={C.hqRoom} value={part.hq} onChange={(value) => setPart({ ...part, hq: value })}><option value={0}>{C.hqAllSlots}</option>{rooms.map((item) => <option key={item.slot} value={item.slot}>{item.name}</option>)}</Select><NumberField id="hq-building-level" text={C.level} value={buildingLevel} min={1} max={800} onChange={(value) => setBuildingLevel(clamp(value, 1, 800))}/></> : null}
    {key === "staff" ? <Select id="villa-staff" text={C.villaStaff} value={part.villa} onChange={(value) => setPart({ ...part, villa: value })}><option value={0}>{C.villaAllStaff}</option>{staff.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select> : null}
    {key === "museum" ? <Select id="museum-part" text={C.part} value={part.collection} onChange={(value) => setPart({ ...part, collection: value })}><option value={0}>{C.museumAllParts}</option><option value={1}>{C.museumPart1}</option><option value={2}>{C.museumPart2}</option><option value={3}>{C.museumPart3}</option></Select> : null}

    {max > 0 ? <div className="mt-3 grid grid-cols-2 gap-3"><NumberField id={`${tab}-${key}-from`} text={C.levelFrom} value={range.from} min={min} max={max} invalid={bad} onChange={(value) => setRange("from", value)}/><NumberField id={`${tab}-${key}-to`} text={C.levelTo} value={range.to} min={min} max={max} invalid={bad} onChange={(value) => setRange("to", value)}/></div> : null}
    {bad ? <p role="status" className={invalid}>{C.invalid}</p> : null}
    <button type="button" disabled={bad || pending || !max && (key === "suite" || key === "appearance")} onClick={run} className={`${chip(true)} mt-4 w-full disabled:cursor-wait disabled:opacity-60`}>{pending ? DICT[locale].common.loading : C.total}</button>
    {error ? <p role="alert" className={invalid}>{{ unauthenticated: C.errorUnauthenticated, invalid_request: C.errorInvalid, rate_limited: C.errorRateLimited, server_error: C.errorServer }[error]}</p> : null}
    {data[mode] ? <div className={result}><Totals totals={data[mode]!.totals} empty={C.noCost} format={format}/><Stats title={C.statsTitle} rows={stats(data[mode]!.stats, ["part", "room", "staff", "museum", "sport"].includes(key), key === "item" ? options.collection.zones.find((item) => item.id === zone)?.genreImage ?? null : null)} note={C.statsNote}/>{data[mode]!.secondaryStats ? <Stats title={tab === "hq" ? t(C.hqFloorGain, { level: buildingLevel }) : tab === "villa" ? C.villaStaffGain : C.ceoSportGain} rows={stats(data[mode]!.secondaryStats)}/> : null}</div> : null}
  </section>;
}
