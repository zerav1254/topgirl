// Peta item_id game -> ikon di public/assets/images/upgrades.
// id/nama diambil dari items.json + LcName di .topgirl-ripper/work/upgrades.
// Item tanpa ikon hasil ekstraksi tampil tanpa gambar.
// ponytail: ikon item masih ditarik dari repo (hak cipta aset game), backup di
// assets-backup/upgrades/ (gitignored); hanya ikon tab menu yang dipulihkan.
// Pulihkan item = mv kembali + render lewat git log sebelum commit pembersihan.
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
  // Rencana/cetak biru renovasi lantai markas (biaya sekali per kelas).
  // Ikon t21/t31 = varian aset untuk Asrama/Gym; t4 = Ruang Editing.
  11118697: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t1.webp`,
  11118698: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t21.webp`,
  11118699: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t31.webp`,
  11118700: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t4.webp`,
  11118701: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t5.webp`,
  11118702: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t6.webp`,
  11118776: `${ROOT}/renovasi/UI_Decoration_Floor_MergeEquip_t7.webp`,
  // Bintang koleksi
  11116601: `${ROOT}/koleksi/UI_Collection_Icon_UpgradeProps_01.webp`,
  // Bahan peningkatan koleksi (lempeng batu + parket, beda dari batu pasir museum)
  11117206: `${ROOT}/koleksi/UI_Icon_collect_daoju2.webp`,
  11117207: `${ROOT}/koleksi/UI_Icon_collect_daoju3.webp`,
  // Permata koleksi per rarity: Langka, Sangat Langka, Legendaris
  11119021: `${ROOT}/koleksi/UI_Collection_Icon_UpgradeProps_01.webp`,
  11119022: `${ROOT}/koleksi/UI_Collection_Icon_UpgradeProps_02.webp`,
  11119023: `${ROOT}/koleksi/UI_Collection_Icon_UpgradeProps_03.webp`,
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

// Pratinjau bangunan vila per stage (1-8); stage 9-10 memakai gambar stage 8.
export const villaStageIcon = (stage: number) =>
  `${ROOT}/villa/UI_Icon_villa_base${Math.min(Math.max(stage, 1), 8)}.webp`;

// Pratinjau suite vila: 4 lokasi (Ruang Tamu, Ruang Anggur, Infinity Pool,
// Halaman) x 8 tahap bangunan. Stage 9-10 memakai gambar tahap 8.
export const villaSuiteIcon = (suite: number, stage: number) =>
  `${ROOT}/villa/UI_Icon_base_location${suite}_stage${Math.min(Math.max(stage, 1), 8)}.webp`;

// Ikon komponen mobil (Setir, Chip/ECU, Sistem Suara) per tier 1-7.
const CAR_PART_ASSET = { steering: "SteeringWheel", chip: "ECU", sound: "CarAudio" } as const;

export const carPartIcon = (slot: keyof typeof CAR_PART_ASSET, tier: number) =>
  `${ROOT}/mobil/UI_Icon_Vehicle_${CAR_PART_ASSET[slot]}_${String(Math.min(Math.max(tier, 1), 7)).padStart(2, "0")}.webp`;

// Ikon mod mobil: 4 part (Mesin, Sasis, Suspensi, Velg) x 6 tampilan.
// Config game berganti gambar per rentang level kelas: 0-1, 2-5, 6-14, 15-34, 35-64, 65+.
const CAR_MOD_ASSET = ["Engine", "CarFrame", "Chassis", "Wheel"] as const;
const CAR_MOD_LEVEL_EDGES = [2, 6, 15, 35, 65];

export const carModIcon = (part: number, level: number) =>
  `${ROOT}/mobil/UI_Icon_Vehicle_${CAR_MOD_ASSET[part] ?? CAR_MOD_ASSET[0]}_${String(
    CAR_MOD_LEVEL_EDGES.filter((edge) => level >= edge).length + 1,
  ).padStart(2, "0")}.webp`;

// Ikon 30 item koleksi ruang pamer (collection_53010101..53010506).
export const collectionIcon = (id: number) => `${ROOT}/koleksi/collection_${id}.webp`;

// Latar kartu item sesuai rarity (Quality): 2 = R, 3 = SR, 4 = SSR.
export const collectionRarityBg = (rarity: number) =>
  `${ROOT}/koleksi/UI_Item_Bg0${rarity >= 2 && rarity <= 4 ? rarity : 2}.webp`;

// Peta + ikon area ruang koleksi.
export const collectionZoneIcon = (icon: string, active = false) => `${ROOT}/koleksi/${icon}${active ? "_a" : ""}.webp`;

// Ikon tombol tab kalkulator: tab artis memakai glyph bottom nav (.artist-glyph),
// sisanya badge UI_Item_Tag_Icon game (markas, vila, mobil, koleksi, CEO).
const TAB_ICONS: Record<string, string> = { car: "car", hq: "hq", villa: "villa", collection: "collection", ceo: "ceo" };
export const tabIcon = (tab: string) => (TAB_ICONS[tab] ? `${ROOT}/menu/${TAB_ICONS[tab]}.webp` : null);
