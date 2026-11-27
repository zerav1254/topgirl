#!/usr/bin/env python3
"""Memory index: Markdown files -> SQLite (FTS5). MD stays source of truth.

  python3 mem.py sync            rebuild index from *.md
  python3 mem.py search "kw"     full-text search dated entries
  python3 mem.py recent [N]      newest entries by date
  python3 mem.py list [cat]      list indexed files
  python3 mem.py stat            counts
"""
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = ROOT / "memory.db"
SKIP = {"INDEX.md"}
ENTRY_RE = re.compile(r"^##\s+(\d{4}-\d{2}-\d{2})\s*[—:-]?\s*(.*)$", re.M)
TITLE_RE = re.compile(r"^#\s+(.+)$", re.M)
WORD_RE = re.compile(r"\w+")


def connect():
    db = sqlite3.connect(DB)
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS files(
          path TEXT PRIMARY KEY, category TEXT, title TEXT,
          mtime REAL, size INTEGER);
        CREATE VIRTUAL TABLE IF NOT EXISTS entries USING fts5(
          date, title, body, path UNINDEXED, tokenize='unicode61');
        """
    )
    return db


def parse(md):
    """-> [(date, title, body)]; fallback single entry per file."""
    head = TITLE_RE.search(md)
    file_title = head.group(1).strip() if head else ""
    hits = list(ENTRY_RE.finditer(md))
    if not hits:
        return [("", file_title, md)]
    out = []
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(md)
        out.append((m.group(1), m.group(2).strip(), md[m.start():end].strip()))
    return out


STUB = """# TopGirl Memory Index

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
"""


def write_index(db):
    cats = db.execute(
        "SELECT category, count(*) FROM files GROUP BY category ORDER BY category"
    ).fetchall()
    rec = db.execute(
        "SELECT date, title, path FROM entries WHERE date<>'' "
        "ORDER BY date DESC, rowid DESC LIMIT 5"
    ).fetchall()
    out = [STUB]
    out += [f"- `{c}/` — {n} files" for c, n in cats]
    out += ["", "## Newest entries", ""]
    out += [f"- {d} — {t or p} (`{p}`)" for d, t, p in rec]
    (ROOT / "INDEX.md").write_text("\n".join(out) + "\n", encoding="utf-8")


def sync(_args):
    db = connect()
    db.execute("DELETE FROM files")
    db.execute("DELETE FROM entries")
    n_files = n_entries = 0
    for md in sorted(ROOT.rglob("*.md")):
        rel = md.relative_to(ROOT).as_posix()
        if rel in SKIP or md.name.startswith("."):
            continue
        txt = md.read_text(encoding="utf-8", errors="replace")
        st = md.stat()
        cat = md.parent.relative_to(ROOT).as_posix()
        head = TITLE_RE.search(txt)
        db.execute(
            "INSERT INTO files VALUES(?,?,?,?,?)",
            (rel, "" if cat == "." else cat, head.group(1).strip() if head else md.stem,
             st.st_mtime, st.st_size),
        )
        rows = parse(txt)
        db.executemany(
            "INSERT INTO entries(date,title,body,path) VALUES(?,?,?,?)",
            [(d, t, b, rel) for d, t, b in rows],
        )
        n_files += 1
        n_entries += len(rows)
    db.execute("INSERT INTO entries(entries) VALUES('optimize')")
    db.commit()
    write_index(db)
    print(f"indexed {n_files} files, {n_entries} entries -> {DB}")


def _expr(q):
    toks = WORD_RE.findall(q)
    return " ".join(f'"{t}"' for t in toks)


def search(args):
    if not args:
        sys.exit(__doc__)
    q = " ".join(args)
    expr = _expr(q)
    if not expr:
        sys.exit("no searchable words")
    db = connect()
    sql = (
        "SELECT date, title, path, snippet(entries,2,'«','»','…',12) "
        "FROM entries WHERE entries MATCH ? ORDER BY rank LIMIT ?"
    )
    rows = db.execute(sql, (expr, 12)).fetchall()
    if not rows:  # AND too strict -> OR
        rows = db.execute(sql, (" OR ".join(expr.split()), 12)).fetchall()
    if not rows:
        print(f"no hits for {q!r}")
        return
    for date, title, path, snip in rows:
        print(f"{date or '     -    '}  {path}")
        if title:
            print(f"  {title}")
        print(f"  {re.sub(r'\\s+', ' ', snip)[:220]}")


def recent(args):
    n = int(args[0]) if args else 10
    db = connect()
    rows = db.execute(
        "SELECT date, title, path FROM entries WHERE date<>'' "
        "ORDER BY date DESC, rowid DESC LIMIT ?", (n,)
    ).fetchall()
    for date, title, path in rows:
        print(f"{date}  {path}  {title}")


def list_(args):
    cat = args[0].rstrip("/") if args else ""
    db = connect()
    like = f"{cat}/%" if cat else "%"
    rows = db.execute(
        "SELECT path, size FROM files WHERE path LIKE ? ORDER BY path", (like,)
    ).fetchall()
    for path, size in rows:
        print(f"{size:>7}  {path}")


def stat(_args):
    db = connect()
    f, e = db.execute("SELECT count(*) FROM files").fetchone()[0], \
        db.execute("SELECT count(*) FROM entries").fetchone()[0]
    dated = db.execute("SELECT count(*) FROM entries WHERE date<>''").fetchone()[0]
    print(f"files {f} | entries {e} ({dated} dated) | db {DB.stat().st_size // 1024} KB")


def selftest(_args):
    rows = parse("# T\n\n## 2026-01-02 — A\nbody1\n## 2026-03-04 B\nbody2\n")
    assert len(rows) == 2, rows
    assert rows[0][0] == "2026-01-02" and rows[0][1] == "A", rows[0]
    assert rows[1][0] == "2026-03-04" and rows[1][1] == "B", rows[1]
    assert "body2" in rows[1][2], rows[1]
    plain = parse("# Only\nno dated headers\n")
    assert plain == [("", "Only", "# Only\nno dated headers\n")], plain
    assert _expr("a-b c") == '"a" "b" "c"', _expr("a-b c")
    print("ok")


CMDS = {"sync": sync, "search": search, "recent": recent,
        "list": list_, "stat": stat, "selftest": selftest}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in CMDS:
        sys.exit(__doc__)
    CMDS[sys.argv[1]](sys.argv[2:])
