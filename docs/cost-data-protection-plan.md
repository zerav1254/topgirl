# Perlindungan data kalkulator

## Tujuan

Struktur tabel dan data mentah biaya mobil, HQ, vila, koleksi, museum, dan CEO tidak tersedia untuk scraping melalui Supabase REST maupun payload browser. Kalkulator artis tetap publik.

## Model akses akhir

- Data roster dan kalkulator artis: publik.
- Data biaya lain: hanya dibaca server memakai `service_role`.
- Browser pengguna login menerima opsi UI minimum dan hasil agregat per perhitungan, bukan kurva atau tabel mentah.
- Setiap kalkulasi private memerlukan sesi valid, validasi runtime, rate limit global per user/domain, dan batas harian gabungan.
- Error DB dicatat di server tanpa dikirim ke client.

## Tahap dan commit

1. **Pisahkan data artis publik**
   - Tambah tipe dan loader `ArtistCostBook`.
   - Anonymous hanya menjalankan query artis/peak.
   - Hapus placeholder `artistCostBook()`.

2. **Pindahkan kalkulasi private ke server**
   - Server Action per domain: mobil, HQ, vila, koleksi, CEO.
   - Loader/options private tetap server-only.
   - Response hanya hasil agregat untuk input spesifik.
   - UI tidak menerima `CostBook` private.

3. **Batasi abuse kalkulator**
   - Rate limit per user/domain dan batas harian global.
   - Tolak input di luar rentang serta enum/key tak dikenal.
   - Respons error generik.

4. **Cabut akses DB client**
   - Hapus policy SELECT `authenticated` dari seluruh tabel/view biaya private.
   - Cabut grant SELECT `authenticated`.
   - Pertahankan akses roster publik yang memang dibutuhkan.

5. **Verifikasi**
   - JWT authenticated tidak dapat membaca tabel/view private lewat REST.
   - Payload browser tidak mengandung kurva biaya mentah.
   - Seluruh kalkulator tetap menghasilkan hasil sama.
   - `npm run check:lib` dan `npm run build` lulus.

## Batas perlindungan

Hasil yang terlihat tetap dapat dicatat dan direkonstruksi perlahan. Target realistis: ekstraksi massal menjadi lambat, mahal, terdeteksi, dan dapat diblokir tanpa merusak penggunaan normal.
