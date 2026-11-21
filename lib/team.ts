import type { Effect } from "./score.ts";

export const TEAM_SIZE = 5;

// Genre synergy is informational here: 3/4/5 artists of one genre grant +5/+10/+25% in game.
export const GENRE_BONUS: Record<number, number> = { 3: 5, 4: 10, 5: 25 };

export const STAT_ORDER: Effect[] = [
  "player_dmg",
  "skill_dmg",
  "basic_atk",
  "dps_def",
  "dps_atk_company",
  "dps_atk_rally",
  "fan",
  "fan_rally",
  "basic_atk_red",
  "skill_dmg_red",
  "wbg_dmg",
  "gold",
  "drive",
];
