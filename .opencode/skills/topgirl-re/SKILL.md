---
name: topgirl-re
description: Use when reverse-engineering the TopGirl APK (com.a3.topgirl.gplay) in this repo — decoding CFI2 *.bytes configs, reading Cfg.* tables through Frida/il2cpp, checking damage/skill/power constants, or extending artifacts under .topgirl-ripper/. Trigger on "decode CFI2", "baca const_config", "hook frida topgirl", "cek konstanta damage".
metadata:
  version: 1.0.0
---

# TopGirl RE

Semua artefak di `.topgirl-ripper/` (gitignored). Temuan wajib masuk
`.topgirl-ripper/FINDINGS.md` sebelum dilaporkan ke user.

## Environment

- Device Redmi Note 9, adb `819390770503`, Magisk root, `frida-server` 17.27.6,
  package `com.a3.topgirl.gplay` v1.0.158.
- Python Frida: `/tmp/opencode/fridaenv/bin/python`.
- ILSpy: `.topgirl-ripper/bin/dotnet/dotnet`, wajib `DOTNET_ROLL_FORWARD=LatestMajor`
  (runtime 10.x, tanpa SDK).
- Config mentah: `.topgirl-ripper/work/cache_txt/assets/p2/res/config/gen/*.bytes`
  (951 file, magic `CFI2` di EOF).

## Aturan il2cpp (yang mahal kalau dilanggar)

- **Spawn, jangan attach.** Attach ke proses jalan → `il2cpp_domain_get_assemblies`
  balik 0. Attach script saat proses masih suspended, baru `resume`.
- Class di `Main.dll`/`GameData.dll` **tidak** bisa lewat `il2cpp_class_from_name`.
  Enumerasi: `il2cpp_domain_get_assemblies` → `il2cpp_assembly_get_image` →
  `il2cpp_image_get_class_count`/`il2cpp_image_get_class` → cocokkan
  `il2cpp_class_get_name` / `il2cpp_image_get_name`.
- `il2cpp_thread_attach` bisa abort (aman); retry `il2cpp_domain_get` sampai non-null.
- Method pointer untuk hook: `il2cpp_class_get_methods` → `MethodInfo*` pertama
  (`readPointer()`). Ini jalan untuk `CfgReader`.
- Class dari hotfix (`Cfg.CHeroSkill`): hook `DoRead` → argumen sampah (dispatch
  AOT beda). Pakai heap-scan pola klass + `il2cpp_field_get_offset` (lihat
  `FINDINGS.md` untuk offset `CHeroSkill`).
- **Jangan** panggil method native dari thread Frida (`GetValue`, `DoLoad`) →
  access violation, proses mati.

## Format CFI2 (terverifikasi)

| Tipe | Encoding |
| --- | --- |
| string (blob) | tag `0x80 \| (len<<1)`; len 6 → `0x8c`, len 22 → `0xac`, kosong → `0x80` |
| int | LEB128 unsigned, 7 bit/byte |
| float | 4 byte LE mentah |
| field string | LEB128 index ke `m_StrTable` |
| list | LEB128 count, lalu N elemen |

Layout file: `[header varint][blob string][area record][index/pad][int32][CFI2]`.
Contoh: `const_config.bytes` punya 2471 string (offset 5..63847).

Framing record (list/struct bersarang + padding `0x80`) belum penuh — untuk
nilai, pakai hook runtime di bawah, bukan parse file.

## Jalur tercepat: hook `CfgReader`

Pakai `scripts/hook_const_config.js` (salinan yang sudah terbukti):

- `CfgReader` fields: `lockObj` 0, `m_Stream` 16, `m_VerNumber` 24,
  `m_StrTable` 32, `m_StrBytes` 40, `m_FloatToBytes` 48.
- Hook `DoReadString` → `onLeave(retval)` = `Il2CppString*`
  (panjang `+0x10`, UTF-16 `+0x14`); simpan sebagai string terakhir.
- Hook `DoReadFloat` → `onLeave` baca float di `this + 0x30`.
- Pasangan (string terakhir, float) = `CConstConfig.Constant → Val`
  (urutan `DoRead`: `Id`, `Constant`, `Val`, `Array`, `Quintuple`,
  `Requirement`, `Strings`).
- Output: `.topgirl-ripper/dump/const_config_rows.tsv`.

## Angka terverifikasi (2026-11-26)

| Konstanta | Nilai |
| --- | --- |
| `skill_cast_round` | 10 |
| `battle_coef_1` | 10 |
| `battle_normal_attack` | 200 |
| `mecha_battle_normal_attack` | 200 |
| `battle_num_damage_factor` | 0.5 |
| `battle_damage_coef` | 2 |
| `attr_reduction_factor` | 0.1 |

`1800` **bukan** konstanta global; normal attack SLG 200. Skill 1 kartu artist
tidak ada di `const_config`/`hero_skill`/`battle_skill` → angka 1800/1500 adalah
data per kartu, disimpan di kolom `artists.base_dmg`.

## Selesai RE

Matikan sesi: `pkill -f '^\./fridaenv/bin/python'` lalu
`adb shell 'su -c "am force-stop com.a3.topgirl.gplay"'`.

Jangan ubah kode app demi menyesuaikan tebakan RE. Angka masuk DB hanya setelah
terkonfirmasi atau diputuskan pemilik repo.
