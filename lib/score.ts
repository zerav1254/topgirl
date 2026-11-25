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
  | "drive";

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
];

export const EFFECT_LABEL: Record<Effect, Record<Locale, string>> = {
  player_dmg: {
    id: "Dmg pemain",
    en: "Player DMG",
    fr: "Dégâts joueur",
    ko: "플레이어 피해",
    zh: "玩家伤害",
    ja: "プレイヤー与ダメージ",
    de: "Spielerschaden",
  },
  skill_dmg: {
    id: "Dmg skill",
    en: "Skill DMG",
    fr: "Dégâts compétence",
    ko: "스킬 피해",
    zh: "技能伤害",
    ja: "スキル与ダメージ",
    de: "Fähigkeitsschaden",
  },
  basic_atk: {
    id: "Serangan",
    en: "Basic ATK",
    fr: "Attaque de base",
    ko: "기본 공격",
    zh: "普通攻击",
    ja: "通常攻撃",
    de: "Basisangriff",
  },
  basic_atk_red: {
    id: "Red. serangan",
    en: "Basic ATK red.",
    fr: "Réduc. attaque",
    ko: "기본 공격 감소",
    zh: "普攻减免",
    ja: "通常攻撃軽減",
    de: "Basisangriff-Red.",
  },
  skill_dmg_red: {
    id: "Red. skill",
    en: "Skill DMG red.",
    fr: "Réduc. compétence",
    ko: "스킬 피해 감소",
    zh: "技能减伤",
    ja: "スキル軽減",
    de: "Fähigkeitsschaden-Red.",
  },
  fan: { id: "Fan", en: "Fan", fr: "Fans", ko: "팬", zh: "粉丝", ja: "ファン", de: "Fans" },
  fan_rally: {
    id: "Fan rally",
    en: "Fan rally",
    fr: "Fans rallye",
    ko: "팬 랠리",
    zh: "粉丝应援",
    ja: "ファン応援",
    de: "Fan-Rallye",
  },
  dps_def: {
    id: "DPS defend",
    en: "DPS defend",
    fr: "DPS défense",
    ko: "DPS 방어",
    zh: "DPS 防守",
    ja: "DPS防衛",
    de: "DPS-Verteidigung",
  },
  dps_atk_company: {
    id: "DPS company",
    en: "DPS company",
    fr: "DPS compagnie",
    ko: "DPS 컴퍼니",
    zh: "DPS 公司",
    ja: "DPS会社",
    de: "DPS-Unternehmen",
  },
  dps_atk_rally: {
    id: "DPS rally",
    en: "DPS rally",
    fr: "DPS rallye",
    ko: "DPS 랠리",
    zh: "DPS 集结",
    ja: "DPSラリー",
    de: "DPS-Rallye",
  },
  wbg_dmg: { id: "Dmg WBG", en: "WBG DMG", fr: "Dégâts WBG", ko: "WBG 피해", zh: "WBG 伤害", ja: "WBGダメージ", de: "WBG-Schaden" },
  gold: { id: "Gold", en: "Gold", fr: "Or", ko: "골드", zh: "金币", ja: "ゴールド", de: "Gold" },
  drive: { id: "Drive", en: "Drive", fr: "Drive", ko: "드라이브", zh: "Drive", ja: "ドライブ", de: "Drive" },
};

export const CATEGORIES = ["solo", "rally", "defense", "economy", "global", "sustain"] as const;
export const DEFAULT_CATEGORY: Category = "global";
export type Category = (typeof CATEGORIES)[number];

