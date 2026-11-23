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

**Artist card** — tombol penuh. Normal: `border-white/10 bg-panel/70`. Hover: border lebih terang + `bg-panel-2`. Terpilih: `border-gold/45 bg-gold/10` + ikon centang. Saat tim penuh: `disabled:opacity-60 disabled:cursor-not-allowed`. Skill identik di dua slot diringkas `… ×2` (efek sama itu sah, skornya tetap dijumlahkan).

**Slot tim** — daftar `<ol>` 5 baris tinggi tetap `min-h-[3.25rem]`. Kosong: border dashed + label "Slot n kosong". Terisi: avatar, nama, badge tier, genre, tombol hapus.

**Filter chip** — `rounded-lg border px-3 py-1 text-sm min-h-11` (target sentuh 44px). Empat baris berlabel di tab Artists, urut: Genre, Asal, Tier, Skill. Aktif tier = emas; aktif genre/asal/skill = merah; nonaktif `text-zinc-400` dengan hover `text-zinc-200`. Label baris `text-[11px]` uppercase `text-zinc-400`, lebar tetap `w-14`. Chip `Semua` hanya dirender saat baris itu terfilter; klik chip aktif = lepas filter. Tepi kanan baris chip diberi fade `w-8 bg-gradient-to-l from-ink to-transparent` sebagai petunjuk masih bisa digeser (scrollbar disembunyikan). Satu tombol `Reset filter` (selalu memesan lebar, `invisible` saat bersih) mengosongkan keempatnya. Urutan chip tier ikut `TIER_ORDER`; tier tanpa artist tidak ditampilkan.

**Input pencarian** — ikon SVG di kiri (`pl-9`), border fokus `focus:border-brand/60`.

**Language switcher** — satu `<select>` berisi semua bahasa (`LANG_NAME`), `h-11 rounded-lg border-white/10 bg-panel/80 text-xs`, chevron SVG absolut di kanan. Ganti bahasa = `router.push` path yang sama dengan segmen locale diganti. Di header utama mobile ia satu baris dengan tombol "Kelola data" (`justify-between`); `sm` ke atas kembali sebaris dengan judul. Di halaman login/manage posisinya di kanan atas kartu.

## Gerak

- Transisi hanya warna/border/opacity, `duration-200`. Tidak ada transform scale atau animasi layout (menghindari shift).
- Semua animasi dimatikan via `prefers-reduced-motion`.

## Aksesibilitas

- Kontras teks ≥ 4.5:1: body `zinc-100`/`zinc-300` di atas `panel`; teks sekunder minimal `zinc-400` (jangan lebih gelap untuk teks informatif).
- Focus ring global: 2px `gold`, offset 2px, `:focus-visible` saja.
- Ikon dekoratif `aria-hidden="true"`; tombol ikon wajib `aria-label`.
- Status pilihan diumumkan lewat `aria-pressed`, bukan warna saja.
- Target sentuh minimal 28×28 px (tombol kecil 7×7 Tailwind).
- `lang="id"`, label form eksplisit.

## Jangan

- Emoji sebagai ikon; ikon beda set; ukuran ikon campur.
- `bg-white/5` sebagai latar kartu utama (tidak terlihat di tema gelap).
- Shadow tebal, blur kaca, atau gradien pelangi — bukan bahasa visual app ini.
- Warna hardcode di luar token, kecuali skala `zinc` untuk teks netral.
