import type { Artist } from "./artists.ts";
import type { Category } from "./score.ts";

// Pool = himpunan origin yang tersedia di server pemain. Array kosong = semua artis.
export type Pool = string[];

export type Rank = { rank: number; size: number };

export function poolOf(artists: Artist[], pool: Pool): Artist[] {
  if (pool.length === 0) return artists;
  const set = new Set(pool);
  return artists.filter((a) => a.origin !== null && set.has(a.origin));
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
