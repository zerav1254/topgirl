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
  | "fan_gain"
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
  "fan_gain",
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
  // Pendapatan fan (koleksi pasukan), bukan efek tempur.
  fan_gain: {
    id: "Fan gain",
    en: "Fan gain",
    fr: "Gain de fans",
    ko: "팬 획득",
    zh: "粉丝获取",
    ja: "ファン獲得",
    de: "Fan-Gewinn",
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

// Skill 1 semua artist: damage flat, cooldown tetap, tidak ikut skor rank.
export const BASE_SKILL_INTERVAL = 10;
export const BASE_SKILL_LABEL: Record<Locale, string> = {
  id: "Skill 1",
  en: "Skill 1",
  fr: "Compétence 1",
  ko: "스킬 1",
  zh: "技能 1",
  ja: "スキル 1",
  de: "Fähigkeit 1",
};

// Satu skor untuk seluruh situs (SSOT): bobot warisan kategori global.
// player_dmg tertinggi (3) karena menambah basic_atk DAN skill_dmg; bobot kanal
// lain mengikuti detail_skill.md (basic 0.5, skill 1.25, fan 1).
// Efek pinggiran tetap > 0 supaya tidak diam-diam hilang dari skor.
export const SCORE: Record<Effect, number> = {
  player_dmg: 3,
  wbg_dmg: 0.5,
  skill_dmg: 1.25,
  fan: 1,
  basic_atk: 0.5,
  fan_rally: 0.5,
  fan_gain: 0.01,
  basic_atk_red: 0.2,
  skill_dmg_red: 0.2,
  dps_atk_rally: 0.1,
  dps_atk_company: 0.1,
  dps_def: 0.1,
  gold: 0.01,
  drive: 0.01,
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

// Stat panggung: hot value game memakai singTotal × danceTotal, jadi keduanya
// digabung sebagai geometric mean lalu dinormalkan ke Sing tertinggi (season 6 singer).
export const STAT_REF = 52855;
// Skor skill (0-100) menyumbang 85%, skor stat 15%.
export const SKILL_WEIGHT = 0.85;
export const STAT_WEIGHT = 0.15;

export type StageStats = { sing: number | null; dance: number | null };

export function statScore(stats: StageStats | null | undefined): number {
  const sing = stats?.sing ?? 0;
  const dance = stats?.dance ?? 0;
  if (sing <= 0 || dance <= 0) return 0;
  return Math.min(100, (Math.sqrt(sing * dance) / STAT_REF) * 100);
}

// Score from skills and stage stats (Sing/Dance at max level).
export function scoreArtist(skills: Skill[], stats?: StageStats): number {
  let total = 0;
  for (const s of skills) {
    if (s.value === null) continue;
    // dps values are flat (200/240); the scale maps them onto the percent scale.
    const v = s.value * (FLAT_SCALE[s.effect] ?? 1);
    total += SCORE[s.effect] * v;
  }
  const skill = Math.min(100, total * SCALE);
  return Math.min(100, Math.round((skill * SKILL_WEIGHT + statScore(stats) * STAT_WEIGHT) * 10) / 10);
}

export function tierFromScore(score: number): Tier {
  return BANDS.find(([, min]) => score >= min)?.[0] ?? "D";
}
