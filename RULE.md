# RULE.md

Aturan keras repo ini. Kalau ragu, berhenti dan tanya — jangan improvisasi.

## Tooling

- Package manager **npm** saja. Jangan buat/commit `pnpm-lock.yaml`, `yarn.lock`, atau mengubah `package-lock.json` dengan tool lain.
- Node **24** (lihat `engines`). Jangan menurunkan `engines` demi menghindari error lokal.
- Jangan menambah dependency baru (UI kit, icon pack, state manager, CSV library, formatter tanggal). Stack yang ada sudah cukup; tulis manual.
- Sebelum commit: `npm run build` harus lulus.

## Deploy

- **Jangan** menjalankan `vercel`, `vercel deploy`, `vercel login`, atau menyentuh `.vercel/` dari mesin ini. Deploy dilakukan pemilik akun lewat dashboard Vercel (import repo GitHub, auto-deploy dari `main`).
- Jangan menaruh token/secret di repo, `.env`, atau log. Tidak ada secret yang dibutuhkan app ini.
- Jangan mengubah remote git (`origin` = `https://github.com/zerav1254/topgirl.git`).

## Data

- `data/artists.csv` adalah **satu-satunya** sumber data. Jangan duplikasi data ke `.ts`/`.json` atau ke komponen.
- Skema kolom: `id,slug,name,genre,base_sing,base_dance,s1_effect,s1_value,s2_effect,s2_value`.
  - `slug` unik, huruf kecil, tanpa spasi.
  - `base_sing`/`base_dance` boleh kosong; skor memakai faktor basis netral saat kosong.
  - `sN_effect` ∈ `Effect` di `lib/artists.ts`; `sN_value` angka tanpa `%` (DPS tetap flat 200/240).
  - Slot skill boleh kosong; artist dengan satu skill cukup isi `s1_*`.
- Tier **tidak disimpan** di CSV. Tier dihitung dari skor (`BANDS` di `lib/artists.ts`).
- Mengubah skema wajib disertai update `lib/artists.ts` **dan** schema di README/RULE ini dalam commit yang sama.
- Tier baru wajib ditambahkan di `TIER_ORDER`, `BANDS`, `TIER_STYLE`, dan `AVATAR_STYLE`. Kalau tidak, badge jatuh ke gaya D.
- Menambah `Effect` baru wajib disertai bobot di `OFFENSE`/`SUSTAIN` (atau sengaja 0) dan label di `EFFECT_LABEL`.
- Jangan mengarang data artist. Hanya pemilik data yang boleh menambah/menghapus baris.

## Kode

- `"use client"` hanya di `components/team-builder.tsx` (atau komponen interaktif baru). Jangan jadikan `app/layout.tsx`/`app/page.tsx` client component.
- Jangan impor `node:fs`/`node:path` di luar `lib/artists.ts`.
- Jangan fetch data dari browser; data dilewatkan sebagai props dari server component.
- Ukuran tim dari `TEAM_SIZE` — jangan hardcode angka 5 di tempat lain, termasuk teks UI.
- Key `localStorage` (`topgirl.team.v1`): naikkan versi bila bentuk data berubah. Jangan hapus/ubah key tanpa migrasi.
- Jangan `useEffect` untuk hal yang bisa dihitung saat render (`useMemo`/turunan langsung).
- Jangan menambah `tailwind.config.*`; token hanya di `@theme` pada `app/globals.css`.
- Ikon wajib inline SVG dari set yang sudah ada. Emoji sebagai ikon dilarang.
- Semua teks UI berbahasa Indonesia, sesuai `lang="id"`.

## Git

- **Push hanya setelah izin eksplisit.** Jangan jalankan `git push` (termasuk `--force`, `-u`, remote mana pun) tanpa bertanya dulu dan mendapat "ya" dari pemilik repo pada giliran itu. Izin sekali tidak berlaku untuk push berikutnya.
- Jangan rewrite history `main`, jangan commit `node_modules`, `.next`, atau `.vercel`.
- File yang dihasilkan (`next-env.d.ts`, `package-lock.json` kecuali sengaja diubah) tidak diedit manual.

## Aksesibilitas & kualitas (tidak boleh dikorbankan)

- Jangan hapus `aria-*`, `aria-hidden`, label form, atau focus ring untuk "merapikan" markup.
- Jangan mengubah kontras teks di bawah `zinc-400` untuk teks informatif.
- Jangan hapus blok `prefers-reduced-motion`.
- Jangan menambah interaksi tanpa jalur keyboard.