// detail_skill.md: 50% basic_atk = 20% skill_dmg = 10% fan.
// Jadi bobot per 1%: basic 0.5, skill 1.25, fan 2.5.
// player_dmg menambah basic_atk DAN skill_dmg, jadi bobotnya 0.5 + 1.25 = 1.75.
// fan_rally memakai bobot sendiri; RALLY sengaja di atas player_dmg.
// SOLO tetap damage-first, tapi bertahan hidup diberi bobot kecil supaya unit
// defensif tidak mentok 0 (dps_def ikut FLAT_SCALE).
// Semua efek wajib punya bobot > 0 di setiap kategori (tipe Record total).
// Efek pinggiran tetap diberi bobot kecil supaya tidak ada yang diam-diam 0.
export const SCORE: Record<Category, Record<Effect, number>> = {
  solo: {
    player_dmg: 1.75,
    fan: 2.5,
    skill_dmg: 1.25,
    basic_atk: 0.5,
    basic_atk_red: 0.25,
    skill_dmg_red: 0.2,
    wbg_dmg: 0.2,
    gold: 0.01,
    drive: 0.01,
    fan_rally: 0.01,
    dps_def: 0.05,
    dps_atk_rally: 0.01,
    dps_atk_company: 0.01,
  },
  rally: {
    fan_rally: 6,
    player_dmg: 1.75,
    skill_dmg: 1.25,
    wbg_dmg: 1,
    basic_atk: 0.5,
    fan: 0.01,
    dps_atk_rally: 0.1,
    dps_atk_company: 0.1,
    gold: 0.01,
    drive: 0.01,
    basic_atk_red: 0.01,
    skill_dmg_red: 0.01,
    dps_def: 0.01,
  },
  defense: {
    player_dmg: 1.2,
    basic_atk_red: 4,
    skill_dmg_red: 3,
    basic_atk: 0.3,
    skill_dmg: 0.25,
    fan: 0.3,
    fan_rally: 0.5,
    wbg_dmg: 0.2,
    gold: 0.2,
    drive: 0.2,
    dps_def: 0.1,
    dps_atk_rally: 0.05,
    dps_atk_company: 0.05,
  },
  economy: {
    gold: 2,
    drive: 1,
    player_dmg: 0.01,
    skill_dmg: 0.01,
    fan: 0.01,
    fan_rally: 0.01,
    basic_atk: 0.01,
    basic_atk_red: 0.01,
    skill_dmg_red: 0.01,
    wbg_dmg: 0.01,
    dps_def: 0.01,
    dps_atk_rally: 0.01,
    dps_atk_company: 0.01,
  },
  // GLOBAL: player_dmg bobot tertinggi mutlak.
  global: {
    player_dmg: 3,
    wbg_dmg: 2,
    skill_dmg: 1.25,
    fan: 1,
    basic_atk: 0.5,
    fan_rally: 0.5,
    basic_atk_red: 0.2,
    skill_dmg_red: 0.2,
    dps_atk_rally: 0.1,
    dps_atk_company: 0.1,
    dps_def: 0.1,
    gold: 0.01,
    drive: 0.01,
  },
  // SUSTAIN: reduksi serangan tertinggi, lalu player_dmg, fan, skill, basic.
  sustain: {
    basic_atk_red: 4,
    skill_dmg_red: 3.5,
    player_dmg: 1.5,
    fan: 1,
    skill_dmg: 0.5,
    basic_atk: 0.3,
    fan_rally: 0.2,
    wbg_dmg: 0.2,
    gold: 0.1,
    drive: 0.1,
    dps_def: 0.1,
    dps_atk_rally: 0.05,
    dps_atk_company: 0.05,
  },
};

export const EFFECT_SET: ReadonlySet<string> = new Set(EFFECTS);

// Nilai "flat" (DPS) diskalakan ke skala persen. Efek baru dengan unit flat
// wajib ditambahkan di sini, kalau tidak skornya dihitung sebagai persen.
const FLAT_SCALE: Partial<Record<Effect, number>> = {
  dps_def: 1 / 2.4,
  dps_atk_company: 1 / 2.4,
  dps_atk_rally: 1 / 2.4,
};

// Turunan FLAT_SCALE supaya tampilan (%) dan skor memakai sumber yang sama.
export const FLAT_EFFECTS: ReadonlySet<Effect> = new Set(Object.keys(FLAT_SCALE) as Effect[]);

export const SCALE = 0.96;
export const BANDS: [Tier, number][] = [
  ["S+", 85],
  ["S", 60],
  ["A", 40],
  ["B", 25],
  ["C", 11],
];

// Score from skills only; base stats are no longer part of ranking.
export function scoreArtist(skills: Skill[], category: Category = DEFAULT_CATEGORY): number {
  const weights = SCORE[category];
  let total = 0;
  for (const s of skills) {
    if (s.value === null) continue;
    // dps values are flat (200/240); the scale maps them onto the percent scale.
    const v = s.value * (FLAT_SCALE[s.effect] ?? 1);
    total += weights[s.effect] * v;
  }
  return Math.min(100, Math.round(total * SCALE * 10) / 10);
}

export function tierFromScore(score: number): Tier {
  return BANDS.find(([, min]) => score >= min)?.[0] ?? "D";
}
