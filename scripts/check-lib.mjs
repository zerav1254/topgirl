import assert from "node:assert/strict";
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

console.log("check-lib ok");
