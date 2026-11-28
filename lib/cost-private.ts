import "server-only";

import { statDelta, statSum, sumLevels, type CostTotal, type StatValues } from "./cost-calc.ts";
import { getCostBook } from "./costs.ts";
import type { Locale } from "./i18n.ts";

export type CostStats = Pick<StatValues, "sing" | "dance" | "management"> & Partial<Pick<StatValues, "fan" | "speed">>;
export type PrivateCostResult = { totals: CostTotal[]; stats: CostStats; secondaryStats?: CostStats };
export type PrivateCostOptions = {
  car: { partTiers: number[]; modClasses: { id: number; name: string; star: number; from: number; to: number }[] };
  hq: { rooms: { tier: number; slot: number; room: string; name: string }[] };
  villa: { stages: { id: number; name: string }[]; suites: { stage: number; id: number; name: string; max: number }[]; staff: { tier: number; id: number; name: string }[] };
  collection: { zones: { id: number; name: string; genre: string }[]; items: { zone: number; id: number; name: string; rarity: number }[]; museumTiers: number[] };
  ceo: { stages: { id: number; name: string }[]; outfits: { stage: number; id: number; name: string; max: number }[]; sportTiers: number[] };
};

const stats = (value: StatValues): CostStats => ({ sing: value.sing, dance: value.dance, management: value.management, fan: value.fan, speed: value.speed });
const multiply = (totals: CostTotal[], count: number) => totals.map((item) => ({ ...item, amount: item.amount * count }));

export async function getPrivateCostOptions(locale: Locale): Promise<PrivateCostOptions> {
  const book = await getCostBook(locale);
  const ranges = new Map<number, { from: number; to: number }>();
  book.classByLevel.forEach((id, level) => {
    const range = ranges.get(id);
    if (range) range.to = level;
    else ranges.set(id, { from: level, to: level });
  });
  return {
    car: {
      partTiers: [...new Set(book.parts.map((item) => item.tier))],
      modClasses: book.classes.flatMap((item) => {
        const range = ranges.get(item.id);
        return range ? [{ ...item, ...range }] : [];
      }),
    },
    hq: { rooms: book.hq.rooms },
    villa: {
      stages: book.villa.stages.map((item) => ({ id: item.stage, name: item.name })),
      suites: book.villa.suites.filter((item) => item.levelMax > 0).map((item) => ({ stage: item.stage, id: item.suite, name: item.name, max: item.levelMax * Math.max(book.villa.stages.find((stage) => stage.stage === item.stage)?.advanceMax ?? 1, 1) })),
      staff: book.villa.staff.map((item) => ({ tier: item.tier, id: item.staffType, name: item.name })),
    },
    collection: {
      zones: book.collection.zones.map((item) => ({ id: item.zone, name: item.name, genre: item.genre })),
      items: book.collection.items.map((item) => ({ zone: item.zone, id: item.id, name: item.name, rarity: item.rarity })),
      museumTiers: book.museum.map((_, index) => index + 1),
    },
    ceo: {
      stages: book.ceo.stages.map((item) => ({ id: item.stage, name: item.name })),
      outfits: book.ceo.outfits.filter((item) => item.levelMax > 0).map((item) => ({ stage: item.stage, id: item.outfit, name: item.name, max: item.levelMax * Math.max(book.ceo.stages.find((stage) => stage.stage === item.stage)?.advanceMax ?? 1, 1) })),
      sportTiers: book.ceo.sportCosts.map((_, index) => index + 1),
    },
  };
}

export { multiply, stats };
