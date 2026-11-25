# topgirl

Team builder + editor stat artist. Next.js 16, data di Supabase (Postgres + Storage).

## Setup lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run seed                 # sekali: isi tabel + upload thumb dari data/artists.csv
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
Callback OAuth: `https://<ref>.supabase.co/auth/v1/callback`. Admin pertama diangkat lewat SQL:

```sql
update public.profiles p set role = 'admin'
from auth.identities i
where i.user_id = p.user_id and i.provider in ('google', 'discord') and i.provider_id = '<provider-id>';
```

## Halaman

- `/` — redirect ke `/id`.
- `/id`, `/en`, `/fr`, `/ko` — team builder (revalidate 5 menit; di-refresh langsung setelah simpan). Pilih **pool** origin servermu untuk melihat peringkat relatif dan menyusun tim terbaik dari yang tersedia.
- `/{locale}/manage` — isi base stat, skill, dan foto 320×320 WebP (butuh role admin).
- `/{locale}/login` — masuk dengan Google/Discord.
- `/{locale}/profile` — nama dan ID game.
- `/{locale}/lineups` — simpan dan bagikan tim.
- `/{locale}/l/<share_slug>` — lineup publik read-only, `noindex`.

## Skema

`supabase/schema.sql` — tabel `artists`, `artist_skills`, `artist_seasons` (season artis aboard, read-only), tabel opsi `genres`/`origins`/`effects`, bucket `artist-thumb`, RLS select-only untuk anon. Ditambah `profiles`, `user_artists`, `lineups` dengan RLS aktif **tanpa policy** (akses hanya lewat server action `service_role`). Perubahan skema lewat migration di Supabase, lalu file ini diperbarui di commit yang sama.

`data/artists.csv` + `public/assets/images/artists/thumb/` = bahan seed, bukan sumber runtime.

## Deploy

Dashboard Vercel → import repo GitHub. Set env di atas pada project Vercel. Deploy dari `main` otomatis.
