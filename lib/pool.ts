import type { Artist } from "./artists.ts";
import type { Category } from "./score.ts";

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
export function rankInPool(artists: Artist[], pool: Pool, category: Category): Map<string, Rank> {
  const list = [...poolOf(artists, pool)].sort(
    (a, b) => b.scores[category] - a.scores[category] || a.name.localeCompare(b.name),
  );
  const out = new Map<string, Rank>();
  list.forEach((a, i) => out.set(a.slug, { rank: i + 1, size: list.length }));
  return out;
}

export type Rank = { rank: number; size: number };
