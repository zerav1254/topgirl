import assert from "node:assert/strict";
import { loadArtists } from "../lib/artists.ts";
import { scoreArtist } from "../lib/score.ts";

const artists = await loadArtists();
assert.ok(artists.length >= 92, "expected at least 92 artists");
assert.equal(new Set(artists.map((a) => a.slug)).size, artists.length, "slugs must be unique");

const byName = new Map(artists.map((a) => [a.name, a]));
for (const name of ["Monica", "Longkui", "Kasha"]) {
  assert.ok(byName.get(name).score >= 75, `${name} should be S+`);
  assert.equal(byName.get(name).tier, "S+");
}
assert.equal(byName.get("Dewi").tier, "S", "Dewi should be S");
for (const name of ["Ayaka", "Moana"]) {
  assert.equal(byName.get(name).tier, "D", `${name} defense-only falls to D`);
}

const order = [
  "player_dmg",
  "skill_dmg",
  "basic_atk",
  "fan",
  "skill_dmg_red",
  "basic_atk_red",
  "fan_rally",
  "dps_def",
];
const scores = order.map((effect) => scoreArtist([{ effect, value: 20 }]));
for (let i = 1; i < scores.length; i++) {
  assert.ok(scores[i] < scores[i - 1], `priority: ${order[i]} must rank below ${order[i - 1]}`);
}
for (const a of artists) {
  assert.ok(a.score >= 0 && a.score <= 100, `${a.name} score out of range`);
  assert.ok(["S+", "S", "A", "B", "C", "D"].includes(a.tier), `${a.name} bad tier`);
}
console.log("score-check ok:", artists.length, "artists");
