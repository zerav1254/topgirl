import assert from "node:assert/strict";
import { loadArtists } from "../lib/artists.ts";
import { CATEGORIES, scoreArtist } from "../lib/score.ts";

const artists = await loadArtists();
assert.ok(artists.length >= 92, "expected at least 92 artists");
assert.equal(new Set(artists.map((a) => a.slug)).size, artists.length, "slugs must be unique");

const byName = new Map(artists.map((a) => [a.name, a]));
// Satu artist bisa beda tier per kategori; ini mengunci contoh yang disepakati.
assert.equal(byName.get("Monica").tiers.solo, "S+");
assert.equal(byName.get("Rhea").tiers.rally, "S+");
assert.equal(byName.get("Kesnia").tiers.economy, "S+");
for (const name of ["Ayaka", "Moana"]) {
  assert.equal(byName.get(name).tiers.solo, "D", `${name} tanpa efek SOLO harus D`);
}

const orders = {
  solo: ["player_dmg", "fan", "skill_dmg", "basic_atk"],
  rally: ["fan_rally", "player_dmg", "skill_dmg", "basic_atk"],
  defense: ["player_dmg", "basic_atk_red", "skill_dmg_red"],
  economy: ["gold", "drive"],
};
for (const [category, order] of Object.entries(orders)) {
  const scores = order.map((effect) => scoreArtist([{ effect, value: 20 }], category));
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i] < scores[i - 1], `priority ${category}: ${order[i]} must rank below ${order[i - 1]}`);
  }
}
for (const a of artists) {
  for (const category of CATEGORIES) {
    assert.ok(a.scores[category] >= 0 && a.scores[category] <= 100, `${a.name} ${category} score out of range`);
    assert.ok(["S+", "S", "A", "B", "C", "D"].includes(a.tiers[category]), `${a.name} ${category} bad tier`);
  }
}
console.log("score-check ok:", artists.length, "artists x", CATEGORIES.length, "categories");
