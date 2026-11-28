import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { CostItem } from "./cost-calc.ts";
import { localizedName } from "./cost-names.ts";
import type { Locale } from "./i18n.ts";
import { adminClient } from "./supabase-admin.ts";

export type { CostItem } from "./cost-calc.ts";

export type CarPart = { id: number; name: string; slot: "steering" | "chip" | "sound"; tier: number };

export type CarClass = { id: number; name: string; star: number };

// Stat per level komponen mobil (CCarEquipLevel); nilai = tambahan per level.
export type CarPartStat = { partId: number; level: number; sing: number; dance: number; management: number };

// Stat per level mod mobil (CCarModLevel); nilai = total kumulatif per level.
export type CarModStat = { part: number; level: number; classId: number; sing: number; dance: number; management: number; fan: number; speed: number };

// Biaya per tier; indeks array = tier - 1 (tier mulai 1).
export type TierCosts = CostItem[][];

// amount = biaya per bintang; amount × advanceMax = biaya penuh satu stage.
export type VillaStage = { stage: number; name: string; itemName: string; amount: number; advanceMax: number; sing: number; dance: number; management: number };

export type VillaSuite = { stage: number; suite: number; name: string; itemName: string; levelMax: number; amount: number; sing: number; dance: number; management: number };

export type VillaStaff = { id: number; name: string; staffType: number; tier: number; itemName: string; amount: number };

// Stat staf vila per level (CVillaStaffLevel); nilai = tambahan per level.
export type VillaStaffStat = { tier: number; staffType: number; level: number; sing: number; dance: number; management: number };

export type CeoStage = { stage: number; name: string; itemName: string; amount: number; advanceMax: number; sing: number; dance: number; management: number };

export type CeoOutfit = { stage: number; outfit: number; name: string; itemName: string; levelMax: number; amount: number; sing: number; dance: number; management: number };

// Stat olahraga CEO per level (CCeoAppearanceSportsLevel); nilai = tambahan per level.
export type CeoSportStat = { tier: number; sportsType: number; level: number; sing: number; dance: number; management: number };

// Jenis olahraga CEO (CCeoAppearanceSports); amount = biaya rekrut per jenis.
export type CeoSport = { id: number; name: string; sportsType: number; tier: number; itemName: string; amount: number };

// Zona ruang koleksi (CCollectDispatchCollectionZone).
export type CollectionZone = { zone: number; name: string; icon: string; genre: string };

// Buff flat per peak level (CPeakLevelPositionBoost); stat = peak level × nilai.
export type PeakPositionBoost = { generation: number; position: number; sing: number; dance: number; management: number };

// Persen global per ambang peak level (CPeakLevelStageBoost); nilai mentah /100.
export type PeakStageBoost = { stageLevel: number; attributeType: number; allPercent: number; stylePercent: number };

// Item koleksi ruang pamer; rarity 2/3/4 = R/SR/SSR, biaya per level pakai permata sesuai rarity.
export type CollectionItem = { id: number; zone: number; name: string; rarity: number; cost: CostItem };

export type ArtistCostBook = Pick<CostBook, "artists" | "curves" | "star" | "levelStars" | "peak">;

