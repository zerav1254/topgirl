import type { Artist } from "./artists.ts";
import { tierFromScore, type Tier } from "./score.ts";

// Pool = batas atas season server pemain. null = semua season.
export type Pool = { season: number | null };

export const EMPTY_POOL: Pool = { season: null };

export const poolActive = (pool: Pool) => pool.season !== null;

// Season = batas atas yang bisa diperoleh. Artis di atasnya belum muncul di server.
export const isBlocked = (a: Artist, season: number | null) =>
  season !== null && a.season !== null && a.season > season;

export function poolOf(artists: Artist[], pool: Pool): Artist[] {
  return artists.filter((a) => !isBlocked(a, pool.season));
}

// Artis di atas season server: tetap tampil, diberi peringatan.
export function blockedOf(artists: Artist[], pool: Pool): Artist[] {
  if (pool.season === null) return [];
  return artists.filter((a) => isBlocked(a, pool.season));
}

// Peringkat dihitung ulang tiap render dari skor absolut; tidak pernah disimpan.
// Seri dipecah nama supaya urutan stabil antar render.
export function rankInPool(artists: Artist[], pool: Pool): Map<string, Rank> {
  const list = [...poolOf(artists, pool)].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const out = new Map<string, Rank>();
  list.forEach((a, i) => out.set(a.slug, { rank: i + 1, size: list.length }));
  return out;
}

export type Rank = { rank: number; size: number };

// Kuota tier relatif per pool, diturunkan dari distribusi 94 artis endgame:
// 7 S+, 14 S, 29 A, 24 B, 10 C, 10 D.
const TIER_CUTOFFS: [Tier, number][] = [
  ["S+", 0.07],
  ["S", 0.22],
  ["A", 0.53],
  ["B", 0.79],
  ["C", 0.9],
];

// Pool kecil (server baru) tetap dapat sebaran tier lengkap tanpa mengubah skor absolut.
// Skor sama selalu mendapat tier sama supaya seri tidak terbelah alfabet nama.
export function poolTiers(artists: Artist[], pool: Pool): Map<string, Tier> {
  const list = [...poolOf(artists, pool)].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const out = new Map<string, Tier>();
  // Kuota relatif tidak bermakna untuk pool sangat kecil (1 artis akan jadi D);
  // pakai tier absolut supaya skor tinggi tetap tinggi.
  if (list.length <= 5) {
    list.forEach((a) => out.set(a.slug, tierFromScore(a.score)));
    return out;
  }
  let prevScore = Number.NaN;
  let prevTier: Tier = "S+";
  list.forEach((a, i) => {
    const pct = (i + 1) / list.length;
    const share = TIER_CUTOFFS.find(([, max]) => pct <= max)?.[0] ?? "D";
    const tier = i > 0 && a.score === prevScore ? prevTier : share;
    out.set(a.slug, tier);
    prevScore = a.score;
    prevTier = tier;
  });
  return out;
}
