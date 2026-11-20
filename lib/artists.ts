import { readFileSync } from "node:fs";
import { join } from "node:path";

export const TIER_ORDER = ["S+", "S", "A", "B", "C", "D"] as const;
export type Tier = (typeof TIER_ORDER)[number];

export type Effect =
  | "player_dmg"
  | "skill_dmg"
  | "basic_atk"
  | "basic_atk_red"
  | "skill_dmg_red"
  | "fan"
  | "fan_rally"
  | "dps_def"
  | "dps_atk_company"
  | "dps_atk_rally"
  | "wbg_dmg"
  | "gold"
  | "drive"
  | "noncombat";

export type Skill = {
  effect: Effect;
  value: number | null;
};

export type Artist = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  baseSing: number | null;
  baseDance: number | null;
  skills: Skill[];
  score: number;
  tier: Tier;
};

const EFFECTS = new Set<string>([
  "player_dmg",
  "skill_dmg",
  "basic_atk",
  "basic_atk_red",
  "skill_dmg_red",
  "fan",
  "fan_rally",
  "dps_def",
  "dps_atk_company",
  "dps_atk_rally",
  "wbg_dmg",
  "gold",
  "drive",
  "noncombat",
]);

// Points per skill percent. Sustain counts 0.75x in the final score.
const OFFENSE: Partial<Record<Effect, number>> = {
  player_dmg: 1,
  skill_dmg: 1,
  basic_atk: 0.5,
  dps_def: 0.4,
  dps_atk_company: 0.35,
  dps_atk_rally: 0.35,
};
const SUSTAIN: Partial<Record<Effect, number>> = {
  skill_dmg_red: 0.8,
  basic_atk_red: 0.4,
  fan: 0.6,
  fan_rally: 0.5,
};

// Base stat of the Tokyo 1 / Rome 1 / Bali 1 cohort. Season power is already
// baked into base stats, so no separate per-season multiplier is needed.
const BASE_REF = 49918;

const BANDS: [Tier, number][] = [
  ["S+", 85],
  ["S", 65],
  ["A", 45],
  ["B", 30],
  ["C", 16],
];

export function scoreArtist(skills: Skill[], baseSing: number | null, baseDance: number | null): number {
  let offense = 0;
  let sustain = 0;
  for (const s of skills) {
    if (s.value === null) continue;
    // dps values are flat (200/240); /2.4 maps them onto the percent scale.
    const v = s.effect.startsWith("dps") ? s.value / 2.4 : s.value;
    offense += (OFFENSE[s.effect] ?? 0) * v;
    sustain += (SUSTAIN[s.effect] ?? 0) * v;
  }
  const base = (baseSing ?? 0) + (baseDance ?? 0);
  const baseMult = base ? base / BASE_REF : 1;
  return Math.min(100, Math.round((offense + 0.75 * sustain) * 1.4 * baseMult * 10) / 10);
}

export function tierFromScore(score: number): Tier {
  return BANDS.find(([, min]) => score >= min)?.[0] ?? "D";
}

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
        if (!effect || !EFFECTS.has(effect)) continue;
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
        baseSing,
        baseDance,
        skills,
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
