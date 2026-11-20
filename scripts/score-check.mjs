import assert from "node:assert/strict";
import { loadArtists } from "../lib/artists.ts";

const artists = loadArtists();
assert.equal(artists.length, 80, "expected 80 artists");

const byName = new Map(artists.map((a) => [a.name, a]));
for (const name of ["Monica", "Longkui", "Kasha", "Dewi"]) {
  assert.ok(byName.get(name).score >= 85, `${name} should be S+`);
  assert.equal(byName.get(name).tier, "S+");
}
for (const name of ["Ayaka", "Moana"]) {
  assert.equal(byName.get(name).tier, "D", `${name} defense-only falls to D`);
}
for (const a of artists) {
  assert.ok(a.skills.length > 0, `${a.name} has no skills`);
  assert.ok(a.score >= 0 && a.score <= 100, `${a.name} score out of range`);
}
console.log("score-check ok:", artists.length, "artists");
