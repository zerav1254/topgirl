import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { CostItem } from "./cost-calc.ts";
import { supabase } from "./supabase.ts";

export type { CostItem } from "./cost-calc.ts";

export type CarPart = { id: number; name: string; slot: "steering" | "chip" | "sound"; tier: number };

export type CarClass = { id: number; name: string; star: number };

export type CostBook = {
  artists: { id: number; name: string; curve: number }[];
  // steps[level - 1] = EXP untuk naik ke level tersebut. Indeks 0 (level 1) bernilai 0.
  curves: number[][];
  // amounts[star] = jumlah item untuk naik dari star itu ke star + 1.
  star: { itemName: string; amounts: number[] };
  parts: CarPart[];
  classes: CarClass[];
  // classByLevel[level] = id kelas mod; 220 level, sama untuk keempat part.
  classByLevel: number[];
  costs: {
    carPart: Record<number, CostItem[]>;
    carMod: Record<number, CostItem[]>;
    carModClass: Record<number, CostItem[]>;
  };
};

type CurveRow = { artist_ids: number[]; steps: number[] };
type StarRow = { star: number; item_name: string; amount: number };
type PartRow = { id: number; name: string; slot: CarPart["slot"]; tier: number };
type ClassRow = { id: number; name: string; star: number };
type LevelRow = { level: number; class_id: number };
type CostRow = { scope: "car_part" | "car_mod" | "car_mod_class"; ref_id: number; item_id: number; item_name: string; amounts: Record<string, number> };

function fail(what: string, message: string): never {
  throw new Error(`Gagal memuat ${what}: ${message}`);
}

export async function loadCostBook(): Promise<CostBook> {
  const [curves, stars, artists, parts, classes, levels, costs] = await Promise.all([
    supabase.from("artist_exp_curves").select("artist_ids, steps"),
    supabase.from("artist_star_curve").select("star, item_name, amount").order("star"),
    supabase.from("artists").select("id, name").order("name"),
    supabase.from("car_parts").select("id, name, slot, tier").order("slot").order("tier"),
    supabase.from("car_mod_classes").select("id, name, star").order("id"),
    supabase.from("car_mod_levels").select("level, class_id").eq("part", 0).order("level"),
    supabase.from("game_cost_items").select("scope, ref_id, item_id, item_name, amounts"),
  ]);

  if (curves.error) fail("kurva EXP", curves.error.message);
  if (stars.error) fail("biaya star", stars.error.message);
  if (artists.error) fail("artis", artists.error.message);
  if (parts.error) fail("komponen mobil", parts.error.message);
  if (classes.error) fail("kelas mod", classes.error.message);
  if (levels.error) fail("level mod", levels.error.message);
  if (costs.error) fail("biaya item", costs.error.message);

  const curveRows = (curves.data as CurveRow[]).map((r) => ({ artistIds: r.artist_ids, steps: r.steps.map(Number) }));
  const curveOf = new Map<number, number>();
  curveRows.forEach((r, i) => r.artistIds.forEach((id) => curveOf.set(id, i)));

  const starRows = (stars.data as StarRow[]).map((r) => ({ ...r, amount: Number(r.amount) })).sort((a, b) => a.star - b.star);
  const starAmounts: number[] = [];
  starRows.forEach((r) => {
    starAmounts[r.star] = r.amount;
  });

  const book: CostBook = {
    artists: (artists.data as { id: number; name: string }[])
      .filter((a) => curveOf.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, curve: curveOf.get(a.id)! })),
    curves: curveRows.map((r) => r.steps),
    star: { itemName: starRows[0]?.item_name ?? "", amounts: starAmounts },
    parts: parts.data as PartRow[],
    classes: (classes.data as ClassRow[]).map((c) => ({ id: c.id, name: c.name, star: c.star })),
    classByLevel: (levels.data as LevelRow[]).map((r) => r.class_id),
    costs: { carPart: {}, carMod: {}, carModClass: {} },
  };

  for (const row of costs.data as CostRow[]) {
    const target =
      row.scope === "car_part" ? book.costs.carPart : row.scope === "car_mod" ? book.costs.carMod : book.costs.carModClass;
    (target[row.ref_id] ??= []).push({ itemId: row.item_id, itemName: row.item_name, amounts: row.amounts });
  }

  return book;
}

// Data config game hampir statis; cache satu jam supaya 3 query view tidak diulang tiap request.
export const getCostBook = cache(unstable_cache(loadCostBook, ["cost-book"], { revalidate: 3600 }));
