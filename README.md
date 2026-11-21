# topgirl

Team builder + editor stat artist. Next.js 15, data di Supabase (Postgres + Storage).

## Setup lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run seed                 # sekali: isi tabel + upload thumb dari data/artists.csv
npm run dev                  # http://localhost:3000
```

`.env.local`:

| Variabel | Isi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (aman di client) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key — **server only**, jangan pernah di-commit |
| `ADMIN_PASSWORD` | password halaman `/isi` |
| `AUTH_SECRET` | string acak panjang untuk tanda tangan cookie |

## Halaman

- `/` — team builder (revalidate 5 menit; di-refresh langsung setelah simpan).
- `/isi` — login admin → isi base stat, skill, dan foto 320×320 WebP.

## Skema

`supabase/schema.sql` — tabel `artists`, `artist_skills`, bucket `artist-thumb`, RLS select-only untuk anon. Perubahan skema lewat migration di Supabase, lalu file ini diperbarui di commit yang sama.

`data/artists.csv` + `public/assets/images/artists/thumb/` = bahan seed, bukan sumber runtime.

## Deploy

Dashboard Vercel → import repo GitHub. Set 5 env di atas pada project Vercel. Deploy dari `main` otomatis.