export type CostBook = {
  artists: { id: number; name: string; curve: number; generation: number | null; position: number | null; photoItem: number | null }[];
  // steps[level - 1] = EXP untuk naik ke level tersebut. Indeks 0 (level 1) bernilai 0.
  curves: number[][];
  // amounts[star] = jumlah item untuk naik dari star itu ke star + 1.
  star: { itemName: string; amounts: number[] };
  // levelStars[level - 1] = star minimal untuk level artis tersebut.
  levelStars: number[];
  parts: CarPart[];
  classes: CarClass[];
  partStats: CarPartStat[];
  modStats: CarModStat[];
  // classByLevel[level] = id kelas mod; 220 level, sama untuk keempat part.
  classByLevel: number[];
  costs: {
    // carPart[tier - 1] = biaya level; 3 slot di tier yang sama berbagi biaya.
    carPart: TierCosts;
    carMod: Record<number, CostItem[]>;
    carModClass: Record<number, CostItem[]>;
  };
  museum: TierCosts;
  // Buff persen museum per (tier, level); tiap bagian menambah satu stat.
  museumStats: { tier: number; level: number; percent: number }[];
  hq: {
    // amounts[level - 1] = biaya naik ke level itu; sing/dance/management = total kumulatif level itu.
    curve: { itemName: string; amounts: number[]; sing: number[]; dance: number[]; management: number[] };
    rooms: { tier: number; slot: number; room: string; name: string }[];
    // roomCosts[tier - 1] = biaya level; 4 slot per tier berbagi biaya.
    roomCosts: TierCosts;
    // Stat dekorasi per tier + level; keempat slot berbagi nilai yang sama.
    roomStats: { tier: number; level: number; sing: number; dance: number; management: number }[];
    // Rencana renovasi lantai: dibayar sekali per kelas, bukan per slot ruangan.
    planItemIds: number[];
  };
  villa: {
    stages: VillaStage[];
    suites: VillaSuite[];
    staff: VillaStaff[];
    // staffCosts[tier - 1] = biaya level staf; 3 tipe staf berbagi biaya.
    staffCosts: TierCosts;
    staffStats: VillaStaffStat[];
  };
  collection: { stars: Record<number, CostItem[]>; items: CollectionItem[]; zones: CollectionZone[] };
  // Stat flat per level item koleksi; nilai = total kumulatif.
  collectionStats: { itemId: number; level: number; sing: number; dance: number; management: number }[];
  ceo: { stages: CeoStage[]; outfits: CeoOutfit[]; sports: CeoSport[]; sportCosts: TierCosts; sportStats: CeoSportStat[] };
  // Peak level: buff posisi (flat, per generasi) + persen ambang stage.
  peak: { positions: PeakPositionBoost[]; stages: PeakStageBoost[] };
};

type CurveRow = { artist_ids: number[]; steps: number[] };
type StarRow = { star: number; item_name: string; amount: number };
type LevelStarRow = { level: number; star: number };
type PartRow = { id: number; name: string; slot: CarPart["slot"]; tier: number };
type ClassRow = { id: number; name: string; star: number };
type CostScope = "car_part" | "car_mod" | "car_mod_class" | "collection_platform" | "collection_star";
type CostRow = { scope: CostScope; ref_id: number; item_id: number; item_name: string; amounts: Record<string, number> };
type TierCostRow = { tier: number; item_id: number; item_name: string; amounts: Record<string, number> };
type HqCurveRow = { amounts: number[]; item_name: string | null; sing: number[]; dance: number[]; management: number[] };
type HqRoomRow = { tier: number; slot: number; room: string; name: string };
type VillaStageRow = { stage: number; name: string; item_name: string; amount: number; advance_max: number; sing: number; dance: number; management: number };
// Relasi embed bisa berbentuk objek atau array tergantung tipe yang digenerate Supabase.
type StageRef = { stage: number } | { stage: number }[];
type VillaSuiteRow = { suite: number; name: string; item_name: string; level_max: number; amount: number; sing: number; dance: number; management: number; villa_stages: StageRef };
type VillaStaffRow = { id: number; name: string; staff_type: number; tier: number; item_name: string; amount: number };
type VillaStaffLevelRow = { level: number; sing: number; dance: number; management: number; villa_staff: { tier: number; staff_type: number } | { tier: number; staff_type: number }[] };
type CeoStageRow = { stage: number; name: string; item_name: string; amount: number; advance_max: number; sing: number; dance: number; management: number };
type CeoOutfitRow = { outfit: number; name: string; item_name: string; level_max: number; amount: number; sing: number; dance: number; management: number; ceo_appearance_stages: StageRef };
type CeoSportLevelRow = { level: number; sing: number; dance: number; management: number; ceo_appearance_sports: { tier: number; sports_type: number } | { tier: number; sports_type: number }[] };
type CeoSportRow = { id: number; name: string; sports_type: number; tier: number; item_name: string; amount: number };
type CollectionItemRow = { id: number; zone: number; name: string; rarity: number; gem_item: number; gem_name: string };
type CollectionZoneRow = { zone: number; name: string; icon: string; genre: string };
type MuseumLevelRow = { tier: number; level: number; percent: number };
type CollectionStatRow = { item_id: number; level: number; sing: number; dance: number; management: number };
type ArtistRow = { id: number; name: string; hero_generation: number | null; hero_position: number | null; photo_item: number | null };
type PeakPositionRow = { hero_generation: number; position: number; sing: number; dance: number; management: number };
type PeakStageRow = { stage_level: number; attribute_type: number; all_percent: number; style_percent: number };

