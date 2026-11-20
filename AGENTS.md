# AGENTS.md

Panduan kerja untuk agent/AI di repo ini. Baca `RULE.md` (aturan keras) dan `DESIGN.md` (token visual) sebelum mengubah apa pun.

## Stack

- Next.js 15 App Router, React 19, TypeScript strict
- Tailwind CSS v4 via `@tailwindcss/postcss` (tanpa `tailwind.config`)
- Package manager: **npm**, Node **24** (`engines` di `package.json`). Jangan pakai pnpm/yarn.
- Tanpa database, tanpa auth, tanpa API route. Data statis dari CSV.

## Perintah

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # wajib lulus sebelum commit
npm start
```

## Struktur

```
app/
  layout.tsx        metadata + <html lang="id">
  page.tsx          server component: loadArtists() -> <TeamBuilder artists={...} />
  globals.css       @import "tailwindcss" + @theme tokens + base rules
components/
  team-builder.tsx  satu-satunya client component ("use client")
lib/
  artists.ts        parser CSV + tipe Artist/Skill + urutan tier
topgirl-artist.csv  sumber data tunggal
```

Alur data satu arah: CSV → `lib/artists.ts` → `app/page.tsx` (server) → `TeamBuilder` (props) → state UI. Tidak ada fetch di client.

## Di mana mengubah apa

| Kebutuhan | File |
| --- | --- |
| Tambah/ubah artist | `topgirl-artist.csv` saja |
| Ubah kolom CSV | `lib/artists.ts` (`loadArtists`, tipe `Artist`) |
| Ukuran tim | `TEAM_SIZE` di `components/team-builder.tsx` |
| Filter/sort/summary | `components/team-builder.tsx` |
| Warna, font, radius, bayangan | `@theme` di `app/globals.css` |
| Metadata/SEO/`lang` | `app/layout.tsx` |

`TIER_ORDER` di `lib/artists.ts` menentukan urutan tier di roster. Tier baru di CSV harus ditambahkan di sana **dan** di `TIER_STYLE`/`AVATAR_STYLE` pada `team-builder.tsx`.

## Konvensi kode

- TypeScript strict; hindari `any`. Tipe data ada di `lib/artists.ts`.
- Semua akses `fs` hanya di `lib/artists.ts` (server). Client component tidak boleh impor `node:*`.
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
