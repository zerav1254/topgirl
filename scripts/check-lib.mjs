import assert from "node:assert/strict";
import { expBetween, modTotals, starBetween, sumLevels } from "../lib/cost-calc.ts";
import { poolTiers } from "../lib/pool.ts";
import { allow } from "../lib/rate-limit.ts";
import { safeNextPath } from "../lib/redirect.ts";

// Redirect OAuth hanya boleh ke path internal.
for (const bad of ["", "//evil.com", "/\\evil.com", "https://evil.com", "/id\n/x"]) {
  assert.equal(safeNextPath(bad, "/id"), "/id", `next path ${JSON.stringify(bad)} harus ditolak`);
}
assert.equal(safeNextPath("/id/profile", "/id"), "/id/profile");

// Pool sangat kecil memakai tier absolut, bukan kuota relatif.
const scores = { solo: 90, rally: 0, defense: 0, economy: 0, global: 90, sustain: 0 };
const one = [{ slug: "a", name: "A", season: null, genre: "Pop", scores }];
assert.equal(poolTiers(one, { season: 1 }, "global").get("a"), "S+", "pool 1 artis skor 90 harus S+");

// Limiter menolak setelah batas tercapai.
const key = `test:${Date.now()}`;
assert.equal(allow(key, 2, 60_000), true);
assert.equal(allow(key, 2, 60_000), true);
assert.equal(allow(key, 2, 60_000), false);

// Kalkulator biaya: rentang level/star dijumlahkan, biaya kelas mod ditagih sekali per naik kelas.
assert.equal(expBetween([0, 120, 120], 1, 3), 240);
assert.equal(starBetween([20, 20, 80], 0, 2), 40);
assert.deepEqual(sumLevels([{ itemId: 1, itemName: "Busi", amounts: { "2": 5, "3": 7 } }], 1, 3), [
  { name: "Busi", amount: 12 },
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
    { name: "Bagian", amount: 30 },
    { name: "Gambar", amount: 4 },
  ],
);

console.log("check-lib ok");
