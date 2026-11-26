# DESIGN.md

Sistem visual TopGirl Team Builder. Semua nilai berasal dari `@theme` di `app/globals.css`; jangan hardcode hex baru di komponen.

## Arah desain

Dark gaming dashboard: latar hampir hitam, panel berlapis, aksen merah agresif + emas untuk tier tertinggi. Energik, bukan playful. Data diprioritaskan (angka tabular, badge tier, grid rapat).

## Token warna

| Token | Nilai | Pakai untuk |
| --- | --- | --- |
| `ink` | `#0b0b0f` | Latar halaman |
| `panel` | `#14141a` | Kartu, input, dialog |
| `panel-2` | `#1c1c24` | Hover kartu, slot tim terisi |
| `brand` | `#dc2626` | Aksen utama, filter genre aktif, skill |
| `gold` | `#fbbf24` | Tier S+, filter Spesialis aktif, counter tim, focus ring |
| teks utama | `zinc-100` | Judul, nama artist |
| teks sekunder | `zinc-400` | Metadata, label, deskripsi |
| teks lemah | `zinc-400` | Placeholder, hint, unit, label kecil (jangan pakai `zinc-500`/`zinc-600` untuk teks — kontras < 4,5:1) |

Latar memakai dua `radial-gradient` (merah 18% kiri-atas, emas 10% kanan-atas) di `body`.

Warna tier:

| Tier | Warna | Nuansa |
| --- | --- | --- |
| S+ | gold | juara |
| S | brand (merah) | elite |
| A | purple | tinggi |
| B | sky | menengah |
| C | emerald | dasar |
| D | zinc | rendah |

Badge tier: `border-<warna>/45 bg-<warna>/15 text-<warna>-300` (S+ pakai `text-gold`). Avatar: gradien `from-<warna>/80 to-<warna>/…` dengan inisial 2 huruf.

## Tipografi

- Family: Inter (`--font-sans`) untuk teks, Sora (`--font-display`) untuk judul/badge, Noto Sans KR (`--font-ko`) sebagai fallback glyph Hangul sesudah Inter/Sora. Dimuat lewat `next/font` di `app/[locale]/layout.tsx` (self-host, tanpa request ke Google saat runtime); Noto `preload: false` supaya tidak diunduh di locale non-Korea.
- Skala: h1 `text-xl`→`sm:text-2xl` bold tracking-tight; judul panel `text-sm` semibold uppercase tracking-wide; body `text-sm`; metadata `text-xs`; badge `text-sm`.
- Angka & komposisi tier: kelas `.tabular` (`font-variant-numeric: tabular-nums`).
- Huruf besar hanya untuk label seksi, bukan isi data.

## Spasi & layout

- Satu kolom: shell `mx-auto flex max-w-4xl flex-col gap-4 px-4 pt-4 pb-28 sm:px-6 sm:pt-6`. Halaman Artists (`/{locale}`) dan Team (`/{locale}/team`) dipilih lewat bottom nav, bukan bar tab di dalam halaman.
- Roster: 2 kolom < 640px, 3 kolom `sm`, 4 kolom `md`.
- Radius: kartu besar `rounded-2xl`, kartu artist/slot `rounded-xl`, badge/tombol kecil `rounded-lg`/`rounded-md`.
- Border pemisah: `border-white/10`; hover `border-white/25`.

## Komponen

**Artist card** — kartu ringkas yang bisa dibuka (native `<details>`): baris ringkas berisi avatar persegi 56 px, nama + skor sebaris, genre (ikon + teks), ikon centang bila sudah di tim, dan chevron yang berputar saat terbuka. Isi terbuka: badge rank + tier, asal/share season ringkas, peringatan `pool.blocked`, dua baris skill (nama efek `text-zinc-400`, nilai `tabular font-semibold`), lalu tombol tim dan tombol koleksi `min-h-11` dengan `aria-pressed`. Kartu yang sudah di tim: `border-gold/30 bg-gold/5`. `<summary>` punya focus ring `outline-gold`.

Saat login, kartu menambah satu tombol koleksi selebar kartu di bawah skill: `min-h-11 rounded-lg` (`rounded-none` mengikuti sudut kartu), `border-t`. Belum punya: `border-white/10 text-zinc-400 hover:text-zinc-200`. Sudah punya: `border-emerald-500/30 bg-emerald-500/10 text-emerald-300`. Status `aria-pressed`, `aria-label` memakai `collection.markOwned`/`markMissing` + nama artist. Tombol ini tidak membuka dialog; ia hanya menandai kepemilikan.

**Rank badge** (mode pool) — pengganti `TierBadge` di pojok kartu: `tabular` `#n` tebal + `/{total}` `zinc-400`, `aria-label` "Peringkat n dari total". Tier badge tetap dipakai saat pool kosong (skala absolut). Saat pool aktif, tier yang tampil dihitung relatif terhadap pool (`poolTiers`: sekitar 7% S+, 15% S, 31% A, 26% B, 11% C, sisanya D), sehingga server season awal tetap punya sebaran tier lengkap. Tier absolut hanya dipakai di halaman Info dan lineup publik.

