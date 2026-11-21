# Base stat: data resmi vs akun sendiri

Catatan pengukuran base stat artist, dibandingkan antara data yang dipakai aplikasi
dan angka nyata di akun pemilik repo.

## Sumber angka

| Sumber | Isi |
| --- | --- |
| `data/artists.csv` / tabel `artists` | Angka dari daftar pihak ketiga (Girls List 1/7/2025), asumsi level 140 + triple gold skill |
| `base-stats.md` | Angka akun sendiri, format `Nama : sing, dance, Region N` |

Angka resmi berasal dari akun orang lain, jadi mengandung buff global akun pembuat
(villa, museum, kendaraan, HQ, dan buff akun lain) yang tidak tercatat.

## Sampel terukur

Data resmi (baseline) vs akun sendiri:

| Artist | Posisi | SING resmi | SING akun | DANCE resmi | DANCE akun | Total resmi | Total akun | Rasio |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Claudius | Vocalist | 34827 | 29463 | 25071 | 16885 | 59898 | 46348 | 0,7738 |
| Antonia | Dancer | 25071 | 16885 | 34827 | 29463 | 59898 | 46348 | 0,7738 |
| Flora | Center | 29950 | 23175 | 29950 | 23175 | 59900 | 46350 | 0,7738 |

Selisih:

| Artist | Δ SING | Δ DANCE | Δ Total |
| --- | ---: | ---: | ---: |
| Claudius | −5364 (−15,4%) | −8186 (−32,7%) | −13550 (−22,6%) |
| Antonia | −8186 (−32,7%) | −5364 (−15,4%) | −13550 (−22,6%) |
| Flora | −6775 (−22,6%) | −6775 (−22,6%) | −13550 (−22,6%) |

## Kesimpulan

Rasio akun/resmi **identik 0,7738** pada tiga artist dengan posisi berbeda
(Vocalist, Dancer, Center) dan pembagian SING/DANCE berbeda.

Artinya selisih bukan sifat per-artist, melainkan **pengali global akun**:

```
resmi = base_artis × (1 + buff_global_pembuat) × level × gold_skill
akun  = base_artis × (1 + buff_global_sendiri) × level × gold_skill

rasio = akun / resmi
      = (1 + buff_sendiri)/(1 + buff_pembuat) × (level/gold sendiri)/(level/gold pembuat)
```

Total akun juga hampir konstan (46348–46350, beda 2 poin = pembulatan), jadi level
dan tingkat gold skill relatif seragam di akun ini.

## Dampak ke skor

`scoreArtist` memakai `baseMult = (base_sing + base_dance) / BASE_REF` dengan
`BASE_REF = 49918` (kohort Tokyo 1 / Rome 1 / Bali 1).

- Pengali global yang sama untuk semua artist **saling menghapus** saat membandingkan
  artist satu sama lain. Urutan dan tier relatif tidak berubah karena buff akun.
- Yang berubah hanya skala absolut. Contoh Claudius: `baseMult` 1,2 → 0,9285,
  skor 80,6 → 62,4, tier S → A.
- Menurunkan `BASE_REF` ke total akun sendiri hanya menggeser semua skor, bukan
  peringkat.

## Aturan praktis

1. **Jangan isi `base_sing`/`base_dance` di DB/CSV dengan angka akun sendiri.**
   Baseline harus tetap satu sumber (data resmi) supaya cohort musim tetap terbaca.
2. Prediksi stat artist yang belum dimiliki: `total_resmi × 0,7738`.
3. Buff global baru bersifat multiplikatif: `stat_baru = stat_sekarang × (1 + Δbuff)`,
   bukan menambah persentase dari selisih.
4. Kalau rasio antar-artist berbeda >2%, berarti level/gold skill per artist belum
   setara — bukan buff global.

## Angka akun yang belum bisa dibandingkan

`base-stats.md` berisi artist baru (Bali 11–14, Roma 12) yang baseline resminya belum
ada di data. Total akunnya:

| Artist | Region | Total akun |
| --- | --- | ---: |
| Sienna | Bali 11 | 55616 |
| Sloane | Rome 12 | 55616 |
| Margot | Bali 11 | 55036 |
| Valentina | Bali 11 | 55036 |
| Kendell | Rome 12 | 55036 |
| Valerie | Rome 12 | 55036 |
| Momosaki | Bali 14 | 66738 |
| Arashi | Bali 14 | 66738 |
| Momona | Bali 14 | 66738 |

Dengan rasio 0,7738, baseline tersirat = total akun / 0,7738 (mis. Momosaki ≈86249,
Sienna ≈71877). Angka ini belum diverifikasi karena belum ada sumber resmi untuk
kohort tersebut.

## Cara mengukur ulang

1. Pilih 2–3 artist yang dimiliki, dari kohort yang sama (total baseline sama).
2. Bandingkan `base_sing`/`base_dance` resmi dengan angka akun.
3. Hitung rasio per artist. Rasio seragam → buff global. Rasio menyimpang → level/gold.
4. Setelah buff akun naik, cukup ambil satu sampel baru untuk memperbarui rasio.
