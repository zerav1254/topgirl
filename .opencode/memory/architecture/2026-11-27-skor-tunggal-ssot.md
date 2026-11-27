# Skor Artist

## 2026-11-27 — Satu kategori skor `global` jadi SSOT

Keputusan: seluruh situs memakai **satu** skor (0–100) dan satu tier. Mesin
kategori lama (`CATEGORIES`, `Category`, `DEFAULT_CATEGORY`, `scores`/`tiers` per
kategori) dihapus, bukan sekadar tidak dipakai.

Rumus (alasan, bukan terbaca dari kode):
- Game hanya menghitung **Sing × Dance**; role (Vokal/Dance/Visual/… ) **tidak**
  punya bonus sendiri, jadi role tidak masuk skor.
- Stat stage dipakai pada level maksimum artist itu, bukan level sekarang; artist
  yang baru sebagian naik level tidak boleh terlihat lebih buruk.
- Campuran: `85 %` skor skill + `15 %` stat, supaya tier tetap dominan skill
  (pemain mengenal tier dari skill) sementara stat tetap membedakan.

```
statPct = min(100, sqrt(singMax * danceMax) / 52855 * 100)
skor    = min(100, skorSkill * 0,85 + statPct * 0,15)
```

- `STAT_REF = 52855` = akar dari pasangan Sing/Dance tertinggi di roster 5★.
- Tier memakai `BANDS` lama; sebaran setelah blend: S+ 8, S 14, A 28, B 26, C 14, D 8.
- Kolom DB `artists.role`, `artists.sing_max`, `artists.dance_max` (lihat
  `supabase/schema.sql`); diisi untuk 98 artist dari dump game.
- Dampak: `Artist.scores/tiers` diganti `score`/`tier`; roster, tim, lineup,
  filter, dan `/info` ikut satu skor. Penjelasan rumus ke pengguna ada di
  `app/[locale]/info/page.tsx`.
- Cek regresi: `npm run check:scores` (`scripts/score-check.mjs`).
