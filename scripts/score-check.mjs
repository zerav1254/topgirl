import assert from "node:assert/strict";
import { loadArtists } from "../lib/artists.ts";
import { EMPTY_POOL, blockedOf, poolOf, rankInPool } from "../lib/pool.ts";
import { EFFECTS, SCORE, scoreArtist } from "../lib/score.ts";
import { TEAM_SIZE, bestLineup } from "../lib/team.ts";

const artists = await loadArtists();
assert.ok(artists.length > 0, "expected at least one artist");
assert.equal(new Set(artists.map((a) => a.slug)).size, artists.length, "slugs must be unique");

const byName = new Map(artists.map((a) => [a.name, a]));
// Semua efek wajib punya bobot > 0 supaya tidak ada yang diam-diam 0.
for (const effect of EFFECTS) {
  assert.ok(SCORE[effect] > 0, `bobot ${effect} harus > 0`);
}
// Satu skor/tier untuk seluruh situs; contoh yang disepakati.
assert.equal(byName.get("Monica").tier, "S+");
assert.equal(byName.get("Rhea").tier, "S+");
assert.equal(byName.get("Aoi").tier, "S+");
assert.equal(byName.get("Kesnia").tier, "D", "gold-only tetap D");
assert.ok(byName.get("Kesnia").score < 10, "Kesnia gold-only tetap kecil");
for (const name of ["Ayaka", "Moana"]) {
  assert.equal(byName.get(name).tier, "D", `${name} tanpa efek damage harus D`);
  assert.ok(byName.get(name).score > 0, `${name} tetap dapat poin dari stat panggung`);
  assert.ok(
    byName.get(name).score < scoreArtist([{ effect: "basic_atk", value: 50 }]),
    `${name} defensif harus di bawah damage murni`,
  );
}
// Urutan bobot kanal utama.
const order = ["player_dmg", "skill_dmg", "fan", "basic_atk"];
const scores = order.map((effect) => scoreArtist([{ effect, value: 20 }]));
for (let i = 1; i < scores.length; i++) {
  assert.ok(scores[i] < scores[i - 1], `priority: ${order[i]} must rank below ${order[i - 1]}`);
}
// Stat panggung menaikkan skor, tapi tidak bisa menggantikan skill.
const base = [{ effect: "basic_atk", value: 20 }];
assert.ok(
  scoreArtist(base, { sing: 52855, dance: 52855 }) > scoreArtist(base),
  "stat panggung harus menambah skor",
);
assert.equal(scoreArtist(base, { sing: null, dance: null }), scoreArtist(base), "stat kosong = 0");
assert.ok(
  scoreArtist(base, { sing: 20000, dance: 20000 }) > scoreArtist(base, { sing: 10000, dance: 10000 }),
  "stat lebih tinggi harus skor lebih tinggi",
);
for (const a of artists) {
  assert.ok(a.score >= 0 && a.score <= 100, `${a.name} score out of range`);
  assert.ok(["S+", "S", "A", "B", "C", "D"].includes(a.tier), `${a.name} bad tier`);
}
// Sebaran tier harus memakai semua tingkat (tidak kosong di ujung).
for (const tier of ["S+", "D"]) {
  assert.ok(artists.some((a) => a.tier === tier), `tier ${tier} tidak boleh kosong`);
}

// Pool: hanya season server — batas atas artis yang bisa diperoleh.
assert.equal(poolOf(artists, EMPTY_POOL).length, artists.length, "tanpa season cap semua artis ikut");
assert.equal(blockedOf(artists, EMPTY_POOL).length, 0, "tanpa season cap tidak ada yang terblokir");
const aboard = artists.filter((a) => ["Tokyo", "Bali", "Rome"].includes(a.origin ?? ""));
assert.ok(aboard.length > 0, "harus ada artis aboard");
assert.equal(aboard.filter((a) => a.season === null).length, 0, "semua artis aboard harus punya season");

const cap = 4;
const capped = { season: cap };
const allowed = poolOf(artists, capped);
assert.ok(allowed.every((a) => a.season === null || a.season <= cap), "cap 4 membuang season 5+");
assert.ok(allowed.some((a) => a.season !== null && a.season <= cap), "cap 4 tetap menyisakan season 1-4");
assert.ok(allowed.some((a) => a.season === null), "artis non-aboard tidak terpengaruh cap");
const blockedSeason = blockedOf(artists, capped);
assert.equal(blockedSeason.length, artists.filter((a) => a.season !== null && a.season > cap).length, "blocked = season di atas cap");
assert.ok(blockedSeason.every((a) => a.season !== null && a.season > cap), "blocked semua di atas cap");
assert.equal(allowed.length + blockedSeason.length, artists.length, "artis hanya di satu sisi cap");

const rank = rankInPool(artists, capped);
assert.equal(rank.size, allowed.length, "ukuran peringkat = artis yang bisa diperoleh");
const maxScore = Math.max(...allowed.map((a) => a.score));
const first = allowed.find((a) => rank.get(a.slug)?.rank === 1);
assert.equal(first?.score, maxScore, "rank 1 = skor tertinggi season");

const lineup = bestLineup(artists);
assert.ok(lineup.length <= TEAM_SIZE, "lineup maksimal TEAM_SIZE");
assert.equal(new Set(lineup.map((a) => a.slug)).size, lineup.length, "lineup tidak boleh duplikat");
if (artists.length > TEAM_SIZE) assert.equal(lineup.length, TEAM_SIZE, "lineup penuh kalau data cukup");
const naive = [...artists].sort((a, b) => b.score - a.score).slice(0, TEAM_SIZE);
const sum = (list) => list.reduce((n, a) => n + a.score, 0);
assert.ok(sum(lineup) >= sum(naive) - 1e-9, "lineup minimal sebaik top-5 naif");

console.log("score-check ok:", artists.length, "artists, one score");
