# Konfigurasi Deploy

## 2026-11-27 — Origin situs produksi `https://zerav.web.id`

Keputusan: default `SITE_URL` di produksi = `https://zerav.web.id`, dev tetap
`http://localhost:3000`.

- Fallback `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` **dibuang**: canonical
  jadi ikut `*.vercel.app` kalau env Vercel aktif.
- `NEXT_PUBLIC_SITE_URL` masih menang kalau diset — kalau di Vercel env ini masih
  berisi domain lama, ubah/hapus, karena env mengalahkan fallback.
- `SITE_URL` menurun ke canonical/hreflang/OG (`lib/seo.ts`), sitemap, robots,
  callback OAuth, dan tautan share lineup. Ganti domain = cukup satu tempat.
