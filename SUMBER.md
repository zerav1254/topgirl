# Sumber aset & data

Catatan provenance internal: dari mana data dan aset visual situs ini berasal.
Bukan klaim kepemilikan — aset visual milik A3Games (lihat `lib/docs.ts`, bagian
"Aset dan hak cipta" dan "Sumber data").
| Aset / data | Sumber | Cara ambil | Tanggal | Bukti di repo |
| --- | --- | --- | --- | --- |
| Stat, skill, season (`artists`, `artist_skills`, `artist_seasons`) | dump berkas game `com.a3.topgirl.gplay` — `CHeroData`, `CHeroStar` (config CFI2 `*.bytes`) | decode + skrip | ±2025-11 | `data/artists.csv`, `scripts/seed-supabase.mjs` |
| Biaya upgrade, mobil, HQ, villa, koleksi, CEO | tabel `C*Upgrade*` di dump yang sama | decode + skrip | ±2025-11 | `lib/cost-*.ts`, `components/cost/` |
| Foto artist (`artist-thumb`) | aset game | ekstrak dari APK | ±2025-11 | bucket `artist-thumb`, `assets-backup/` |
| Ikon genre, logo, frame avatar, ikon upgrade | aset game | ekstrak dari APK | ±2025-11 | `public/assets/` |
| Entri manual (hero belum terpetakan) | dalam game | screenshot | ±2025-11 | `docs/screeshots/`, `docs/hero-belum-diketahui.md` |

Riwayat: stat awal roster pada versi pertama situs memakai CSV komunitas
(`docs/Girls List + Team Builder (1_7_2025) - Stats.csv`). Seluruh nilai tersebut
sudah diganti dengan hasil pembacaan berkas game; tidak ada sisa data komunitas.

## Aturan ke depan

- Ingest baru (artis, aset, biaya): tambah baris di tabel ini + tanggal.
- Sumber = dump game → identitas pemilik A3Games.
- Jangan pernah klaim aset sebagai milik situs; jangan pasang watermark brand di aset game.
