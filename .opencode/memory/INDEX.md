# TopGirl Memory Index

Memory khusus repo ini = Markdown di `.opencode/memory/`, diindeks ke `memory.db` (SQLite FTS5).
File ini digenerate oleh `mem.py sync` — jangan edit manual.

Jangan duplikasi isi `AGENTS.md` / `RULE.md` / `DESIGN.md`; simpan di sini hanya
keputusan, gotcha, dan hasil investigasi yang tidak terbaca dari kode.

## Query it

    python3 .opencode/memory/mem.py search "kata kunci"
    python3 .opencode/memory/mem.py recent 15
    python3 .opencode/memory/mem.py list <kategori>
    python3 .opencode/memory/mem.py sync     # setelah menulis .md apa pun
    python3 .opencode/memory/mem.py stat

Buka hasil dengan tool `read` di `.opencode/memory/<path>`.

## Write format

Satu file per topik di folder kategori, `## YYYY-MM-DD — Judul` per entri,
lalu `mem.py sync`.

## Write format

New file per topic in the matching folder, `## YYYY-MM-DD — Judul` per entry,
then run `mem.py sync` (it refreshes this file too).

## Index

- `architecture/` — 2 files
- `bug-fixes/` — 1 files
- `devops-config/` — 1 files

## Newest entries

- 2026-11-27 — Origin situs produksi `https://zerav.web.id` (`devops-config/2026-11-27-site-url-zerav.md`)
- 2026-11-27 — Penampilan CEO: Kartu mahkota vs Kartu debit (bukan bug DB) (`bug-fixes/2026-11-27-ceo-kartu-mahkota-debit.md`)
- 2026-11-27 — Satu kategori skor `global` jadi SSOT (`architecture/2026-11-27-skor-tunggal-ssot.md`)
- 2026-11-27 — Memory lokal repo di `.opencode/memory/` (`architecture/2026-11-27-memory-lokal-repo.md`)
