# topgirl

Team builder + galeri foto artist. Next.js 16, data di Supabase (Postgres + Storage).

## Setup lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run seed                 # sekali: isi tabel dari data/artists.csv
npm run dev                  # http://localhost:3000
```

Cek bobot skor/tier terhadap DB: `npm run check:scores`.

`.env.local`:

| Variabel | Isi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (aman di client) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key — **server only**, jangan pernah di-commit |
| `NEXT_PUBLIC_SITE_URL` | opsional, origin situs untuk callback OAuth; kosong = `VERCEL_*` lalu `localhost:3000` |

Login memakai Supabase Auth provider **Google** dan **Discord** (provider email dimatikan).
Callback OAuth: `https://<ref>.supabase.co/auth/v1/callback`.

## Halaman

- `/` — redirect ke locale browser (`id` default).
- `/id`, `/en`, `/fr`, `/ko`, `/zh`, `/ja`, `/de` — team builder (roster di-cache 5 menit). Pilih **season server** untuk melihat peringkat relatif dan menyusun tim terbaik dari artis yang bisa diperoleh. Artis di atas season server tetap tampil di section "Belum bisa diperoleh" dan tetap boleh dipilih, dengan peringatan.
- `/{locale}/login` — masuk dengan Google/Discord.
- `/{locale}/profile` — profil, avatar, nama dan ID game.
- `/{locale}/lineups` — simpan dan bagikan tim.
- `/{locale}/l/<share_slug>` — lineup publik read-only, `noindex`.

## Skema

`supabase/schema.sql` — tabel `artists`, `artist_skills`, `artist_seasons` (season artis aboard, read-only), tabel opsi `genres` (termasuk `image` ikon)/`origins`/`effects`, bucket `artist-thumb` dan `avatar`, RLS select-only untuk anon. Ditambah `profiles`, `user_artists`, `lineups` dengan RLS aktif **tanpa policy** (akses hanya lewat server action `service_role`). Perubahan skema lewat migration di Supabase, lalu file ini diperbarui di commit yang sama.

`data/artists.csv` = bahan seed, bukan sumber runtime. Foto runtime hanya dari bucket `artist-thumb`.

## Deploy

Dashboard Vercel → import repo GitHub. Set env di atas pada project Vercel. Deploy dari `main` otomatis.