**Pool chips** — satu baris chip season (`Semua` + angka season) single-select. Urutan season menaik. Aktif: `border-gold/50 bg-gold/10 text-gold`; idle: `border-white/10 bg-panel/80 text-zinc-300`. `min-h-11`, `aria-pressed`.

**Lineup list** — kartu `rounded-xl border-white/10 bg-panel/70 p-3` per lineup: tumpukan avatar 5 slot (slot kosong bergaris putus-putus), nama (truncate) + `n/5` (`tabular`, `TEAM_SIZE`), badge status tautan (`shared`/`private`), progress bar emas, lalu baris tombol `min-h-11`: Bagikan/Cabut, Salin, Buka, dan Hapus (`ml-auto`, hover merah). Hapus wajib konfirmasi `window.confirm`. Salin mengumumkan hasil lewat `role="status"`.

**Slot tim** — daftar `<ol>` 5 baris `min-h-[4rem]`. Kosong: `border-dashed border-white/10` + label "Slot n kosong". Terisi: `border-white/15 bg-panel-2`, avatar, nama, badge tier, genre, skor kategori aktif, tombol hapus. Baris terisi bisa diklik membuka dialog pemilih slot (`<dialog>` `w-[min(100%-2rem,32rem)]` berisi filter bersama + daftar kandidat dengan detail skill).

**Filter dropdown** — empat `<select>` dalam grid `grid-cols-2 sm:grid-cols-4`, urut Genre, Asal, Spesialis, Skill. Tiap sel: label `text-[11px]` uppercase `text-zinc-400` di atas, select `h-11 rounded-lg border bg-panel/80 px-2.5 text-base font-semibold` (`text-base`, bukan `text-sm`, agar Safari iOS tidak auto-zoom saat fokus). Nilai `Semua` (`common.all`) selalu jadi opsi pertama; select terfilter memakai border/bg aksen (Spesialis emas, lainnya merah), tidak terfilter `border-white/10 text-zinc-300`. Filter Spesialis juga menentukan kategori skor/tier yang ditampilkan (`Semua` = SOLO). Satu state filter dipakai bersama tab Artists, tab Team, dan dialog slot. Di bawah `sm`, panel filter (chip koleksi + empat select) dilipat di balik tombol `Filter` dengan jumlah filter aktif; di `sm` ke atas selalu tampil. Tombol `Reset filter` selalu memesan lebar: ikon tutup di mobile, teks di `sm` ke atas, `invisible` saat bersih.

**Input pencarian** — ikon SVG di kiri (`pl-9`), border fokus `focus:border-brand/60`.

**Bottom nav** — 4 menu (Artists/Team/Lineup/Profil), `grid-cols-4`, item `min-h-14`, status aktif `text-gold bg-gold/10` + `aria-current="page"`, badge jumlah tim memakai `sr-only` untuk angka.

**Language switcher** — tombol pemicu `h-11 rounded-lg border-white/10 bg-panel/80` berisi bendera SVG (`public/assets/flags/<locale>.svg`, 20×14) + singkatan (`LANG_CODE`: ID/EN/FR/KO) + chevron; menu `role="listbox"` muncul di bawah (rata kanan), tiap opsi `min-h-11` berisi bendera + singkatan (`aria-label` = `LANG_NAME`), opsi aktif `bg-gold/10 text-gold`. Berada di header, rata kanan. Keyboard: Enter/Space/ArrowUp/ArrowDown buka, ArrowUp/Down pindah opsi, Escape tutup dan fokus balik ke tombol; fokus keluar dari grup atau klik di luar menutup. Ganti bahasa = `router.push` path sama dengan segmen locale diganti, query dipertahankan.

## Gerak

- Transisi hanya warna/border/opacity, `duration-200`. Tidak ada transform scale atau animasi layout (menghindari shift).
- Semua animasi dimatikan via `prefers-reduced-motion`.

## Aksesibilitas

- Kontras teks ≥ 4.5:1: body `zinc-100`/`zinc-300` di atas `panel`; teks sekunder minimal `zinc-400` (jangan lebih gelap untuk teks informatif).
- Focus ring global: 2px `gold`, offset 2px, `:focus-visible` saja.
- Ikon dekoratif `aria-hidden="true"`; tombol ikon wajib `aria-label`.
- Status pilihan diumumkan lewat `aria-pressed`, bukan warna saja.
- Target sentuh minimal 44×44 px (`min-h-11` / `h-11 w-11`).
- `lang` mengikuti locale aktif (`id`/`en`/`fr`/`ko`), label form eksplisit.

## Jangan

- Emoji sebagai ikon; ikon beda set; ukuran ikon campur.
- `bg-white/5` sebagai latar kartu utama (tidak terlihat di tema gelap).
- Shadow tebal, blur kaca, atau gradien pelangi — bukan bahasa visual app ini.
- Warna hardcode di luar token, kecuali skala `zinc` untuk teks netral.
