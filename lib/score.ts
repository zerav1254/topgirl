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

export const EFFECTS: Effect[] = [
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
];

export const EFFECT_LABEL: Record<Effect, string> = {
  player_dmg: "Dmg pemain",
  skill_dmg: "Dmg skill",
  basic_atk: "Serangan",
  basic_atk_red: "Red. serangan",
  skill_dmg_red: "Red. skill",
  fan: "Fan",
  fan_rally: "Fan rally",
  dps_def: "DPS defend",
  dps_atk_company: "DPS company",
  dps_atk_rally: "DPS rally",
  wbg_dmg: "Dmg WBG",
  gold: "Gold",
  drive: "Drive",
  noncombat: "Non-tempur",
};

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

// Nilai "flat" (DPS) diskalakan ke skala persen. Efek baru dengan unit flat
// wajib ditambahkan di sini, kalau tidak skornya dihitung sebagai persen.
const FLAT_SCALE: Partial<Record<Effect, number>> = {
  dps_def: 1 / 2.4,
  dps_atk_company: 1 / 2.4,
  dps_atk_rally: 1 / 2.4,
};

// Score from skills only; base stats are no longer part of ranking.
const BANDS: [Tier, number][] = [
  ["S+", 75],
  ["S", 55],
  ["A", 38],
  ["B", 22],
  ["C", 16],
];

export function scoreArtist(skills: Skill[]): number {
  let offense = 0;
  let sustain = 0;
  for (const s of skills) {
    if (s.value === null) continue;
    // dps values are flat (200/240); the scale maps them onto the percent scale.
    const v = s.value * (FLAT_SCALE[s.effect] ?? 1);
    offense += (OFFENSE[s.effect] ?? 0) * v;
    sustain += (SUSTAIN[s.effect] ?? 0) * v;
  }
  return Math.min(100, Math.round((offense + 0.75 * sustain) * 1.4 * 10) / 10);
}

export function tierFromScore(score: number): Tier {
  return BANDS.find(([, min]) => score >= min)?.[0] ?? "D";
}
