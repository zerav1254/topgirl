import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  EFFECT_SET,
  TIER_ORDER,
  scoreArtist,
  tierFromScore,
  type Category,
  type Effect,
  type Skill,
  type Tier,
} from "./score.ts";
import { PHOTO_BUCKET, SUPABASE_URL, supabase } from "./supabase.ts";

export type Artist = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  origin: string | null;
  // Season rilis untuk artis aboard (Tokyo/Bali/Rome); null = tidak dibatasi season.
  season: number | null;
  skills: Skill[];
  photoUrl: string | null;
  scores: Record<Category, number>;
  tiers: Record<Category, Tier>;
};

type Row = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  origin: string | null;
  photo_path: string | null;
  photo_updated_at: string;
  artist_skills: { slot: number; effect: string; value: number | null }[];
  // Relasi satu-satu lewat slug unik; PostgREST bisa mengembalikan objek atau array.
  artist_seasons: { season: number } | { season: number }[] | null;
};

export async function loadArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, slug, name, genre, origin, photo_path, photo_updated_at, artist_skills(slot, effect, value), artist_seasons(season)")
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
      const rel = r.artist_seasons;
      const season = (Array.isArray(rel) ? rel[0] : rel)?.season ?? null;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        genre: r.genre,
        origin: r.origin,
        season,
        skills,
        // ?v=photo_updated_at: path foto tetap, jadi tanpa query ini CDN/optimizer menyajikan gambar lama.
        photoUrl: r.photo_path
          ? `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${r.photo_path}?v=${new Date(r.photo_updated_at).getTime()}`
          : null,
        scores,
        tiers,
      };
    })
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tiers[DEFAULT_CATEGORY]) - TIER_ORDER.indexOf(b.tiers[DEFAULT_CATEGORY]) ||
        b.scores[DEFAULT_CATEGORY] - a.scores[DEFAULT_CATEGORY] ||
        a.name.localeCompare(b.name),
    );
}