const stageOf = (ref: StageRef) => (Array.isArray(ref) ? (ref[0]?.stage ?? 0) : ref.stage);
const first = <T>(ref: T | T[]) => (Array.isArray(ref) ? ref[0] : ref);

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

// Nama di DB bahasa Indonesia; terjemahkan seluruh label yang tampil.
function localizeBook(book: CostBook, locale: Locale): CostBook {
  if (locale === "id") return book;
  const n = (name: string) => localizedName(locale, name);
  const item = (cost: CostItem): CostItem => ({ ...cost, itemName: n(cost.itemName) });
  const items = (list: CostItem[]) => list.map(item);
  const tiers = (list: TierCosts) => list.map(items);
  const groups = (list: Record<number, CostItem[]>) =>
    Object.fromEntries(Object.entries(list).map(([key, value]) => [key, items(value)]));

  return {
    ...book,
    star: { ...book.star, itemName: n(book.star.itemName) },
    parts: book.parts.map((part) => ({ ...part, name: n(part.name) })),
    costs: {
      carPart: tiers(book.costs.carPart),
      carMod: groups(book.costs.carMod),
      carModClass: groups(book.costs.carModClass),
    },
    museum: tiers(book.museum),
    hq: {
      curve: { ...book.hq.curve, itemName: n(book.hq.curve.itemName) },
      rooms: book.hq.rooms.map((room) => ({ ...room, room: n(room.room), name: n(room.name) })),
      roomCosts: tiers(book.hq.roomCosts),
      roomStats: book.hq.roomStats,
      planItemIds: book.hq.planItemIds,
    },
    villa: {
      stages: book.villa.stages.map((stage) => ({ ...stage, name: n(stage.name), itemName: n(stage.itemName) })),
      suites: book.villa.suites.map((suite) => ({ ...suite, name: n(suite.name), itemName: n(suite.itemName) })),
      staff: book.villa.staff.map((member) => ({ ...member, name: n(member.name), itemName: n(member.itemName) })),
      staffCosts: tiers(book.villa.staffCosts),
      staffStats: book.villa.staffStats,
    },
    collection: {
      stars: groups(book.collection.stars),
      items: book.collection.items.map((collectionItem) => ({
        ...collectionItem,
        name: n(collectionItem.name),
        cost: item(collectionItem.cost),
      })),
      zones: book.collection.zones.map((zone) => ({ ...zone, name: n(zone.name) })),
    },
    ceo: {
      stages: book.ceo.stages.map((stage) => ({ ...stage, name: n(stage.name), itemName: n(stage.itemName) })),
      outfits: book.ceo.outfits.map((outfit) => ({ ...outfit, name: n(outfit.name), itemName: n(outfit.itemName) })),
      sports: book.ceo.sports.map((sport) => ({ ...sport, name: n(sport.name), itemName: n(sport.itemName) })),
      sportCosts: tiers(book.ceo.sportCosts),
      sportStats: book.ceo.sportStats,
    },
  };
}

