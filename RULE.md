# RULE.md

Aturan keras repo ini. Kalau ragu, berhenti dan tanya — jangan improvisasi.

## Tooling

- Package manager **npm** saja. Jangan buat/commit `pnpm-lock.yaml`, `yarn.lock`, atau mengubah `package-lock.json` dengan tool lain.
- Node **24** (lihat `engines`). Jangan menurunkan `engines` demi menghindari error lokal.
- Jangan menambah dependency baru kecuali sudah disepakati. Yang boleh: `@supabase/supabase-js` (akses DB/storage), `sharp` (resize foto), dan `@vercel/analytics` (Web Analytics). UI kit, icon pack, state manager, CSV library tetap dilarang.
- Sebelum commit: `npm run build` harus lulus.

## Deploy

- **Jangan** menjalankan `vercel`, `vercel deploy`, `vercel login`, atau menyentuh `.vercel/` dari mesin ini. Deploy dilakukan pemilik akun lewat dashboard Vercel (import repo GitHub, auto-deploy dari `main`).
- Secret yang dibutuhkan: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `AUTH_SECRET`. Set lewat env Vercel + `.env.local` lokal (gitignored). Jangan menaruh nilainya di repo, `.env`, log, atau komponen client.
- Jangan mengubah remote git (`origin` = `https://github.com/zerav1254/topgirl.git`).

## Data

- Sumber data runtime = Supabase (tabel `artists`, `artist_skills`, bucket `artist-thumb`). Skema tercatat di `supabase/schema.sql`.
- `data/artists.csv` hanya bahan seed (`npm run seed`). Jangan dipakai sebagai sumber runtime.
- Tier **tidak disimpan** di DB; dihitung per kategori dari skor (`SCORE`/`BANDS` di `lib/score.ts`).
- `slug` unik, huruf kecil tanpa spasi; `origin` ∈ `Tokyo Rome Bali Auction Home Event` atau NULL.
- `base_sing`/`base_dance` boleh NULL; skor memakai faktor basis netral saat kosong.
- `effect` wajib ada di tabel `effects` (FK). Kolom `unit` menentukan input: `percent` (12, 24, …) atau `flat` (DPS 200/240). Menambah `Effect` baru: insert baris `effects` + isi `unit`, lalu beri bobot di `SCORE[category]` dan skala di `FLAT_SCALE` bila unit `flat` (`lib/score.ts`).
- Opsi genre/origin/efek dibaca dari tabel `genres`, `origins`, `effects`. Menambah opsi = insert baris di tabel, jangan hardcode di komponen.
- Migrasi skema lewat Supabase migration, lalu `supabase/schema.sql` diperbarui di commit yang sama.
- Foto: bucket `artist-thumb` menyimpan `<slug>.webp` 320×320 WebP. Unggah di luar aplikasi (script/manual), lalu isi `photo_path` + `photo_updated_at`. Jangan menyimpan gambar artis di repo saat runtime.
- RLS: `anon` hanya boleh `select`. Semua tulis data aplikasi (profil, koleksi, lineup) lewat server action dengan `adminClient()` setelah sesi pengguna diverifikasi. Jangan longgarkan policy tulis.
- Jangan mengarang data artist. Hanya pemilik data yang boleh menambah/menghapus baris.

## Kode

- `"use client"` hanya di komponen yang butuh state/effect/event dan `app/[locale]/error.tsx` (error boundary wajib client di Next). Jangan jadikan `app/[locale]/layout.tsx`/`app/[locale]/page.tsx` client component.
- `lib/supabase.ts`/`lib/auth.ts` server-only: jangan impor dari client component. Client hanya boleh memanggil server action.
- `node:fs` hanya di `scripts/` (seed). Jangan impor di app/lib.
- `adminClient()` (service_role) hanya di server action/server component setelah sesi diverifikasi. Jangan pernah kirim service key ke client.
- Jangan fetch data dari browser; data dilewatkan sebagai props dari server component.
- Ukuran tim dari `TEAM_SIZE` — jangan hardcode angka 5 di tempat lain, termasuk teks UI.
- Key `localStorage` (`topgirl.team.v1`): naikkan versi bila bentuk data berubah. Jangan hapus/ubah key tanpa migrasi.
- Jangan `useEffect` untuk hal yang bisa dihitung saat render (`useMemo`/turunan langsung).
- Jangan menambah `tailwind.config.*`; token hanya di `@theme` pada `app/globals.css`.
- Ikon wajib inline SVG dari set yang sudah ada. Emoji sebagai ikon dilarang.
- Teks UI tidak boleh hardcode. Semua string tampil diambil dari `lib/dict/<locale>.ts` lewat `DICT[locale]` + `t()`; `id` default, semua locale (`en`, `fr`, `ko`) wajib ikut diisi saat menambah key.
- Bahasa ditentukan segmen URL pertama (`/id`, `/en`); `<html lang>` mengikuti locale. Jangan baca bahasa dari localStorage. Label data dari DB (`genres.label` dkk.) tidak diterjemah.

## Git

- **Push hanya setelah izin eksplisit.** Jangan jalankan `git push` (termasuk `--force`, `-u`, remote mana pun) tanpa bertanya dulu dan mendapat "ya" dari pemilik repo pada giliran itu. Izin sekali tidak berlaku untuk push berikutnya.
- Jangan rewrite history `main`, jangan commit `node_modules`, `.next`, atau `.vercel`.
- File yang dihasilkan (`next-env.d.ts`, `package-lock.json` kecuali sengaja diubah) tidak diedit manual.

## Aksesibilitas & kualitas (tidak boleh dikorbankan)

- Jangan hapus `aria-*`, `aria-hidden`, label form, atau focus ring untuk "merapikan" markup.
- Jangan mengubah kontras teks di bawah `zinc-400` untuk teks informatif.
- Jangan hapus blok `prefers-reduced-motion`.
- Jangan menambah interaksi tanpa jalur keyboard.
