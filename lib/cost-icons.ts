// Peta item_id game -> ikon di public/assets/images/upgrades.
// id/nama diambil dari items.json + LcName di .topgirl-ripper/work/upgrades.
// Item tanpa ikon hasil ekstraksi tampil tanpa gambar.
const ROOT = "/assets/images/upgrades";

const ICONS: Record<number, string> = {
  // Komponen mobil (nama aset game tertukar: Busi = IgnitionCoil, Koil = SparkPlug)
  11118110: `${ROOT}/mobil/UI_Icon_Vehicle_IgnitionCoil_01.webp`,
  11118111: `${ROOT}/mobil/UI_Icon_Vehicle_IgnitionCoil_02.webp`,
  11118112: `${ROOT}/mobil/UI_Icon_Vehicle_IgnitionCoil_03.webp`,
  11118121: `${ROOT}/mobil/UI_Icon_Vehicle_SparkPlug_01.webp`,
  11118122: `${ROOT}/mobil/UI_Icon_Vehicle_SparkPlug_02.webp`,
  11118123: `${ROOT}/mobil/UI_Icon_Vehicle_SparkPlug_03.webp`,
  // Mod mobil
  11119017: `${ROOT}/mobil/UI_Icon_Vehicle_Gears_01.webp`,
  11119018: `${ROOT}/mobil/UI_Icon_Vehicle_Graph_01.webp`,
  // Renovasi markas: kayu 1-5, baja 6-10, kaca 11
  11118686: `${ROOT}/renovasi/UI_Item_HB_levelup_item1.webp`,
  11118687: `${ROOT}/renovasi/UI_Item_HB_levelup_item2.webp`,
  11118688: `${ROOT}/renovasi/UI_Item_HB_levelup_item3.webp`,
  11118689: `${ROOT}/renovasi/UI_Item_HB_levelup_item4.webp`,
  11118690: `${ROOT}/renovasi/UI_Item_HB_levelup_item5.webp`,
  11118691: `${ROOT}/renovasi/UI_Item_HB_levelup_item6.webp`,
  11118692: `${ROOT}/renovasi/UI_Item_HB_levelup_item7.webp`,
  11118693: `${ROOT}/renovasi/UI_Item_HB_levelup_item8.webp`,
  11118694: `${ROOT}/renovasi/UI_Item_HB_levelup_item9.webp`,
  11118695: `${ROOT}/renovasi/UI_Item_HB_levelup_item10.webp`,
  11118696: `${ROOT}/renovasi/UI_Item_HB_levelup_item11.webp`,
  // Bintang koleksi
  11116601: `${ROOT}/koleksi/UI_Collection_Icon_UpgradeProps_01.webp`,
  // Bahan peningkatan koleksi
  11117206: `${ROOT}/koleksi/UI_Item_Sandstone_1.webp`,
  11117207: `${ROOT}/koleksi/UI_Item_Tile_1.webp`,
  // Museum: batu pasir 1-4, ubin 1-4, rencana konstruksi T01-T07
  11118714: `${ROOT}/koleksi/UI_Item_Sandstone_1.webp`,
  11118715: `${ROOT}/koleksi/UI_Item_Sandstone_2.webp`,
  11118716: `${ROOT}/koleksi/UI_Item_Sandstone_3.webp`,
  11118717: `${ROOT}/koleksi/UI_Item_Sandstone_4.webp`,
  11118719: `${ROOT}/koleksi/UI_Item_Tile_1.webp`,
  11118720: `${ROOT}/koleksi/UI_Item_Tile_2.webp`,
  11118721: `${ROOT}/koleksi/UI_Item_Tile_3.webp`,
  11118722: `${ROOT}/koleksi/UI_Item_Tile_4.webp`,
  // CEO
  11113623: `${ROOT}/ceo/UI_Icon_CEO_EnergyDrink_01.webp`,
  11113624: `${ROOT}/ceo/UI_Icon_CEO_EnergyDrink_02.webp`,
  11113628: `${ROOT}/ceo/UI_Icon_CEO_ProteinBar_01.webp`,
  11113629: `${ROOT}/ceo/UI_Icon_CEO_ProteinBar_02.webp`,
  // Vila: koin CEO 1-5, kunci vila 6-10
  11118761: `${ROOT}/villa/UI_Item_villa_staff_levelup1.webp`,
  11118762: `${ROOT}/villa/UI_Item_villa_staff_levelup2.webp`,
  11118763: `${ROOT}/villa/UI_Item_villa_staff_levelup3.webp`,
  11118764: `${ROOT}/villa/UI_Item_villa_staff_levelup4.webp`,
  11118765: `${ROOT}/villa/UI_Item_villa_staff_levelup5.webp`,
  11118766: `${ROOT}/villa/UI_Item_villa_staff_levelup6.webp`,
  11118767: `${ROOT}/villa/UI_Item_villa_staff_levelup7.webp`,
  11118768: `${ROOT}/villa/UI_Item_villa_staff_levelup8.webp`,
  11118769: `${ROOT}/villa/UI_Item_villa_staff_levelup9.webp`,
  11118770: `${ROOT}/villa/UI_Item_villa_staff_levelup10.webp`,
};

