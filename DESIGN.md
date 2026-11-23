# DESIGN.md

Sistem visual TopGirl Team Builder. Semua nilai berasal dari `@theme` di `app/globals.css`; jangan hardcode hex baru di komponen.

## Arah desain

Dark gaming dashboard: latar hampir hitam, panel berlapis, aksen merah agresif + emas untuk tier tertinggi. Energik, bukan playful. Data diprioritaskan (angka tabular, badge tier, grid rapat).

## Token warna

| Token | Nilai | Pakai untuk |
| --- | --- | --- |
| `ink` | `#0b0b0f` | Latar halaman |
| `panel` | `#14141a` | Kartu, input, sidebar |
| `panel-2` | `#1c1c24` | Hover kartu, slot tim terisi |
| `brand` | `#dc2626` | Aksen utama, filter genre aktif, skill |
| `gold` | `#fbbf24` | Tier S+, filter tier aktif, counter tim, focus ring |
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

- Grid utama: `grid lg:grid-cols-[1fr_22rem]`, gap `gap-6`; halaman `max-w-7xl px-4 sm:px-6 lg:px-8 py-8`.
- Roster: 1 kolom < 640px, 2 kolom `sm`, 3 kolom `xl`.
- Radius: kartu besar `rounded-2xl`, kartu artist/slot `rounded-xl`, badge/tombol kecil `rounded-lg`/`rounded-md`.
- Panel tim `lg:sticky lg:top-6`, selalu tampil paling atas di mobile (`order-1`).
- Border pemisah: `border-white/10`; hover `border-white/25`.

## Komponen

**Artist card** — kartu baca-saja (bukan tombol): pemilihan artist hanya di tab Team Builder. Normal: `border-white/10 bg-panel/70`. Artist yang sudah masuk tim: `border-gold/30 bg-gold/5` + ikon centang di pojok kanan-atas. Isi kartu: nama + skor sebaris, genre (ikon + teks), baris label **Asal** (`text-[10px]` uppercase `text-zinc-400`, nilai `text-zinc-300`), baris label **Season** hanya untuk origin `Tokyo`/`Bali`/`Rome`, lalu dua baris skill dipisah border atas — nama efek kiri (`text-zinc-400`), nilai kanan (`tabular font-semibold text-zinc-200`, `—` bila kosong). Tiap slot skill tampil sendiri (tidak digabung `×2`).

**Slot tim** — daftar `<ol>` 5 baris tinggi tetap `min-h-[3.25rem]`. Kosong: border dashed + label "Slot n kosong". Terisi: avatar, nama, badge tier, genre, tombol hapus.

**Filter dropdown** — empat `<select>` dalam grid `grid-cols-2 sm:grid-cols-4`, urut Genre, Asal, Tier, Skill. Tiap sel: label `text-[11px]` uppercase `text-zinc-400` di atas, select `h-11 rounded-lg border bg-panel/80 px-2.5 text-sm font-semibold`. Nilai `Semua` (`common.all`) selalu jadi opsi pertama; select terfilter memakai border/bg aksen (tier emas, lainnya merah), tidak terfilter `border-white/10 text-zinc-300`. Satu tombol `Reset filter` (selalu memesan lebar, `invisible` saat bersih) mengembalikan keempatnya ke `Semua`.

**Input pencarian** — ikon SVG di kiri (`pl-9`), border fokus `focus:border-brand/60`.

**Language switcher** — tombol pemicu `h-11 rounded-lg border-white/10 bg-panel/80` berisi bendera SVG (`public/assets/flags/<locale>.svg`, 20×14) + singkatan (`LANG_CODE`: ID/EN/FR/KO) + chevron; menu `role="listbox"` muncul di bawah (rata kanan), tiap opsi `min-h-11` berisi bendera + singkatan (`aria-label` = `LANG_NAME`), opsi aktif `bg-gold/10 text-gold`. Di header utama ia bertumpuk di atas tombol "Kelola data" (kolom rata kanan). Keyboard: Enter/Space buka, ArrowUp/Down pindah, Escape tutup dan fokus balik ke tombol; klik di luar menutup. Ganti bahasa = `router.push` path sama dengan segmen locale diganti, query dipertahankan.

## Gerak

- Transisi hanya warna/border/opacity, `duration-200`. Tidak ada transform scale atau animasi layout (menghindari shift).
- Semua animasi dimatikan via `prefers-reduced-motion`.

## Aksesibilitas

- Kontras teks ≥ 4.5:1: body `zinc-100`/`zinc-300` di atas `panel`; teks sekunder minimal `zinc-400` (jangan lebih gelap untuk teks informatif).
- Focus ring global: 2px `gold`, offset 2px, `:focus-visible` saja.
- Ikon dekoratif `aria-hidden="true"`; tombol ikon wajib `aria-label`.
- Status pilihan diumumkan lewat `aria-pressed`, bukan warna saja.
- Target sentuh minimal 44×44 px (`min-h-11` / `h-11 w-11`).
- `lang="id"`, label form eksplisit.

## Jangan

- Emoji sebagai ikon; ikon beda set; ukuran ikon campur.
- `bg-white/5` sebagai latar kartu utama (tidak terlihat di tema gelap).
- Shadow tebal, blur kaca, atau gradien pelangi — bukan bahasa visual app ini.
- Warna hardcode di luar token, kecuali skala `zinc` untuk teks netral.
