import type { Artist } from "./artists.ts";
import type { Category, Effect } from "./score.ts";

export const TEAM_SIZE = 5;

// Prefilter untuk bestLineup: C(20,5) = 15.504 kombinasi. Tanpa batas ini,
// pool besar (94 artis) jadi 58 juta kombinasi di browser.
export const BEST_POOL_LIMIT = 20;

// Genre synergy is informational here: 3/4/5 artists of one genre grant +5/+10/+25% in game.
export const GENRE_BONUS: Record<number, number> = { 3: 5, 4: 10, 5: 25 };

export const STAT_ORDER: Effect[] = [
  "player_dmg",
  "skill_dmg",
  "basic_atk",
  "dps_def",
  "dps_atk_company",
  "dps_atk_rally",
  "fan",
  "fan_rally",
  "fan_gain",
  "basic_atk_red",
  "skill_dmg_red",
  "wbg_dmg",
  "gold",
  "drive",
];

// Akumulasi skill seluruh tim. Baris skill_dmg/basic_atk tetap muncul saat player_dmg > 0
// supaya hasil boost (info saja, bukan skor) bisa ditampilkan.
export function teamSkillTotals(team: Artist[]) {
  const totals = new Map<Effect, number>();
  for (const a of team) {
    for (const s of a.skills) {
      if (s.value !== null) totals.set(s.effect, (totals.get(s.effect) ?? 0) + s.value);
    }
  }
  const playerDmg = totals.get("player_dmg") ?? 0;
  const boosted = (e: Effect) => e === "skill_dmg" || e === "basic_atk";
  return {
    playerDmg,
    stats: STAT_ORDER.filter((e) => totals.has(e) || (boosted(e) && playerDmg > 0)).map((e) => [e, totals.get(e) ?? 0] as const),
  };
}

// Tim terbaik dari sekumpulan artis. Tujuan: jumlah skor, lalu bonus synergy sebagai
// tie-break. Brute force karena 5 slot tetap dan pool sudah dipangkas BEST_POOL_LIMIT.
export function bestLineup(artists: Artist[], category: Category, size = TEAM_SIZE): Artist[] {
  const top = [...artists].sort((a, b) => b.scores[category] - a.scores[category] || a.name.localeCompare(b.name)).slice(0, BEST_POOL_LIMIT);
  if (top.length <= size) return top;

  let best: Artist[] = [];
  let bestSum = -1;
  let bestBonus = -1;
  const combo: Artist[] = [];

  const walk = (start: number) => {
    if (combo.length === size) {
      let sum = 0;
      const genres = new Map<string, number>();
      for (const a of combo) {
        sum += a.scores[category];
        genres.set(a.genre, (genres.get(a.genre) ?? 0) + 1);
      }
      const bonus = GENRE_BONUS[Math.max(...genres.values())] ?? 0;
      if (sum > bestSum + 1e-9 || (Math.abs(sum - bestSum) < 1e-9 && bonus > bestBonus)) {
        best = [...combo];
        bestSum = sum;
        bestBonus = bonus;
      }
      return;
    }
    for (let i = start; i < top.length; i++) {
      combo.push(top[i]);
      walk(i + 1);
      combo.pop();
    }
  };

  walk(0);
  return best;
}
