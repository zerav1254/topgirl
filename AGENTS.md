# AGENTS.md

Baca `RULE.md` (aturan keras) + `DESIGN.md` (token visual) sebelum ubah apa pun.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 (`@tailwindcss/postcss`, tanpa `tailwind.config`)
- **npm** + Node **24** (`engines`). Jangan pnpm/yarn.
- Supabase (Postgres + Storage): artist, skill, foto. Client `@supabase/supabase-js`.
- `sharp` resize foto upload (320×320 WebP); `@vercel/analytics`.
- Auth: Supabase OAuth (Google/Discord) via `@supabase/ssr`. Tanpa library auth tambahan.

## Perintah

```bash
npm install
npm run dev            # localhost:3000
npm run lint           # eslint next/core-web-vitals + typescript
npm run build          # wajib lulus sebelum commit (butuh env Supabase)
npm run check:scores   # assert bobot/tier vs DB (baca .env.local)
npm run seed           # isi DB dari CSV (butuh service_role key)
```

Jangan jalankan `next start`/`npm start`, termasuk uji lokal. Verifikasi lewat `npm run dev` + `npm run build` saja.

## Struktur

```
app/[locale]/
  layout.tsx        validasi locale + <html lang> + metadata per locale
  page.tsx          getArtists() -> <TeamBuilder tab="artists"> (roster cache 300 dtk)
  team/page.tsx     getArtists() -> <TeamBuilder tab="team"> + OG
  loading.tsx       skeleton route (client, locale dari useParams)
  error.tsx         error boundary per locale (wajib "use client")
  not-found.tsx     404; locale dibaca dari segmen URL (client)
  info/page.tsx     rumus rank/bobot/tier, tanpa fetch DB
  login/page.tsx    OAuth Google/Discord + gate profil
  profile/page.tsx  profil, tautkan/lepas provider, form nama & ID game
  profile/edit/page.tsx form edit profil + avatar
  collection/       tandai artist yang dimiliki user
  cost/page.tsx     kalkulator biaya
  lineups/page.tsx  daftar lineup + buat/bagikan/hapus
  lineup/actions.ts createLineup/toggleShare/remove
  l/[slug]/page.tsx halaman lineup publik (unlisted)
  u/[id]/page.tsx   profil publik + lineup yang dibagikan
  doc/[key]/page.tsx halaman bantuan/privasi/legal
app/globals.css     @import "tailwindcss" + @theme + base rules
app/sitemap.ts      sitemap halaman publik per locale
app/robots.ts       robots + sitemap
proxy.ts            redirect "/" sesuai Accept-Language + refresh sesi Supabase
components/
  team-builder.tsx  shell /{locale} + /{locale}/team: state tim + header; sumber `Icon` inline SVG
  artists-tab.tsx   tab Artists: cari + filter + roster per tier + tombol tim/koleksi
  artist-filter.tsx hook + bar filter (genre/asal/skill + cakupan koleksi), dilipat di mobile
  team-tab.tsx      slot tim (klik slot -> dialog pilih) + ringkasan
  lineups-tab.tsx   daftar lineup tersimpan: bagikan/salin/buka/hapus
  save-lineup.tsx   form simpan tim aktif sebagai lineup (dipakai tab Team)
  pool-picker.tsx   chip season server (single-select)
  profile-form.tsx  form profil (nama, ID/server, nickname)
  user-avatar.tsx   avatar bulat
  bottom-nav.tsx    nav Artists/Team/Lineup/Biaya/Profil, dirender root layout
  cost-calculator.tsx + cost/  kalkulator biaya per menu game (artist, mobil, HQ, villa, koleksi, CEO)
  lineup-tags.tsx   tag genre/season/efek pada kartu lineup
  public-lineups.tsx daftar lineup komunitas yang dibagikan
  provider-mark.tsx logo Google/Discord untuk tombol OAuth
  avatar-form.tsx   unggah avatar profil
  artist-ui.tsx     atom: Icon, TierBadge, Avatar, GenreIcon, SearchInput
  locale-switcher.tsx ganti segmen locale di path
lib/
  artists.ts      query Supabase -> tipe Artist/Effect
  artists-cache.ts cache roster lintas request (unstable_cache 300 dtk)
  score.ts        bobot skor, tier, label effect
  team.ts         TEAM_SIZE, STAT_ORDER, GENRE_BONUS
  team-store.ts   store tim di localStorage
  pool.ts         scoping season + peringkat relatif
  pool-store.ts   store season aktif di localStorage
  collection.ts   daftar artist yang dimiliki user
  lineups.ts      query lineup + share slug + profil publik
  docs.ts         isi halaman bantuan/privasi/legal
  site.ts         SITE_URL dari env
  supabase.ts     read client (anon) + adminClient() (service_role)
  supabase/server.ts client SSR untuk sesi OAuth
  auth.ts         session Supabase: getUser/getProfile/getIdentities
  locales.ts      LOCALES, Locale, isLocale, localeOr (tanpa dictionary, dipakai proxy)
  i18n.ts         DICT, LANG_NAME, t() interpolasi, numberLocale (re-export locale)
  rate-limit.ts   limiter per instance untuk server action tulis
  seo.ts          metadata bersama (canonical/hreflang/OG/Twitter); ikon lewat file convention app/icon.png dkk.
  image-client.ts kompres foto di browser (createImageBitmap/canvas)
  dict/id.ts      sumber string UI (tipe Dict); en|fr|ko|zh|ja|de wajib lengkap
supabase/schema.sql  tabel + bucket + RLS
scripts/seed-supabase.mjs
data/artists.csv     bahan seed, bukan sumber runtime
```

