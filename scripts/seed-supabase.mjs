// One-off seed: data/artists.csv + public thumb -> Supabase (tabel + bucket artist-thumb).
// Jalankan: node --env-file=.env.local scripts/seed-supabase.mjs
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset");

const sb = createClient(url, key, { auth: { persistSession: false } });
const root = process.cwd();
const lines = readFileSync(join(root, "data", "artists.csv"), "utf8").split(/\r?\n/).filter(Boolean);
// ponytail: parser satu baris saja (cukup untuk CSV seed); tidak menangani field multi-baris.
function parseLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch !== '"') cur += ch;
      else if (line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const header = parseLine(lines[0]);
const rows = lines.slice(1);
const cols = header.map((c) => c.trim());
const get = (r, name) => r[cols.indexOf(name)]?.trim() ?? "";
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

let done = 0;
for (const line of rows) {
  const r = parseLine(line);
  const slug = get(r, "slug");
  if (!slug) continue;

  const { data, error } = await sb
    .from("artists")
    .upsert(
      {
        slug,
        name: get(r, "name"),
        genre: get(r, "genre"),
        origin: get(r, "origin") || null,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`${slug}: ${error.message}`);

  const del = await sb.from("artist_skills").delete().eq("artist_id", data.id);
  if (del.error) throw new Error(`${slug}: ${del.error.message}`);

  const skills = [1, 2]
    .map((slot) => ({ slot, effect: get(r, `s${slot}_effect`), value: num(get(r, `s${slot}_value`)) }))
    .filter((s) => s.effect);
  if (skills.length) {
    const ins = await sb.from("artist_skills").insert(skills.map((s) => ({ ...s, artist_id: data.id })));
    if (ins.error) throw new Error(`${slug}: ${ins.error.message}`);
  }

  const thumb = join(root, "public", "assets", "images", "artists", "thumb", `${slug}.webp`);
  if (existsSync(thumb)) {
    const up = await sb.storage.from("artist-thumb").upload(`${slug}.webp`, readFileSync(thumb), {
      contentType: "image/webp",
      upsert: true,
    });
    if (up.error) throw new Error(`${slug}: ${up.error.message}`);
    await sb.from("artists").update({ photo_path: `${slug}.webp`, photo_updated_at: new Date().toISOString() }).eq("id", data.id);
  }

  done++;
  process.stdout.write(`\r${done}/${rows.length}`);
}

console.log("\nSelesai.");
