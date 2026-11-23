import assert from "node:assert/strict";
import { loadArtists } from "../lib/artists.ts";
import { CATEGORIES, scoreArtist } from "../lib/score.ts";

const artists = await loadArtists();
assert.ok(artists.length > 0, "expected at least one artist");
assert.equal(new Set(artists.map((a) => a.slug)).size, artists.length, "slugs must be unique");

const byName = new Map(artists.map((a) => [a.name, a]));
// Satu artist bisa beda tier per kategori; ini mengunci contoh yang disepakati.
assert.equal(byName.get("Monica").tiers.solo, "S+");
assert.equal(byName.get("Rhea").tiers.rally, "S+");
assert.equal(byName.get("Kesnia").tiers.economy, "S+");
const rallyCapped = artists.filter((a) => a.scores.rally >= 100);
assert.ok(rallyCapped.length <= 2, `RALLY terlalu banyak skor 100: ${rallyCapped.map((a) => a.name).join(", ")}`);
for (const name of ["Ayaka", "Moana"]) {
  assert.equal(byName.get(name).tiers.solo, "D", `${name} tanpa efek damage SOLO harus D`);
  assert.ok(byName.get(name).scores.solo > 0, `${name} dapat bobot mitigasi kecil, bukan 0`);
  assert.ok(
    byName.get(name).scores.solo < scoreArtist([{ effect: "basic_atk", value: 50 }], "solo"),
    `${name} defensif harus di bawah damage murni`,
  );
}
// Ekonomi murni tidak memberi nilai di SOLO.
assert.equal(byName.get("Kesnia").scores.solo, 0, "Kesnia gold-only harus 0 di SOLO");
// DEFENSE: semua efek punya bobot kecil, jadi tidak ada artist berskor 0.
for (const a of artists) {
  assert.ok(a.scores.defense > 0, `${a.name} tanpa efek defense tetap harus dapat poin`);
}
assert.equal(byName.get("Ayaka").tiers.defense, "S", "tank murni harus S di DEFENSE");
assert.ok(byName.get("Aoi").scores.defense > byName.get("Monica").scores.defense, "Aoi (red + damage) di atas Monica (damage murni)");

const orders = {
  solo: ["fan", "player_dmg", "skill_dmg", "basic_atk"],
  rally: ["fan_rally", "player_dmg", "skill_dmg", "basic_atk"],
  defense: ["basic_atk_red", "skill_dmg_red", "player_dmg"],
  economy: ["gold", "drive"],
};
for (const [category, order] of Object.entries(orders)) {
  const scores = order.map((effect) => scoreArtist([{ effect, value: 20 }], category));
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i] < scores[i - 1], `priority ${category}: ${order[i]} must rank below ${order[i - 1]}`);
  }
}
// Bobot kecil SOLO tidak boleh mengalahkan damage murni.
assert.ok(
  scoreArtist([{ effect: "wbg_dmg", value: 20 }], "solo") > scoreArtist([{ effect: "dps_def", value: 20 }], "solo"),
  "wbg_dmg harus di atas dps_def di SOLO",
);
// player_dmg menambah basic_atk DAN skill_dmg: skill 30 + player 30 == skill 60 + basic 30.
assert.equal(
  scoreArtist([{ effect: "skill_dmg", value: 30 }, { effect: "player_dmg", value: 30 }], "solo"),
  scoreArtist([{ effect: "skill_dmg", value: 60 }, { effect: "basic_atk", value: 30 }], "solo"),
  "player_dmg harus dihitung di kanal basic dan skill",
);
for (const a of artists) {
  for (const category of CATEGORIES) {
    assert.ok(a.scores[category] >= 0 && a.scores[category] <= 100, `${a.name} ${category} score out of range`);
    assert.ok(["S+", "S", "A", "B", "C", "D"].includes(a.tiers[category]), `${a.name} ${category} bad tier`);
  }
}
console.log("score-check ok:", artists.length, "artists x", CATEGORIES.length, "categories");
