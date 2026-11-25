import type { Artist } from "./artists.ts";
import type { Category } from "./score.ts";

// Pool = origin yang tersedia di server pemain + batas atas season server.
// Origins kosong = semua origin; season null = semua season.
export type Pool = { origins: string[]; season: number | null };

export const EMPTY_POOL: Pool = { origins: [], season: null };

export const poolActive = (pool: Pool) => pool.origins.length > 0 || pool.season !== null;

// Season = batas atas yang bisa diperoleh. Artis di atasnya belum muncul di server.
export const isBlocked = (a: Artist, season: number | null) =>
  season !== null && a.season !== null && a.season > season;

const originFilter = (pool: Pool) => (pool.origins.length > 0 ? new Set(pool.origins) : null);

const matchesOrigin = (a: Artist, set: Set<string> | null) =>
  set === null || (a.origin !== null && set.has(a.origin));

export function poolOf(artists: Artist[], pool: Pool): Artist[] {
  const set = originFilter(pool);
  return artists.filter((a) => matchesOrigin(a, set) && !isBlocked(a, pool.season));
}

// Artis yang cocok origin tapi season-nya di atas batas: tetap tampil, diberi peringatan.
export function blockedOf(artists: Artist[], pool: Pool): Artist[] {
  if (pool.season === null) return [];
  const set = originFilter(pool);
  return artists.filter((a) => matchesOrigin(a, set) && isBlocked(a, pool.season));
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
