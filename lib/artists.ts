import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Skill = { name: string; value: string };
export type Artist = {
  id: number;
  slug: string;
  name: string;
  tier: string;
  genre: string;
  skills: Skill[];
};

const TIERS = ["S+", "S", "A", "B", "C", "D"];

// Minimal RFC4180 row split: handles quoted fields, doubled quotes.
function parseRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function loadArtists(): Artist[] {
  const raw = readFileSync(join(process.cwd(), "topgirl-artist.csv"), "utf8");
  const [header, ...rows] = raw.split(/\r?\n/).filter(Boolean);
  const cols = parseRow(header);
  const idx = (name: string) => cols.indexOf(name);

  return rows
    .map(parseRow)
    .map((r) => {
      const skills: Skill[] = [];
      for (const n of [1, 2]) {
        const name = r[idx(`skill_${n}`)] ?? "";
        const value = r[idx(`skill_${n}_value`)] ?? "";
        if (name) skills.push({ name, value });
      }
      return {
        id: Number(r[idx("id")]),
        slug: r[idx("slug")],
        name: r[idx("name")],
        tier: r[idx("tier")],
        genre: r[idx("genre")],
        skills,
      };
    })
    .filter((a) => a.slug && a.tier)
    .sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.name.localeCompare(b.name));
}

export const TIER_ORDER = TIERS;
