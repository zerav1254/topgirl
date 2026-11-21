import assert from "node:assert/strict";
import { loadArtists } from "../lib/artists.ts";

const artists = await loadArtists();
assert.equal(artists.length, 92, "expected 92 artists");
assert.equal(new Set(artists.map((a) => a.slug)).size, 92, "slugs must be unique");

const byName = new Map(artists.map((a) => [a.name, a]));
for (const name of ["Monica", "Longkui", "Kasha", "Dewi"]) {
  assert.ok(byName.get(name).score >= 85, `${name} should be S+`);
  assert.equal(byName.get(name).tier, "S+");
}
for (const name of ["Ayaka", "Moana"]) {
  assert.equal(byName.get(name).tier, "D", `${name} defense-only falls to D`);
}
for (const a of artists) {
  assert.ok(a.score >= 0 && a.score <= 100, `${a.name} score out of range`);
  assert.ok(["S+", "S", "A", "B", "C", "D"].includes(a.tier), `${a.name} bad tier`);
}
console.log("score-check ok:", artists.length, "artists");
