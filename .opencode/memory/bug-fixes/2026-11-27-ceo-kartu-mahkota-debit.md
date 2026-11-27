# Biaya Upgrade

## 2026-11-27 — Penampilan CEO: Kartu mahkota vs Kartu debit (bukan bug DB)

Masalah awal: di situs dua kartu terlihat "tertukar". Hasil investigasi: **DB
benar**, datanya persis mengikuti config game. Jangan migration.

Sumber di dump (`.topgirl-ripper/work/upgrades/`):
- `CCeoAppearanceOutfitAdvance` (promosi tampilan) → `PartUpgradeCost` item
  `11113622`, LcName `LC_IDOL_ceo_appearance_outfit_advance_item_name` =
  **Kartu mahkota** / en Crown Card. Nominal 250/500/1000/3000/6000.
- `CCeoAppearanceOutfitLevel` (buka outfit) → `ClassUpgradeCost` item
  `11113621`, LcName `..._outfit_level_item_name` = **Kartu debit** / en Debit
  Card. Nominal per tampilan 200/1000/2000/4000/6000.
- Deskripsi loc: crown "used to promote", debit "used to upgrade outfit level".

Ikon (dikonfirmasi pemilik akun, bukan bisa dibaca dari aset):
- **Kartu mahkota = hitam** (`UI_Icon_CEO_BankCard_02`) → promosi tampilan.
- **Kartu debit = emas** (`UI_Icon_CEO_BankCard_01`) → outfit.
- Pemetaan di `lib/cost-icons.ts` (`NAMES`) sudah benar; sempat dikira tertukar
  karena tab Stage/Outfit dipisah, bukan karena data.

Akibat desain UI: promosi + outfit digabung dalam satu panel **Tampilan** —
pilih tampilan sekarang/target, hasil keluar dua baris (mahkota = promosi,
debit = 4 outfit di tampilan target). Villa memakai pola sama (draf desain vila
= naik stage, drone konstruksi = 4 suite di stage target).

Gotcha lain: nama aset game untuk komponen mobil tertukar — Busi =
`IgnitionCoil_*`, Koil = `SparkPlug_*`.
