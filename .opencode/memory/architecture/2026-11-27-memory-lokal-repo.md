# Memory Repo (TopGirl)

## 2026-11-27 — Memory lokal repo di `.opencode/memory/`

Keputusan: memori proyek ini disimpan di `.opencode/memory/`, bukan hanya di
`~/.config/opencode/memory/` (global). Tujuannya: keputusan/gotcha khusus TopGirl
ikut repo, bisa direview di diff.

- Sumber kebenaran: file `.md` per topik (`architecture/`, `bug-fixes/`, `features/`,
  `ui-ux/`, `performance/`, `security/`, `deferred/`, dst).
- Indeks: `memory.db` (SQLite FTS5) — turunan, di-gitignore.
- Alat: `mem.py` (salinan dari global, STUB disesuaikan path repo).
- Jangan simpan ulang isi `AGENTS.md`, `RULE.md`, `DESIGN.md`, atau hal yang sudah
  terjawab dari kode. Simpan hanya yang tidak terbaca dari repo.

Alur: tulis `.md` → `python3 .opencode/memory/mem.py sync` → `mem.py search "kw"`.