export async function loadCostBook(locale: Locale): Promise<CostBook> {
  // Tabel biaya upgrade hanya untuk role authenticated; server memakai service_role.
  const supabase = adminClient();
  const [
    curves,
    stars,
    levelStars,
    artists,
    parts,
    partStats,
    classes,
    modStats,
    costs,
    museum,
    museumStats,
    hqCurve,
    hqRooms,
    hqRoomStats,
    hqRoomList,
    villaStages,
    villaSuites,
    villaStaff,
    villaStaffCosts,
    villaStaffLevels,
    ceoStages,
    ceoOutfits,
    ceoSports,
    ceoSportCosts,
    ceoSportLevels,
    collectionItems,
    collectionLevels,
    collectionZones,
    collectionStats,
    peakPositions,
    peakStages,
  ] = await Promise.all([
    supabase.from("artist_exp_curves").select("artist_ids, steps"),
    supabase.from("artist_star_curve").select("star, item_name, amount").order("star"),
    supabase.from("artist_level_stars").select("level, star").order("level"),
    supabase.from("artists").select("id, name, hero_generation, hero_position, photo_item").order("name"),
    supabase.from("car_parts").select("id, name, slot, tier").order("slot").order("tier"),
    supabase.from("car_part_levels").select("part_id, level, sing, dance, management").order("part_id").order("level"),
    supabase.from("car_mod_classes").select("id, name, star").order("id"),
    supabase.from("car_mod_levels").select("part, level, class_id, sing, dance, management, fan, speed").order("part").order("level"),
    supabase.from("game_cost_items").select("scope, ref_id, item_id, item_name, amounts"),
    supabase.from("museum_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("museum_levels").select("tier, level, percent").order("tier").order("level"),
    supabase.from("headquarters_level_curve").select("amounts, item_name, sing, dance, management").single(),
    supabase.from("headquarters_room_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("headquarters_room_levels").select("tier, level, sing, dance, management").order("tier").order("level"),
    supabase.from("headquarters_rooms").select("tier, slot, room, name").order("tier").order("slot"),
    supabase.from("villa_stages").select("stage, name, item_name, amount, advance_max, sing, dance, management").order("stage"),
    supabase.from("villa_suites").select("suite, name, item_name, level_max, amount, sing, dance, management, villa_stages!inner(stage)").order("id"),
    supabase.from("villa_staff").select("id, name, staff_type, tier, item_name, amount").order("id"),
    supabase.from("villa_staff_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("villa_staff_levels").select("level, sing, dance, management, villa_staff!inner(tier, staff_type)").order("level"),
    supabase.from("ceo_appearance_stages").select("stage, name, item_name, amount, advance_max, sing, dance, management").order("stage"),
    supabase.from("ceo_appearance_outfits").select("outfit, name, item_name, level_max, amount, sing, dance, management, ceo_appearance_stages!inner(stage)").order("id"),
    supabase.from("ceo_appearance_sports").select("id, name, sports_type, tier, item_name, amount").order("id"),
    supabase.from("ceo_sport_cost_items").select("tier, item_id, item_name, amounts").order("tier"),
    supabase.from("ceo_appearance_sport_levels").select("level, sing, dance, management, ceo_appearance_sports!inner(tier, sports_type)").order("level"),
    supabase.from("collection_items").select("id, zone, name, rarity, gem_item, gem_name").order("id"),
    supabase.from("collection_levels").select("level, amount").order("level"),
    supabase.from("collection_zones").select("zone, name, icon, genre").order("zone"),
    supabase.from("collection_item_levels").select("item_id, level, sing, dance, management").order("item_id").order("level"),
    supabase.from("peak_position_boosts").select("hero_generation, position, sing, dance, management").order("hero_generation").order("position"),
    supabase.from("peak_stage_boosts").select("stage_level, attribute_type, all_percent, style_percent").order("stage_level"),
  ]);

  if (curves.error) fail("kurva EXP", curves.error.message);
  if (stars.error) fail("biaya star", stars.error.message);
  if (levelStars.error) fail("syarat star per level", levelStars.error.message);
  if (artists.error) fail("artis", artists.error.message);
  if (parts.error) fail("komponen mobil", parts.error.message);
  if (partStats.error) fail("stat komponen mobil", partStats.error.message);
  if (classes.error) fail("kelas mod", classes.error.message);
  if (modStats.error) fail("level mod", modStats.error.message);
  if (costs.error) fail("biaya item", costs.error.message);
  if (museum.error) fail("biaya museum", museum.error.message);
  if (museumStats.error) fail("stat museum", museumStats.error.message);
  if (hqCurve.error) fail("kurva markas", hqCurve.error.message);
  if (hqRooms.error) fail("biaya ruangan markas", hqRooms.error.message);
  if (hqRoomStats.error) fail("stat ruangan markas", hqRoomStats.error.message);
  if (hqRoomList.error) fail("daftar ruangan markas", hqRoomList.error.message);
  if (villaStages.error) fail("stage vila", villaStages.error.message);
  if (villaSuites.error) fail("suite vila", villaSuites.error.message);
  if (villaStaff.error) fail("staf vila", villaStaff.error.message);
  if (villaStaffCosts.error) fail("biaya level staf vila", villaStaffCosts.error.message);
  if (villaStaffLevels.error) fail("stat staf vila", villaStaffLevels.error.message);
  if (ceoStages.error) fail("stage penampilan CEO", ceoStages.error.message);
  if (ceoOutfits.error) fail("outfit penampilan CEO", ceoOutfits.error.message);
  if (ceoSports.error) fail("olahraga CEO", ceoSports.error.message);
  if (ceoSportCosts.error) fail("biaya olahraga CEO", ceoSportCosts.error.message);
  if (ceoSportLevels.error) fail("stat olahraga CEO", ceoSportLevels.error.message);
  if (collectionItems.error) fail("item koleksi", collectionItems.error.message);
  if (collectionLevels.error) fail("biaya level koleksi", collectionLevels.error.message);
  if (collectionZones.error) fail("zona koleksi", collectionZones.error.message);
  if (collectionStats.error) fail("stat item koleksi", collectionStats.error.message);
  if (peakPositions.error) fail("buff posisi peak level", peakPositions.error.message);
  if (peakStages.error) fail("buff stage peak level", peakStages.error.message);

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

  const partRows: CarPartStat[] = (partStats.data as { part_id: number; level: number; sing: number; dance: number; management: number }[]).map((r) => ({
    partId: r.part_id,
    level: r.level,
    sing: r.sing,
    dance: r.dance,
    management: r.management,
  }));

  const modRows: CarModStat[] = (modStats.data as (Omit<CarModStat, "classId"> & { class_id: number })[]).map((r) => ({
    part: r.part,
    level: r.level,
    classId: r.class_id,
    sing: r.sing,
    dance: r.dance,
    management: r.management,
    fan: r.fan,
    speed: r.speed,
  }));

  const book: CostBook = {
    artists: (artists.data as ArtistRow[])
      .filter((a) => curveOf.has(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        curve: curveOf.get(a.id)!,
        generation: a.hero_generation,
        position: a.hero_position,
        photoItem: a.photo_item,
      })),
    curves: curveRows.map((r) => r.steps),
    star: { itemName: starRows[0]?.item_name ?? "", amounts: starAmounts },
    levelStars: levelStarRows,
    parts: parts.data as PartRow[],
    partStats: partRows,
    modStats: modRows,
    classes: (classes.data as ClassRow[]).map((c) => ({ id: c.id, name: c.name, star: c.star })),
    classByLevel: modRows.filter((r) => r.part === 0).map((r) => r.classId),
    costs: { carPart: [], carMod: {}, carModClass: {} },
    museum: byTier(museum.data as TierCostRow[]),
    museumStats: (museumStats.data as MuseumLevelRow[]).map((r) => ({
      tier: r.tier,
      level: r.level,
      percent: r.percent,
    })),
    hq: {
      curve: {
        itemName: (hqCurve.data as HqCurveRow).item_name ?? "",
        amounts: (hqCurve.data as HqCurveRow).amounts.map(Number),
        sing: (hqCurve.data as HqCurveRow).sing.map(Number),
        dance: (hqCurve.data as HqCurveRow).dance.map(Number),
        management: (hqCurve.data as HqCurveRow).management.map(Number),
      },
      rooms: hqRoomList.data as HqRoomRow[],
      roomCosts: byTier(hqRooms.data as TierCostRow[]),
      roomStats: (hqRoomStats.data as { tier: number; level: number; sing: number; dance: number; management: number }[]).map((r) => ({
        tier: r.tier,
        level: r.level,
        sing: r.sing,
        dance: r.dance,
        management: r.management,
      })),
      planItemIds: (hqRooms.data as TierCostRow[])
        .filter((row) => Object.keys(row.amounts).length === 1 && row.amounts["1"] !== undefined)
        .map((row) => row.item_id),
    },
    villa: {
      stages: (villaStages.data as VillaStageRow[]).map((r) => ({
        stage: r.stage,
        name: r.name,
        itemName: r.item_name,
        amount: Number(r.amount),
        advanceMax: r.advance_max,
        sing: r.sing,
        dance: r.dance,
        management: r.management,
      })),
      suites: (villaSuites.data as VillaSuiteRow[]).map((r) => ({
        stage: stageOf(r.villa_stages),
        suite: r.suite,
        name: r.name,
        itemName: r.item_name,
        levelMax: r.level_max,
        amount: Number(r.amount),
        sing: r.sing,
        dance: r.dance,
        management: r.management,
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
      staffStats: (villaStaffLevels.data as VillaStaffLevelRow[]).flatMap((r) => {
        const ref = first(r.villa_staff);
        return ref
          ? [{ tier: ref.tier, staffType: ref.staff_type, level: r.level, sing: r.sing, dance: r.dance, management: r.management }]
          : [];
      }),
    },
    collection: {
      stars: {},
      items: (collectionItems.data as CollectionItemRow[]).map((r) => ({
        id: r.id,
        zone: r.zone,
        name: r.name,
        rarity: r.rarity,
        cost: { itemId: r.gem_item, itemName: r.gem_name, amounts: collectionAmounts },
      })),
      zones: collectionZones.data as CollectionZoneRow[],
    },
    collectionStats: (collectionStats.data as CollectionStatRow[]).map((r) => ({
      itemId: r.item_id,
      level: r.level,
      sing: r.sing,
      dance: r.dance,
      management: r.management,
    })),
    ceo: {
      stages: (ceoStages.data as CeoStageRow[]).map((r) => ({
        stage: r.stage,
        name: r.name,
        itemName: r.item_name,
        amount: Number(r.amount),
        advanceMax: r.advance_max,
        sing: r.sing,
        dance: r.dance,
        management: r.management,
      })),
      outfits: (ceoOutfits.data as CeoOutfitRow[]).map((r) => ({
        stage: stageOf(r.ceo_appearance_stages),
        outfit: r.outfit,
        name: r.name,
        itemName: r.item_name,
        levelMax: r.level_max,
        amount: Number(r.amount),
        sing: r.sing,
        dance: r.dance,
        management: r.management,
      })),
      sportCosts: byTier(ceoSportCosts.data as TierCostRow[]),
      sports: (ceoSports.data as CeoSportRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        sportsType: r.sports_type,
        tier: r.tier,
        itemName: r.item_name,
        amount: Number(r.amount),
      })),
      sportStats: (ceoSportLevels.data as CeoSportLevelRow[]).flatMap((r) => {
        const ref = first(r.ceo_appearance_sports);
        return ref
          ? [{ tier: ref.tier, sportsType: ref.sports_type, level: r.level, sing: r.sing, dance: r.dance, management: r.management }]
          : [];
      }),
    },
    peak: {
      positions: (peakPositions.data as PeakPositionRow[]).map((r) => ({
        generation: r.hero_generation,
        position: r.position,
        sing: r.sing,
        dance: r.dance,
        management: r.management,
      })),
      stages: (peakStages.data as PeakStageRow[]).map((r) => ({
        stageLevel: r.stage_level,
        attributeType: r.attribute_type,
        allPercent: r.all_percent,
        stylePercent: r.style_percent,
      })),
    },
  };

  for (const row of costs.data as CostRow[]) {
    // Biaya level mod kunci 0 = biaya naik dari level 0 ke 1; geser +1 supaya
    // amounts[level] = biaya menuju level itu (sama seperti tabel biaya lain).
    const amounts = row.scope === "car_mod"
      ? Object.fromEntries(Object.entries(row.amounts).map(([level, amount]) => [String(Number(level) + 1), amount]))
      : row.amounts;
    const item = { itemId: row.item_id, itemName: row.item_name, amounts };
    if (row.scope === "collection_platform") continue;
    if (row.scope === "collection_star") (book.collection.stars[row.ref_id] ??= []).push(item);
    else if (row.scope === "car_part") {
      // Biaya identik untuk 3 slot; simpan sekali per tier.
      const tier = book.parts.find((part) => part.id === row.ref_id)?.tier;
      if (tier) {
        const tierItems = (book.costs.carPart[tier - 1] ??= []);
        if (!tierItems.some((existing) => existing.itemId === item.itemId)) tierItems.push(item);
      }
    } else {
      const target = row.scope === "car_mod" ? book.costs.carMod : book.costs.carModClass;
      (target[row.ref_id] ??= []).push(item);
    }
  }

  return localizeBook(book, locale);
}

// Data config game hampir statis; cache satu jam per locale supaya query view tidak diulang tiap request.
export const getCostBook = cache(unstable_cache(loadCostBook, ["cost-book"], { revalidate: 3600 }));

export async function loadArtistCostBook(locale: Locale): Promise<ArtistCostBook> {
  const supabase = adminClient();
  const [curves, stars, levelStars, artists, positions, stages] = await Promise.all([
    supabase.from("artist_exp_curves").select("artist_ids, steps"),
    supabase.from("artist_star_curve").select("star, item_name, amount").order("star"),
    supabase.from("artist_level_stars").select("level, star").order("level"),
    supabase.from("artists").select("id, name, hero_generation, hero_position, photo_item").order("name"),
    supabase.from("peak_position_boosts").select("hero_generation, position, sing, dance, management").order("hero_generation").order("position"),
    supabase.from("peak_stage_boosts").select("stage_level, attribute_type, all_percent, style_percent").order("stage_level"),
  ]);
  for (const [name, result] of [["kurva EXP", curves], ["biaya star", stars], ["syarat star", levelStars], ["artis", artists], ["peak posisi", positions], ["peak stage", stages]] as const) if (result.error) fail(name, result.error.message);
  const curveRows = (curves.data as CurveRow[]).map((row) => ({ artistIds: row.artist_ids, steps: row.steps.map(Number) }));
  const curveOf = new Map<number, number>();
  curveRows.forEach((row, index) => row.artistIds.forEach((id) => curveOf.set(id, index)));
  const amounts: number[] = [];
  const starRows = stars.data as StarRow[];
  starRows.forEach((row) => { amounts[row.star] = Number(row.amount); });
  const requiredStars: number[] = [];
  for (const row of levelStars.data as LevelStarRow[]) requiredStars[row.level - 1] = row.star;
  return {
    artists: (artists.data as ArtistRow[]).flatMap((artist) => {
      const curve = curveOf.get(artist.id);
      return curve === undefined ? [] : [{ id: artist.id, name: artist.name, curve, generation: artist.hero_generation, position: artist.hero_position, photoItem: artist.photo_item }];
    }),
    curves: curveRows.map((row) => row.steps),
    star: { itemName: localizedName(locale, starRows[0]?.item_name ?? ""), amounts },
    levelStars: requiredStars,
    peak: {
      positions: (positions.data as PeakPositionRow[]).map((row) => ({ generation: row.hero_generation, position: row.position, sing: row.sing, dance: row.dance, management: row.management })),
      stages: (stages.data as PeakStageRow[]).map((row) => ({ stageLevel: row.stage_level, attributeType: row.attribute_type, allPercent: row.all_percent, stylePercent: row.style_percent })),
    },
  };
}

export const getArtistCostBook = cache(unstable_cache(loadArtistCostBook, ["artist-cost-book"], { revalidate: 3600 }));

// Adapter UI sementara: hanya membentuk bagian private kosong, tanpa membaca data private.
export function artistCostBook(book: ArtistCostBook): CostBook {
  return { ...book, parts: [], classes: [], partStats: [], modStats: [], classByLevel: [], costs: { carPart: [], carMod: {}, carModClass: {} }, museum: [], museumStats: [], hq: { curve: { itemName: "", amounts: [], sing: [], dance: [], management: [] }, rooms: [], roomCosts: [], roomStats: [], planItemIds: [] }, villa: { stages: [], suites: [], staff: [], staffCosts: [], staffStats: [] }, collection: { stars: {}, items: [], zones: [] }, collectionStats: [], ceo: { stages: [], outfits: [], sports: [], sportCosts: [], sportStats: [] } };
}
