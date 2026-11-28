import {
  EFFECT_SET,
  TIER_ORDER,
  scoreArtist,
  tierFromScore,
  type Effect,
  type Skill,
  type Tier,
} from "./score.ts";
import { PHOTO_BUCKET, SUPABASE_URL, supabase } from "./supabase.ts";

// Peran panggung dari CHeroData.Position; 'support' ada di config tapi belum dipakai roster.
export type Role = "center" | "dancer" | "singer" | "support";

// Kapasitas fan per artis di level maks: CHeroStarLevel Lvl 160 buff 12118004 (180.000)
// + CHeroStar Star 21 (22.000). Nilainya sama untuk semua hero di dump; kalau game
// membedakan per hero, ambil dari Status kedua tabel itu alih-alih konstanta ini.
export const FAN_CAP_MAX = 202_000;

export type Artist = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  origin: string | null;
  // Season rilis untuk artis aboard (Tokyo/Bali/Rome); null = tidak dibatasi season.
  season: number | null;
  // Damage skill 1 (flat, tiap BASE_SKILL_INTERVAL detik); tidak masuk perhitungan rank.
  baseDmg: number;
  // Peran panggung (CHeroData.Position); null = belum dipetakan.
  role: Role | null;
  // Sing/Dance di level maks; dipakai scoreArtist sebagai komponen stat panggung.
  singMax: number | null;
  danceMax: number | null;
  // Kapasitas fan di level maks (lihat FAN_CAP_MAX); dipakai ringkasan lineup.
  fanCap: number;
  skills: Skill[];
  photoUrl: string | null;
  // Nama file ikon genre dari tabel genres; null = tanpa ikon.
  genreImage: string | null;
  // Skor gabungan skill + stat panggung (0–100) dan tier-nya.
  score: number;
  tier: Tier;
};

type Row = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  origin: string | null;
  base_dmg: number;
  role: Role | null;
  sing_max: number | null;
  dance_max: number | null;
  photo_path: string | null;
  photo_updated_at: string;
  artist_skills: { slot: number; effect: string; value: number | null }[];
  // Relasi satu-satu lewat slug unik; PostgREST bisa mengembalikan objek atau array.
  artist_seasons: { season: number } | { season: number }[] | null;
  genres: { image: string | null } | { image: string | null }[] | null;
};

export async function loadArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, slug, name, genre, origin, base_dmg, role, sing_max, dance_max, photo_path, photo_updated_at, artist_skills(slot, effect, value), artist_seasons(season), genres(image)")
    .order("id");

  if (error) throw new Error(`Gagal memuat artist: ${error.message}`);

  return (data as Row[])
    .map((r) => {
      const skills = [...r.artist_skills]
        .sort((a, b) => a.slot - b.slot)
        .filter((s) => EFFECT_SET.has(s.effect))
        .map((s) => ({ effect: s.effect as Effect, value: s.value }));
      const score = scoreArtist(skills, { sing: r.sing_max, dance: r.dance_max });
      const tier = tierFromScore(score);
      const rel = r.artist_seasons;
      const season = (Array.isArray(rel) ? rel[0] : rel)?.season ?? null;
      const genreRel = r.genres;
      const genreImage = (Array.isArray(genreRel) ? genreRel[0] : genreRel)?.image ?? null;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        genre: r.genre,
        origin: r.origin,
        baseDmg: r.base_dmg,
        role: r.role,
        singMax: r.sing_max,
        danceMax: r.dance_max,
        fanCap: FAN_CAP_MAX,
        season,
        skills,
        genreImage,
        // ?v=photo_updated_at: path foto tetap, jadi tanpa query ini CDN/optimizer menyajikan gambar lama.
        photoUrl: r.photo_path
          ? `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${r.photo_path}?v=${new Date(r.photo_updated_at).getTime()}`
          : null,
        score,
        tier,
      };
    })
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        b.score - a.score ||
        a.name.localeCompare(b.name),
    );
}
