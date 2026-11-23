# AGENTS.md

Panduan kerja untuk agent/AI di repo ini. Baca `RULE.md` (aturan keras) dan `DESIGN.md` (token visual) sebelum mengubah apa pun.

## Stack

- Next.js 15 App Router, React 19, TypeScript strict
- Tailwind CSS v4 via `@tailwindcss/postcss` (tanpa `tailwind.config`)
- Package manager: **npm**, Node **24** (`engines` di `package.json`). Jangan pakai pnpm/yarn.
- Supabase (Postgres + Storage) untuk artist, skill, dan foto. Client: `@supabase/supabase-js`.
- `sharp` untuk resize foto upload (320×320 WebP).
- Auth admin: satu password (`ADMIN_PASSWORD`) + cookie HMAC (`AUTH_SECRET`). Tanpa library auth.

## Perintah

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # eslint (next/core-web-vitals + typescript)
npm run build    # wajib lulus sebelum commit (butuh env Supabase)
npm run seed     # isi DB + upload thumb dari CSV (butuh service_role key)
npm start
```

Jangan pernah menjalankan `next start` atau `npm start`, termasuk untuk uji lokal. Verifikasi cukup lewat `npm run dev` dan `npm run build`.

## Struktur

```
app/
  [locale]/
    layout.tsx      root layout: validasi locale + <html lang>, metadata per locale
    page.tsx        server: loadArtists() -> <TeamBuilder artists locale />, revalidate 300
    info/
      page.tsx      server: penjelasan rumus rank, bobot, dan tier (tanpa fetch DB)
    manage/
      page.tsx      server: gate login admin + <ArtistEditor locale />
      actions.ts    server actions: login, logout, saveArtist, uploadPhoto (param locale)
  globals.css       @import "tailwindcss" + @theme tokens + base rules
components/
  team-builder.tsx  client ("use client") — shell: state tim + tab + nav bawah
  artists-tab.tsx   client — tab Artists: cari + filter + roster per tier
  artist-filter.tsx client — hook + bar filter bersama (genre/asal/spesialis/skill), dipakai kedua tab
  team-tab.tsx      client — tab Team Builder: slot tim (klik slot buka dialog pilih artist), ringkasan
  bottom-nav.tsx    client — bottom nav 4 menu (Artists/Team/Info/Kelola), dirender root layout
  artist-ui.tsx     atom bersama (Icon, TierBadge, Avatar, GenreIcon, SearchInput)
  artist-editor.tsx client ("use client") — form stat + upload foto
  locale-switcher.tsx client — link ganti bahasa (ganti segmen locale di path)
lib/
  artists.ts        query Supabase -> tipe Artist/Effect
  score.ts          bobot skor, tier, label effect
  team.ts           TEAM_SIZE, STAT_ORDER, GENRE_BONUS
  team-store.ts     store tim di localStorage + query tab (BottomNav & TeamBuilder)
  supabase.ts       read client (anon) + adminClient() (service_role)
  lookups.ts        opsi dropdown dari tabel genres/origins/effects
  auth.ts           cookie admin HMAC
  i18n.ts           LOCALES, Locale, DICT, LANG_NAME, t() interpolasi, numberLocale
  dict/id.ts        sumber string UI (tipe Dict)
  dict/en|fr|ko.ts  terjemahan, wajib lengkap sesuai Dict
supabase/
  schema.sql        skema tabel + bucket + RLS
scripts/
  seed-supabase.mjs seed sekali jalan dari CSV + thumb lokal
data/
  artists.csv       bahan seed (bukan sumber runtime)
```

Alur data: Supabase → `lib/artists.ts` → server component (props) → client component. Tulis data hanya lewat `app/[locale]/manage/actions.ts` (admin cookie + service_role). Tidak ada fetch data dari browser.

## Di mana mengubah apa

| Kebutuhan | File |
| --- | --- |
| Tambah/ubah artist, stat, skill | halaman `/{locale}/manage` (DB), bukan CSV |
| Ubah skema DB | migration Supabase + `supabase/schema.sql` + `lib/artists.ts` |
| Seed ulang dari CSV/thumb lama | `scripts/seed-supabase.mjs` (`npm run seed`) |
| Auth/login admin | `lib/auth.ts` + `app/[locale]/manage/actions.ts` |
| Teks UI / bahasa baru | `lib/dict/*.ts` (+ `LOCALES`/`LANG_NAME` di `lib/i18n.ts`) |
| Ukuran tim | `TEAM_SIZE` di `lib/team.ts` |
| Filter/sort/summary | `components/artist-filter.tsx` (filter shared), `components/artists-tab.tsx` (roster), `components/team-tab.tsx` (ringkasan tim) |
| Bobot skor / ambang tier | `SCORE` per kategori + `BANDS` di `lib/score.ts` |
| Teks halaman info rank | `app/[locale]/info/page.tsx` + `info` di `lib/dict/*.ts` |
| Warna, font, radius, bayangan | `@theme` di `app/globals.css` |
| Metadata/SEO/`lang` | `app/layout.tsx` |

`TIER_ORDER` di `lib/score.ts` menentukan urutan tier di roster. Tier dihitung per kategori (`CATEGORIES`/`SCORE`) di `lib/score.ts`; menambah tier baru berarti mengubah `TIER_ORDER`, `BANDS` **dan** `TIER_STYLE`/`AVATAR_STYLE` pada `components/artist-ui.tsx`. Menambah kategori berarti mengisi `CATEGORIES`, `SCORE`, label di `lib/dict/*.ts`, dan pemilih di `components/team-builder.tsx`. `EFFECTS`/`EFFECT_LABEL` juga di `lib/score.ts` (dipakai DB constraint lewat server action).

## Konvensi kode

- TypeScript strict; hindari `any`. Tipe data ada di `lib/artists.ts`.
- `lib/supabase.ts`/`lib/auth.ts` server-only; client hanya boleh impor server action. Akses `fs` hanya di `scripts/`.
- State persisten: `localStorage` key `topgirl.team.v1` (bump versi kalau bentuk data berubah).
- Komponen baru: default server. Tambahkan `"use client"` hanya bila butuh state/effect/event.
- Ikuti pola yang ada: fungsi 1 layar, nama `camelCase`, komponen `PascalCase`, kelas Tailwind urut layout → warna → state.
- Jangan menambah dependency UI/icon library; ikon = inline SVG (`Icon` di `team-builder.tsx`).
- Komentar hanya untuk hal non-obvious (mis. alasan `ponytail:` pada simplifikasi sengaja).

## Definition of done

1. `npm run build` lulus (type-check + lint Next).
2. Cek 375 / 768 / 1024 / 1440 px, tanpa scroll horizontal.
3. Keyboard: Tab ke semua kontrol, focus ring terlihat, `aria-pressed` benar.
4. Tidak ada emoji sebagai ikon; tidak ada teks kontras rendah.
5. Commit kecil, pesan imperatif (`Add ...`, `Fix ...`). Push hanya setelah tanya + izin pemilik repo (lihat `RULE.md`).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
