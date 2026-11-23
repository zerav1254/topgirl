import { CATEGORIES, EFFECTS, TIER_ORDER, scoreArtist, tierFromScore, type Category, type Effect, type Skill, type Tier } from "./score.ts";
import { PHOTO_BUCKET, SUPABASE_URL, supabase } from "./supabase.ts";

export { CATEGORIES, TIER_ORDER, tierFromScore } from "./score.ts";
export type { Category, Effect, Skill, Tier } from "./score.ts";

export type Artist = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  origin: string | null;
  season: number | null;
  skills: Skill[];
  photoUrl: string | null;
  // SOLO tetap disimpan terpisah supaya sort server dan editor tidak perlu kategori.
  score: number;
  tier: Tier;
  scores: Record<Category, number>;
  tiers: Record<Category, Tier>;
};

const EFFECT_SET = new Set<string>(EFFECTS);

type Row = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  origin: string | null;
  season: number | null;
  photo_path: string | null;
  updated_at: string;
  artist_skills: { slot: number; effect: string; value: number | null }[];
};

export async function loadArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, slug, name, genre, origin, season, photo_path, updated_at, artist_skills(slot, effect, value)")
    .order("id");

  if (error) throw new Error(`Gagal memuat artist: ${error.message}`);

  return (data as Row[])
    .map((r) => {
      const skills = [...r.artist_skills]
        .sort((a, b) => a.slot - b.slot)
        .filter((s) => EFFECT_SET.has(s.effect))
        .map((s) => ({ effect: s.effect as Effect, value: s.value }));
      const scores = Object.fromEntries(CATEGORIES.map((c) => [c, scoreArtist(skills, c)])) as Record<Category, number>;
      const tiers = Object.fromEntries(CATEGORIES.map((c) => [c, tierFromScore(scores[c])])) as Record<Category, Tier>;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        genre: r.genre,
        origin: r.origin,
        season: r.season,
        skills,
        // ?v=updated_at: path foto tetap, jadi tanpa query ini CDN/optimizer menyajikan gambar lama.
        photoUrl: r.photo_path
          ? `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${r.photo_path}?v=${new Date(r.updated_at).getTime()}`
          : null,
        score: scores.solo,
        tier: tiers.solo,
        scores,
        tiers,
      };
    })
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        b.score - a.score ||
        a.name.localeCompare(b.name),
    );
}
