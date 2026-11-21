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

## Struktur

```
app/
  layout.tsx        metadata + <html lang="id">
  page.tsx          server: loadArtists() -> <TeamBuilder artists={...} />, revalidate 300
  isi/
    page.tsx        server: gate login admin + <ArtistEditor />
    actions.ts      server actions: login, logout, saveArtist, uploadPhoto
  globals.css       @import "tailwindcss" + @theme tokens + base rules
components/
  team-builder.tsx  client ("use client")
  artist-editor.tsx client ("use client") — form stat + upload foto
lib/
  artists.ts        query Supabase -> tipe Artist/Effect
  score.ts          bobot skor, tier, label effect
  supabase.ts       read client (anon) + adminClient() (service_role)
  auth.ts           cookie admin HMAC
supabase/
  schema.sql        skema tabel + bucket + RLS
scripts/
  seed-supabase.mjs seed sekali jalan dari CSV + thumb lokal
data/
  artists.csv       bahan seed (bukan sumber runtime)
```

Alur data: Supabase → `lib/artists.ts` → server component (props) → client component. Tulis data hanya lewat `app/isi/actions.ts` (admin cookie + service_role). Tidak ada fetch data dari browser.

## Di mana mengubah apa

| Kebutuhan | File |
| --- | --- |
| Tambah/ubah artist, stat, skill | halaman `/isi` (DB), bukan CSV |
| Ubah skema DB | migration Supabase + `supabase/schema.sql` + `lib/artists.ts` |
| Seed ulang dari CSV/thumb lama | `scripts/seed-supabase.mjs` (`npm run seed`) |
| Auth/login admin | `lib/auth.ts` + `app/isi/actions.ts` |
| Ukuran tim | `TEAM_SIZE` di `components/team-builder.tsx` |
| Filter/sort/summary | `components/team-builder.tsx` |
| Bobot skor / ambang tier | `OFFENSE`, `SUSTAIN`, `BANDS` di `lib/score.ts` |
| Warna, font, radius, bayangan | `@theme` di `app/globals.css` |
| Metadata/SEO/`lang` | `app/layout.tsx` |

`TIER_ORDER` di `lib/score.ts` menentukan urutan tier di roster. Tier dihitung dari skor di `lib/score.ts`; menambah tier baru berarti mengubah `TIER_ORDER`, `BANDS` **dan** `TIER_STYLE`/`AVATAR_STYLE` pada `team-builder.tsx`. `EFFECTS`/`EFFECT_LABEL` juga di `lib/score.ts` (dipakai DB constraint lewat server action).

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
