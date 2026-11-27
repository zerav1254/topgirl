import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { CostItem } from "./cost-calc.ts";
import { adminClient } from "./supabase.ts";

export type { CostItem } from "./cost-calc.ts";

export type CarPart = { id: number; name: string; slot: "steering" | "chip" | "sound"; tier: number };

export type CarClass = { id: number; name: string; star: number };

// Biaya per tier; indeks array = tier - 1 (tier mulai 1).
export type TierCosts = CostItem[][];

export type VillaStage = { stage: number; name: string; itemName: string; amount: number };

export type VillaSuite = { stage: number; suite: number; name: string; itemName: string; amount: number };

export type VillaStaff = { id: number; name: string; staffType: number; tier: number; itemName: string; amount: number };

export type CeoStage = { stage: number; name: string; itemName: string; amount: number };

export type CeoOutfit = { stage: number; outfit: number; name: string; itemName: string; amount: number };

// Item koleksi ruang pamer; rarity 2/3/4 = R/SR/SSR, biaya per level pakai permata sesuai rarity.
export type CollectionItem = { id: number; zone: number; name: string; rarity: number; cost: CostItem };

export type CostBook = {
  artists: { id: number; name: string; curve: number }[];
  // steps[level - 1] = EXP untuk naik ke level tersebut. Indeks 0 (level 1) bernilai 0.
  curves: number[][];
  // amounts[star] = jumlah item untuk naik dari star itu ke star + 1.
  star: { itemName: string; amounts: number[] };
  // levelStars[level - 1] = star minimal untuk level artis tersebut.
  levelStars: number[];
  parts: CarPart[];
  classes: CarClass[];
  // classByLevel[level] = id kelas mod; 220 level, sama untuk keempat part.
  classByLevel: number[];
  costs: {
    carPart: Record<number, CostItem[]>;
    carMod: Record<number, CostItem[]>;
    carModClass: Record<number, CostItem[]>;
  };
  museum: TierCosts;
  hq: {
    curve: { itemName: string; amounts: number[] };
    rooms: { tier: number; slot: number; room: string; name: string }[];
    // roomCosts[tier - 1] = biaya level; 4 slot per tier berbagi biaya.
    roomCosts: TierCosts;
  };
  villa: {
    stages: VillaStage[];
    suites: VillaSuite[];
    staff: VillaStaff[];
    // staffCosts[tier - 1] = biaya level staf; 3 tipe staf berbagi biaya.
    staffCosts: TierCosts;
  };
  collection: { platforms: Record<number, CostItem[]>; stars: Record<number, CostItem[]>; items: CollectionItem[] };
  ceo: { stages: CeoStage[]; outfits: CeoOutfit[]; sportCosts: TierCosts };
};

type CurveRow = { artist_ids: number[]; steps: number[] };
type StarRow = { star: number; item_name: string; amount: number };
type LevelStarRow = { level: number; star: number };
type PartRow = { id: number; name: string; slot: CarPart["slot"]; tier: number };
type ClassRow = { id: number; name: string; star: number };
type LevelRow = { level: number; class_id: number };
type CostScope = "car_part" | "car_mod" | "car_mod_class" | "collection_platform" | "collection_star";
type CostRow = { scope: CostScope; ref_id: number; item_id: number; item_name: string; amounts: Record<string, number> };
type TierCostRow = { tier: number; item_id: number; item_name: string; amounts: Record<string, number> };
type HqCurveRow = { amounts: number[]; item_name: string | null };
type HqRoomRow = { tier: number; slot: number; room: string; name: string };
type VillaStageRow = { stage: number; name: string; item_name: string; amount: number };
// Relasi embed bisa berbentuk objek atau array tergantung tipe yang digenerate Supabase.
type StageRef = { stage: number } | { stage: number }[];
type VillaSuiteRow = { suite: number; name: string; item_name: string; amount: number; villa_stages: StageRef };
type VillaStaffRow = { id: number; name: string; staff_type: number; tier: number; item_name: string; amount: number };
type CeoStageRow = { stage: number; name: string; item_name: string; amount: number };
type CeoOutfitRow = { outfit: number; name: string; item_name: string; amount: number; ceo_appearance_stages: StageRef };
type CollectionItemRow = { id: number; zone: number; name: string; rarity: number; gem_item: number; gem_name: string };

