import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EFFECTS, TIER_ORDER, scoreArtist, tierFromScore, type Effect, type Skill, type Tier } from "./score.ts";

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
  hasThumb: boolean;
  score: number;
  tier: Tier;
};

const EFFECT_SET = new Set<string>(EFFECTS);

const int = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function loadArtists(): Artist[] {
  const raw = readFileSync(join(process.cwd(), "data", "artists.csv"), "utf8");
  const [header, ...rows] = raw.split(/\r?\n/).filter(Boolean);
  const cols = header.split(",");
  const idx = (name: string) => cols.indexOf(name);

  return rows
    .map((line) => line.split(","))
    .map((r) => {
      const skills: Skill[] = [];
      for (const n of [1, 2]) {
        const effect = r[idx(`s${n}_effect`)]?.trim();
        if (!effect || !EFFECT_SET.has(effect)) continue;
        skills.push({ effect: effect as Effect, value: int(r[idx(`s${n}_value`)]) });
      }
      const baseSing = int(r[idx("base_sing")]);
      const baseDance = int(r[idx("base_dance")]);
      const score = scoreArtist(skills, baseSing, baseDance);
      return {
        id: Number(r[idx("id")]),
        slug: r[idx("slug")],
        name: r[idx("name")],
        genre: r[idx("genre")],
        region: r[idx("region")] || null,
        season: int(r[idx("season")]),
        baseSing,
        baseDance,
        skills,
        hasThumb: existsSync(join(process.cwd(), "public", "assets", "images", "artists", "thumb", `${r[idx("slug")]}.webp`)),
        score,
        tier: tierFromScore(score),
      };
    })
    .filter((a) => a.slug)
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        b.score - a.score ||
        a.name.localeCompare(b.name),
    );
}
