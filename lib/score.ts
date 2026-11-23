import type { Locale } from "./i18n.ts";

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

export const EFFECT_LABEL: Record<Effect, Record<Locale, string>> = {
  player_dmg: { id: "Dmg pemain", en: "Player DMG", fr: "Dégâts joueur", ko: "플레이어 피해" },
  skill_dmg: { id: "Dmg skill", en: "Skill DMG", fr: "Dégâts compétence", ko: "스킬 피해" },
  basic_atk: { id: "Serangan", en: "Basic ATK", fr: "Attaque de base", ko: "기본 공격" },
  basic_atk_red: { id: "Red. serangan", en: "Basic ATK red.", fr: "Réduc. attaque", ko: "기본 공격 감소" },
  skill_dmg_red: { id: "Red. skill", en: "Skill DMG red.", fr: "Réduc. compétence", ko: "스킬 피해 감소" },
  fan: { id: "Fan", en: "Fan", fr: "Fans", ko: "팬" },
  fan_rally: { id: "Fan rally", en: "Fan rally", fr: "Fans rallye", ko: "팬 랠리" },
  dps_def: { id: "DPS defend", en: "DPS defend", fr: "DPS défense", ko: "DPS 방어" },
  dps_atk_company: { id: "DPS company", en: "DPS company", fr: "DPS compagnie", ko: "DPS 컴퍼니" },
  dps_atk_rally: { id: "DPS rally", en: "DPS rally", fr: "DPS rallye", ko: "DPS 랠리" },
  wbg_dmg: { id: "Dmg WBG", en: "WBG DMG", fr: "Dégâts WBG", ko: "WBG 피해" },
  gold: { id: "Gold", en: "Gold", fr: "Or", ko: "골드" },
  drive: { id: "Drive", en: "Drive", fr: "Drive", ko: "드라이브" },
  noncombat: { id: "Non-tempur", en: "Non-combat", fr: "Non-combat", ko: "비전투" },
};

export const CATEGORIES = ["solo", "rally", "defense", "economy"] as const;
export type Category = (typeof CATEGORIES)[number];

// detail_skill.md: 50% basic_atk = 20% skill_dmg = 10% fan.
// Jadi bobot per 1%: basic 0.5, skill 1.25, fan 2.5.
// player_dmg menambah basic_atk DAN skill_dmg, jadi bobotnya 0.5 + 1.25 = 1.75.
// fan_rally memakai bobot sendiri; RALLY sengaja di atas player_dmg.
export const SCORE: Record<Category, Partial<Record<Effect, number>>> = {
  solo: {
    player_dmg: 1.75,
    fan: 2.5,
    skill_dmg: 1.25,
    basic_atk: 0.5,
  },
  rally: {
    fan_rally: 7.5,
    player_dmg: 1.75,
    skill_dmg: 1.25,
    basic_atk: 0.5,
    dps_atk_rally: 0.1,
    dps_atk_company: 0.1,
    wbg_dmg: 1,
  },
  defense: {
    player_dmg: 1.75,
    basic_atk_red: 0.8,
    skill_dmg_red: 0.6,
    dps_def: 0.1,
  },
  economy: {
    gold: 2,
    drive: 1,
  },
};

// Nilai "flat" (DPS) diskalakan ke skala persen. Efek baru dengan unit flat
// wajib ditambahkan di sini, kalau tidak skornya dihitung sebagai persen.
const FLAT_SCALE: Partial<Record<Effect, number>> = {
  dps_def: 1 / 2.4,
  dps_atk_company: 1 / 2.4,
  dps_atk_rally: 1 / 2.4,
};

export const SCALE = 0.96;
export const BANDS: [Tier, number][] = [
  ["S+", 85],
  ["S", 60],
  ["A", 40],
  ["B", 25],
  ["C", 11],
];

// Score from skills only; base stats are no longer part of ranking.
export function scoreArtist(skills: Skill[], category: Category = "solo"): number {
  const weights = SCORE[category];
  let total = 0;
  for (const s of skills) {
    if (s.value === null) continue;
    // dps values are flat (200/240); the scale maps them onto the percent scale.
    const v = s.value * (FLAT_SCALE[s.effect] ?? 1);
    total += (weights[s.effect] ?? 0) * v;
  }
  return Math.min(100, Math.round(total * SCALE * 10) / 10);
}

export function tierFromScore(score: number): Tier {
  return BANDS.find(([, min]) => score >= min)?.[0] ?? "D";
}