const stageOf = (ref: StageRef) => (Array.isArray(ref) ? (ref[0]?.stage ?? 0) : ref.stage);

function fail(what: string, message: string): never {
  throw new Error(`Gagal memuat ${what}: ${message}`);
}

// Baris per tier -> array berindeks tier - 1.
function byTier(rows: TierCostRow[]): TierCosts {
  const tiers: TierCosts = [];
  for (const row of rows) {
    (tiers[row.tier - 1] ??= []).push({ itemId: row.item_id, itemName: row.item_name, amounts: row.amounts });
  }
  return tiers;
}

export async function loadCostBook(): Promise<CostBook> {
  // Tabel biaya upgrade hanya untuk role authenticated; server memakai service_role.
  const supabase = adminClient();
  const [
    curves,
    stars,
    levelStars,
    artists,
    parts,
    classes,
    levels,
    costs,
    museum,
    hqCurve,
    hqRooms,
    hqRoomList,
    villaStages,
    villaSuites,
    villaStaff,
    villaStaffCosts,
    ceoStages,
    ceoOutfits,
    ceoSportCosts,
    collectionItems,
    collectionLevels,
  ] = await Promise.all([
    supabase.from("artist_exp_curves").select("artist_ids, steps"),
    supabase.from("artist_star_curve").select("star, item_name, amount").order("star"),
    supabase.from("artist_level_stars").select("level, star").order("level"),
    supabase.from("artists").select("id, name").order("name"),
    supabase.from("car_parts").select("id, name, slot, tier").order("slot").order("tier"),
    supabase.from("car_mod_classes").select("id, name, star").order("id"),
    supabase.from("car_mod_levels").select("level, class_id").eq("part", 0).order("level"),
    supabase.from("game_cost_items").select("scope, ref_id, item_id, item_name, amounts"),
    supabase.from("museum_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("headquarters_level_curve").select("amounts, item_name").single(),
    supabase.from("headquarters_room_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("headquarters_rooms").select("tier, slot, room, name").order("tier").order("slot"),
    supabase.from("villa_stages").select("stage, name, item_name, amount").order("stage"),
    supabase.from("villa_suites").select("suite, name, item_name, amount, villa_stages!inner(stage)").order("id"),
    supabase.from("villa_staff").select("id, name, staff_type, tier, item_name, amount").order("id"),
    supabase.from("villa_staff_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("ceo_appearance_stages").select("stage, name, item_name, amount").order("stage"),
    supabase.from("ceo_appearance_outfits").select("outfit, name, item_name, amount, ceo_appearance_stages!inner(stage)").order("id"),
    supabase.from("ceo_sport_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("collection_items").select("id, zone, name, rarity, gem_item, gem_name").order("id"),
    supabase.from("collection_levels").select("level, amount").order("level"),
  ]);

  if (curves.error) fail("kurva EXP", curves.error.message);
  if (stars.error) fail("biaya star", stars.error.message);
  if (levelStars.error) fail("syarat star per level", levelStars.error.message);
  if (artists.error) fail("artis", artists.error.message);
  if (parts.error) fail("komponen mobil", parts.error.message);
  if (classes.error) fail("kelas mod", classes.error.message);
  if (levels.error) fail("level mod", levels.error.message);
  if (costs.error) fail("biaya item", costs.error.message);
  if (museum.error) fail("biaya museum", museum.error.message);
  if (hqCurve.error) fail("kurva markas", hqCurve.error.message);
  if (hqRooms.error) fail("biaya ruangan markas", hqRooms.error.message);
  if (hqRoomList.error) fail("daftar ruangan markas", hqRoomList.error.message);
  if (villaStages.error) fail("stage vila", villaStages.error.message);
  if (villaSuites.error) fail("suite vila", villaSuites.error.message);
  if (villaStaff.error) fail("staf vila", villaStaff.error.message);
  if (villaStaffCosts.error) fail("biaya level staf vila", villaStaffCosts.error.message);
  if (ceoStages.error) fail("stage penampilan CEO", ceoStages.error.message);
  if (ceoOutfits.error) fail("outfit penampilan CEO", ceoOutfits.error.message);
  if (ceoSportCosts.error) fail("biaya olahraga CEO", ceoSportCosts.error.message);
  if (collectionItems.error) fail("item koleksi", collectionItems.error.message);
  if (collectionLevels.error) fail("biaya level koleksi", collectionLevels.error.message);

  const curveRows = (curves.data as CurveRow[]).map((r) => ({ artistIds: r.artist_ids, steps: r.steps.map(Number) }));
  const curveOf = new Map<number, number>();
  curveRows.forEach((r, i) => r.artistIds.forEach((id) => curveOf.set(id, i)));

  const starRows = (stars.data as StarRow[]).map((r) => ({ ...r, amount: Number(r.amount) })).sort((a, b) => a.star - b.star);
  const starAmounts: number[] = [];
  starRows.forEach((r) => {
    starAmounts[r.star] = r.amount;
  });

  const levelStarRows: number[] = [];
  for (const row of levelStars.data as LevelStarRow[]) levelStarRows[row.level - 1] = row.star;

  const collectionAmounts: Record<string, number> = {};
  for (const row of collectionLevels.data as { level: number; amount: string }[]) collectionAmounts[row.level] = Number(row.amount);

  const book: CostBook = {
    artists: (artists.data as { id: number; name: string }[])
      .filter((a) => curveOf.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, curve: curveOf.get(a.id)! })),
    curves: curveRows.map((r) => r.steps),
    star: { itemName: starRows[0]?.item_name ?? "", amounts: starAmounts },
    levelStars: levelStarRows,
    parts: parts.data as PartRow[],
    classes: (classes.data as ClassRow[]).map((c) => ({ id: c.id, name: c.name, star: c.star })),
    classByLevel: (levels.data as LevelRow[]).map((r) => r.class_id),
    costs: { carPart: {}, carMod: {}, carModClass: {} },
    museum: byTier(museum.data as TierCostRow[]),
    hq: {
      curve: {
        itemName: (hqCurve.data as HqCurveRow).item_name ?? "",
        amounts: (hqCurve.data as HqCurveRow).amounts.map(Number),
      },
      rooms: hqRoomList.data as HqRoomRow[],
      roomCosts: byTier(hqRooms.data as TierCostRow[]),
    },
    villa: {
      stages: (villaStages.data as VillaStageRow[]).map((r) => ({
        stage: r.stage,
        name: r.name,
        itemName: r.item_name,
        amount: Number(r.amount),
      })),
      suites: (villaSuites.data as VillaSuiteRow[]).map((r) => ({
        stage: stageOf(r.villa_stages),
        suite: r.suite,
        name: r.name,
        itemName: r.item_name,
        amount: Number(r.amount),
      })),
      staff: (villaStaff.data as VillaStaffRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        staffType: r.staff_type,
        tier: r.tier,
        itemName: r.item_name,
        amount: Number(r.amount),
      })),
      staffCosts: byTier(villaStaffCosts.data as TierCostRow[]),
    },
    collection: {
      platforms: {},
      stars: {},
      items: (collectionItems.data as CollectionItemRow[]).map((r) => ({
        id: r.id,
        zone: r.zone,
        name: r.name,
        rarity: r.rarity,
        cost: { itemId: r.gem_item, itemName: r.gem_name, amounts: collectionAmounts },
      })),
    },
    ceo: {
      stages: (ceoStages.data as CeoStageRow[]).map((r) => ({
        stage: r.stage,
        name: r.name,
        itemName: r.item_name,
        amount: Number(r.amount),
      })),
      outfits: (ceoOutfits.data as CeoOutfitRow[]).map((r) => ({
        stage: stageOf(r.ceo_appearance_stages),
        outfit: r.outfit,
        name: r.name,
        itemName: r.item_name,
        amount: Number(r.amount),
      })),
      sportCosts: byTier(ceoSportCosts.data as TierCostRow[]),
    },
  };

  for (const row of costs.data as CostRow[]) {
    const item = { itemId: row.item_id, itemName: row.item_name, amounts: row.amounts };
    if (row.scope === "collection_platform") (book.collection.platforms[row.ref_id] ??= []).push(item);
    else if (row.scope === "collection_star") (book.collection.stars[row.ref_id] ??= []).push(item);
    else {
      const target =
        row.scope === "car_part" ? book.costs.carPart : row.scope === "car_mod" ? book.costs.carMod : book.costs.carModClass;
      (target[row.ref_id] ??= []).push(item);
    }
  }

  return book;
}

// Data config game hampir statis; cache satu jam supaya query view tidak diulang tiap request.
export const getCostBook = cache(unstable_cache(loadCostBook, ["cost-book"], { revalidate: 3600 }));