// Tabel kurva / rekrutmen tidak menyimpan item_id; cocokkan lewat nama.
const NAMES: Record<string, string> = {
  "Kartu debit": `${ROOT}/ceo/UI_Icon_CEO_BankCard_01.webp`,
  "Kartu mahkota": `${ROOT}/ceo/UI_Icon_CEO_BankCard_02.webp`,
  Kaca: `${ROOT}/renovasi/UI_Item_HB_levelup_item11.webp`,
  "Draf desain vila": `${ROOT}/villa/UI_Item_villa_advance_item.webp`,
  "Drone konstruksi": `${ROOT}/villa/UI_Item_villa_levelup_item.webp`,
  "Medali CEO (T2)": `${ROOT}/villa/UI_Item_villa_staff_item_T02.webp`,
  "Medali CEO (T3)": `${ROOT}/villa/UI_Item_villa_staff_item_T03.webp`,
  "Medali CEO (T4)": `${ROOT}/villa/UI_Item_villa_staff_item_T04.webp`,
  "Medali CEO (T5)": `${ROOT}/villa/UI_Item_villa_staff_item_T05.webp`,
  "Medali CEO (T6)": `${ROOT}/villa/UI_Item_villa_staff_item_T06.webp`,
  "Medali CEO (T7)": `${ROOT}/villa/UI_Item_villa_staff_item_T07.webp`,
};

export const costIcon = (itemId?: number, name?: string) =>
  (itemId === undefined ? undefined : ICONS[itemId]) ?? (name ? NAMES[name] : undefined);

// Ikon komponen mobil per slot + tier (tier 1-7 = D, C, B, A, A+, S, S+).
const CAR_PART_ASSET = { steering: "SteeringWheel", chip: "ECU", sound: "CarAudio" } as const;

export const carPartIcon = (slot: keyof typeof CAR_PART_ASSET, tier: number) =>
  `${ROOT}/mobil/UI_Icon_Vehicle_${CAR_PART_ASSET[slot]}_${String(tier).padStart(2, "0")}.webp`;

// Ikon mod mobil: 4 part (Mesin, Sasis, Suspensi, Velg) x 6 tampilan.
// Config game berganti gambar per rentang level kelas: 0-1, 2-5, 6-14, 15-34, 35-64, 65+.
const CAR_MOD_ASSET = ["Engine", "CarFrame", "Chassis", "Wheel"] as const;
const CAR_MOD_LEVEL_EDGES = [2, 6, 15, 35, 65];

export const carModIcon = (part: number, level: number) =>
  `${ROOT}/mobil/UI_Icon_Vehicle_${CAR_MOD_ASSET[part] ?? CAR_MOD_ASSET[0]}_${String(
    CAR_MOD_LEVEL_EDGES.filter((edge) => level >= edge).length + 1,
  ).padStart(2, "0")}.webp`;

// Platform koleksi (booth showroom): 7 slot pertama; slot 8-9 belum rilis di game.
export const COLLECTION_PLATFORMS = 7;

export const collectionPlatformIcon = (index: number) =>
  `${ROOT}/koleksi/UI_Item_Construction_Plans_${Math.min(index + 1, COLLECTION_PLATFORMS)}.webp`;
