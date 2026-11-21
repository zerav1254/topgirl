import { EFFECTS, TIER_ORDER, scoreArtist, tierFromScore, type Effect, type Skill, type Tier } from "./score.ts";
import { PHOTO_BUCKET, SUPABASE_URL, supabase } from "./supabase.ts";

export { TIER_ORDER, tierFromScore } from "./score.ts";
export type { Effect, Skill, Tier } from "./score.ts";

export type Artist = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  region: string | null;
  season: number | null;
  baseSing: number | null;
  baseDance: number | null;
  skills: Skill[];
  photoUrl: string | null;
  score: number;
  tier: Tier;
};

const EFFECT_SET = new Set<string>(EFFECTS);

type Row = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  region: string | null;
  season: number | null;
  base_sing: number | null;
  base_dance: number | null;
  photo_path: string | null;
  artist_skills: { slot: number; effect: string; value: number | null }[];
};

export async function loadArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, slug, name, genre, region, season, base_sing, base_dance, photo_path, artist_skills(slot, effect, value)")
    .order("id");

  if (error) throw new Error(`Gagal memuat artist: ${error.message}`);

  return (data as Row[])
    .map((r) => {
      const skills = [...r.artist_skills]
        .sort((a, b) => a.slot - b.slot)
        .filter((s) => EFFECT_SET.has(s.effect))
        .map((s) => ({ effect: s.effect as Effect, value: s.value }));
      const score = scoreArtist(skills, r.base_sing, r.base_dance);
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        genre: r.genre,
        region: r.region,
        season: r.season,
        baseSing: r.base_sing,
        baseDance: r.base_dance,
        skills,
        photoUrl: r.photo_path ? `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${r.photo_path}` : null,
        score,
        tier: tierFromScore(score),
      };
    })
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        b.score - a.score ||
        a.name.localeCompare(b.name),
    );
}
