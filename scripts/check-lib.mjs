import assert from "node:assert/strict";
import { classLevels, expBetween, modTotals, peakStageBetween, stagePromotionCost, starBetween, starCardsForLevels, statDelta, statSum, sumLevels } from "../lib/cost-calc.ts";
import { poolTiers } from "../lib/pool.ts";
import { genreSynergy, lineupEffects, teamFanCap, withGenreBonus } from "../lib/team.ts";
import { allow } from "../lib/rate-limit.ts";
import { safeNextPath } from "../lib/redirect.ts";
import { localizedName } from "../lib/cost-names.ts";

// Nama item DB diterjemahkan per locale; locale id dan nama tak dikenal apa adanya.
assert.equal(localizedName("id", "Kayu Dasar"), "Kayu Dasar");
assert.equal(localizedName("en", "Kayu Dasar"), "Wood (Basic)");
assert.equal(localizedName("ja", "Kayu Dasar"), "木材（基本）");
assert.equal(localizedName("en", "Nama Tak Dikenal"), "Nama Tak Dikenal");

// Redirect OAuth hanya boleh ke path internal.
for (const bad of ["", "//evil.com", "/\\evil.com", "https://evil.com", "/id\n/x"]) {
  assert.equal(safeNextPath(bad, "/id"), "/id", `next path ${JSON.stringify(bad)} harus ditolak`);
}
assert.equal(safeNextPath("/id/profile", "/id"), "/id/profile");

// Pool sangat kecil memakai tier absolut, bukan kuota relatif.
const one = [{ slug: "a", name: "A", season: null, genre: "Pop", score: 90, tier: "S+" }];
assert.equal(poolTiers(one, { season: 1 }).get("a"), "S+", "pool 1 artis skor 90 harus S+");

// Limiter menolak setelah batas tercapai.
const key = `test:${Date.now()}`;
assert.equal(allow(key, 2, 60_000), true);
assert.equal(allow(key, 2, 60_000), true);
assert.equal(allow(key, 2, 60_000), false);

// Sinergi genre: 3/4/5 artis genre sama = +10/+15/+25% Menyanyi & Menari.
assert.equal(genreSynergy([{ genre: "Pop" }, { genre: "Pop" }, { genre: "Pop" }]).bonus, 10);
assert.equal(genreSynergy([{ genre: "Pop" }, { genre: "Pop" }, { genre: "Pop" }, { genre: "Pop" }]).bonus, 15);
assert.equal(withGenreBonus(100_000, 25), 125_000);
assert.equal(withGenreBonus(100_001, 10), 110_001);

// Total fans tim: basis semua artis + bonus persen dari skill "fan".
assert.deepEqual(
  teamFanCap([
    { fanCap: 202_000, skills: [{ effect: "fan", value: 10 }] },
    { fanCap: 202_000, skills: [{ effect: "fan", value: 5 }] },
  ]),
  { base: 404_000, pct: 15, total: 464_600 },
);

// Tag lineup: efek dihitung sekali per artis, urut jumlah lalu urutan stat.
assert.deepEqual(
  lineupEffects([
    { skills: [{ effect: "player_dmg", value: 10 }, { effect: "fan", value: 5 }, { effect: "fan", value: 5 }] },
    { skills: [{ effect: "fan", value: 5 }] },
  ]),
  [
    { effect: "fan", count: 2 },
    { effect: "player_dmg", count: 1 },
  ],
);

