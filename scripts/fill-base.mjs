import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const mdPath = join(root, "base-stats.md");
const csvPath = join(root, "data", "artists.csv");

const md = readFileSync(mdPath, "utf8");
const entries = [];
const empty = [];
const bad = [];

for (const line of md.split(/\r?\n/)) {
  const m = line.match(/^\s*([^:]+?)\s*:\s*(.*)$/);
  if (!m) continue;
  const name = m[1].trim();
  const raw = m[2].trim();
  if (!raw) {
    empty.push(name);
    continue;
  }
  const parts = raw.split(",").map((p) => p.trim());
  const nums = [parts[0], parts[1]].map((p) => p.replace(/[\s.]/g, ""));
  if (!nums.every((p) => /^\d+$/.test(p))) {
    bad.push(`${name}: "${raw}"`);
    continue;
  }
  const place = parts[2]?.match(/^(tokyo|rome|roma|bali|abroad)\s+(\d+)$/i);
  entries.push({
    name,
    sing: nums[0],
    dance: nums[1],
    region: place ? place[1].replace(/^roma$/i, "Rome").replace(/^./, (c) => c.toUpperCase()) : null,
    season: place ? place[2] : null,
  });
}

const csv = readFileSync(csvPath, "utf8");
const lines = csv.split(/\r?\n/);
const header = lines[0].split(",");
const col = (n) => header.indexOf(n);
const [iName, iSing, iDance] = [col("name"), col("base_sing"), col("base_dance")];
const [iRegion, iSeason] = [col("region"), col("season")];
if (iName < 0 || iSing < 0 || iDance < 0) {
  console.error("Kolom name/base_sing/base_dance tidak ditemukan di data/artists.csv");
  process.exit(1);
}

const known = new Set(lines.slice(1).filter(Boolean).map((l) => l.split(",")[iName].toLowerCase()));
const unknown = entries.filter((e) => !known.has(e.name.toLowerCase())).map((e) => e.name);
const byName = new Map(entries.map((e) => [e.name.toLowerCase(), e]));

const updated = [];
const out = lines.map((line, i) => {
  if (i === 0 || !line) return line;
  const cells = line.split(",");
  const e = byName.get(cells[iName].toLowerCase());
  if (!e) return line;
  const changed =
    cells[iSing] !== e.sing ||
    cells[iDance] !== e.dance ||
    (e.region !== null && (cells[iRegion] !== e.region || cells[iSeason] !== e.season));
  if (!changed) return line;
  cells[iSing] = e.sing;
  cells[iDance] = e.dance;
  if (e.region !== null && iRegion >= 0 && iSeason >= 0) {
    cells[iRegion] = e.region;
    cells[iSeason] = e.season;
  }
  updated.push(cells[iName]);
  return cells.join(",");
});

if (updated.length > 0) writeFileSync(csvPath, out.join("\n"));

console.log(`diperbarui: ${updated.length}${updated.length ? ` (${updated.join(", ")})` : ""}`);
console.log(`kosong: ${empty.length}${empty.length ? ` (${empty.join(", ")})` : ""}`);
if (unknown.length) console.error(`nama tidak dikenal: ${unknown.join(", ")}`);
if (bad.length) console.error(`format salah (butuh sing,dance): ${bad.join("; ")}`);

process.exit(unknown.length || bad.length ? 1 : 0);