Alur data: Supabase → `lib/artists.ts` → server component (props) → client component. Tidak ada fetch data dari browser; artis/foto/staf diubah lewat migration Supabase + upload bucket.

## Di mana mengubah apa

| Kebutuhan | File |
| --- | --- |
| Tambah/ubah artist, stat, skill | migration Supabase + upload foto ke bucket |
| Ubah skema DB | migration Supabase + `supabase/schema.sql` + `lib/artists.ts` |
| Simpan stat atomik | RPC `save_artist_stats` di `supabase/schema.sql`, dipakai lewat migration/SQL (bukan UI) |
| Seed ulang dari CSV | `scripts/seed-supabase.mjs` (`npm run seed`) |
| Teks UI / bahasa baru | `lib/dict/*.ts` (+ `LOCALES`/`LANG_NAME` di `lib/i18n.ts`) |
| Ukuran tim | `TEAM_SIZE` di `lib/team.ts` |
| Filter/sort/summary | `components/artist-filter.tsx` (filter shared), `components/artists-tab.tsx` (roster), `components/team-tab.tsx` (ringkasan tim) |
| Bobot skor / ambang tier | `SCORE` (satu skor global) + `BANDS` di `lib/score.ts` |
| Teks halaman info rank | `app/[locale]/info/page.tsx` + `info` di `lib/dict/*.ts` |
| Warna, font, radius, bayangan | `@theme` di `app/globals.css` |
| Metadata/SEO/`lang` | `app/[locale]/layout.tsx` + `lib/seo.ts` |

`TIER_ORDER` (`lib/score.ts`) = urutan tier di roster. Tier dihitung dari satu skor global (`SCORE` + `BANDS`); tidak ada kategori. Tier baru: ubah `TIER_ORDER`, `BANDS`, **dan** `TIER_STYLE`/`AVATAR_STYLE` di `components/artist-ui.tsx`. Effect baru: tambah ke `EFFECTS` + bobot di `SCORE` + label di `lib/dict/*.ts` (`EFFECT_LABEL` juga dipakai DB constraint lewat server action).

## Konvensi kode

- TypeScript strict; hindari `any`. Tipe data di `lib/artists.ts`.
- `lib/supabase.ts`/`lib/auth.ts` server-only; client hanya impor server action. `fs` hanya di `scripts/`.
- State persisten: `localStorage` key `topgirl.team.v1` (bump versi kalau bentuk data berubah).
- Komponen baru default server; `"use client"` hanya bila butuh state/effect/event.
- Ikuti pola: fungsi 1 layar, `camelCase`/`PascalCase`, kelas Tailwind urut layout → warna → state.
- Cari di repo pakai `rg` (isi file) dan `fd` (nama file); jangan `grep -r`/`find`.
- Tanpa dependency UI/icon library; ikon inline SVG (`Icon` di `team-builder.tsx`).
- Komentar hanya untuk hal non-obvious (mis. alasan `ponytail:` pada simplifikasi sengaja).

## Definition of done

1. `npm run build` lulus (type-check + lint).
2. Responsif 375 / 768 / 1024 / 1440 px, tanpa scroll horizontal.
3. Keyboard: Tab ke semua kontrol, focus ring terlihat, `aria-pressed` benar.
4. Tanpa emoji sebagai ikon, tanpa teks kontras rendah.
5. Commit kecil, pesan imperatif (`Add ...`, `Fix ...`). Push hanya setelah tanya + izin pemilik repo (lihat `RULE.md`).

## Memory repo

Keputusan/gotcha proyek ada di `.opencode/memory/` (baca `INDEX.md` dulu).

```bash
python3 .opencode/memory/mem.py search "kata kunci"
python3 .opencode/memory/mem.py recent 15
python3 .opencode/memory/mem.py sync     # setelah menulis .md baru
```

Simpan hanya yang tidak terbaca dari kode; jangan duplikasi isi `AGENTS.md`/`RULE.md`/`DESIGN.md`.
Jangan tulis ke `~/.config/opencode/memory/` untuk proyek ini; memory TopGirl hanya di `.opencode/memory/`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