// Kalkulator biaya: rentang level/star dijumlahkan, biaya kelas mod ditagih sekali per naik kelas.
assert.equal(expBetween([0, 120, 120], 1, 3), 240);
// Promosi stage: amount per bintang × advanceMax; stage A -> B pakai baris A..B-1.
const stages = [
  { amount: 200, advanceMax: 1 },
  { amount: 400, advanceMax: 1 },
  { amount: 600, advanceMax: 2 },
];
assert.equal(stagePromotionCost(stages, 0, 2), 200);
assert.equal(stagePromotionCost(stages, 1, 3), 600);
assert.equal(stagePromotionCost(stages, 2, 2), 0);
assert.equal(starBetween([20, 20, 80], 0, 2), 40);
// Kartu star turunan level: hanya star di antara batas level awal dan target.
assert.equal(starCardsForLevels([0, 0, 1, 1], [20, 20, 80], 1, 4), 20);
assert.equal(starCardsForLevels([0, 0, 1, 1], [20, 20, 80], 2, 4), 20);
assert.equal(starCardsForLevels([0, 0, 1, 1], [20, 20, 80], 1, 2), 0);
assert.deepEqual(sumLevels([{ itemId: 1, itemName: "Busi", amounts: { "2": 5, "3": 7 } }], 1, 3), [
  { itemId: 1, name: "Busi", amount: 12 },
]);
assert.deepEqual(
  modTotals({
    items: [{ itemId: 2, itemName: "Bagian", amounts: { "1": 10, "2": 20 } }],
    classCosts: { 2: [{ itemId: 3, itemName: "Gambar", amounts: { "0": 4 } }] },
    classByLevel: [1, 1, 2],
    from: 0,
    to: 2,
  }),
  [
    { itemId: 2, name: "Bagian", amount: 30 },
    { itemId: 3, name: "Gambar", amount: 4 },
  ],
);
// Semua 4 part: biaya level ikut ×4, biaya kelas tetap sekali.
assert.deepEqual(
  modTotals({
    items: [{ itemId: 2, itemName: "Bagian", amounts: { "1": 10, "2": 20 } }],
    classCosts: { 2: [{ itemId: 3, itemName: "Gambar", amounts: { "0": 4 } }] },
    classByLevel: [1, 1, 2],
    from: 0,
    to: 2,
    count: 4,
  }),
  [
    { itemId: 2, name: "Bagian", amount: 120 },
    { itemId: 3, name: "Gambar", amount: 4 },
  ],
);
// Stat mobil: komponen menyimpan total kumulatif (selisih target - awal),
// inti menyimpan tambahan per level (dijumlahkan dalam rentang).
assert.deepEqual(
  statDelta([{ level: 0, sing: 0, fan: 0 }, { level: 1, sing: 20, fan: 100 }, { level: 2, sing: 25, fan: 100 }], 1, 2),
  { sing: 5, dance: 0, management: 0, fan: 0, speed: 0 },
);
assert.deepEqual(
  statSum([{ level: 1, sing: 930 }, { level: 2, sing: 20 }, { level: 3, sing: 20 }], 1, 3),
  { sing: 40, dance: 0, management: 0, fan: 0, speed: 0 },
);
// Peak stage: ambang level, hanya baris di (from, to] yang dijumlahkan.
const peakStages = [
  { stageLevel: 5, attributeType: 1, allPercent: 50, stylePercent: 0 },
  { stageLevel: 40, attributeType: 1, allPercent: 0, stylePercent: 300 },
  { stageLevel: 80, attributeType: 4, allPercent: 0, stylePercent: 0 },
  { stageLevel: 100, attributeType: 2, allPercent: 150, stylePercent: 0 },
];
assert.deepEqual(peakStageBetween(peakStages, 0, 5), { sing: 50, dance: 0, management: 0, fan: 0, speed: 0 });
assert.deepEqual(peakStageBetween(peakStages, 5, 100), { sing: 300, dance: 150, management: 0, fan: 0, speed: 0 });
assert.deepEqual(peakStageBetween(peakStages, 100, 100), { sing: 0, dance: 0, management: 0, fan: 0, speed: 0 });
// Helper kelas: level hanya diketahui lewat kelas mod kendaraan.
const ranges = classLevels([1, 1, 1, 2, 2]);
assert.deepEqual(ranges.get(1), { from: 0, to: 2 });
assert.deepEqual(ranges.get(2), { from: 3, to: 4 });

console.log("check-lib ok");
