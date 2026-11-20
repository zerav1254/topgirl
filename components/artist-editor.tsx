"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/artists";
import { EFFECTS, EFFECT_LABEL, scoreArtist, tierFromScore, type Effect, type Skill } from "@/lib/score";

const STORAGE_KEY = "topgirl.stats.v1";
const REGIONS = ["", "Tokyo", "Rome", "Bali", "Auction"] as const;

type Region = (typeof REGIONS)[number];
type SkillDraft = { effect: Effect | ""; value: string };
type Draft = {
  baseSing: string;
  baseDance: string;
  region: Region;
  season: string;
  skills: [SkillDraft, SkillDraft];
};

const digits = (v: string) => v.replace(/\D/g, "");

function draftFromArtist(a: Artist): Draft {
  const skill = (i: number): SkillDraft => ({
    effect: a.skills[i]?.effect ?? "",
    value: a.skills[i]?.value?.toString() ?? "",
  });
  return {
    baseSing: a.baseSing?.toString() ?? "",
    baseDance: a.baseDance?.toString() ?? "",
    region: (a.region as Region) ?? "",
    season: a.season?.toString() ?? "",
    skills: [skill(0), skill(1)],
  };
}

const isComplete = (d: Draft) => d.baseSing !== "" && d.baseDance !== "" && d.skills.some((s) => s.effect !== "");

function toRow(a: Artist, d: Draft): string {
  const skills = d.skills.map((s) => [s.effect, s.effect ? s.value : ""]);
  return [a.id, a.slug, a.name, a.genre, d.region, d.region ? d.season : "", d.baseSing, d.baseDance, ...skills.flat()].join(",");
}

export function ArtistEditor({ artists }: { artists: Artist[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(
    () => artists.find((a) => !isComplete(draftFromArtist(a)))?.slug ?? artists[0]?.slug ?? "",
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (saved && typeof saved === "object") setDrafts(saved as Record<string, Draft>);
    } catch {
      // corrupt storage: start empty
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const current = artists.find((a) => a.slug === selected);
  const form = current ? (drafts[current.slug] ?? draftFromArtist(current)) : null;
  const completeCount = artists.filter((a) => isComplete(drafts[a.slug] ?? draftFromArtist(a))).length;

  const visible = useMemo(
    () =>
      artists.filter(
        (a) =>
          query === "" ||
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.region?.toLowerCase().includes(query.toLowerCase()),
      ),
    [artists, query],
  );

  const csv = useMemo(() => {
    const header = "id,slug,name,genre,region,season,base_sing,base_dance,s1_effect,s1_value,s2_effect,s2_value";
    return [header, ...artists.map((a) => toRow(a, drafts[a.slug] ?? draftFromArtist(a)))].join("\n");
  }, [artists, drafts]);

  const preview = useMemo(() => {
    if (!form) return null;
    const skills: Skill[] = form.skills
      .filter((s) => s.effect !== "")
      .map((s) => ({ effect: s.effect as Effect, value: s.value === "" ? null : Number(s.value) }));
    const score = scoreArtist(skills, form.baseSing === "" ? null : Number(form.baseSing), form.baseDance === "" ? null : Number(form.baseDance));
    return { score, tier: tierFromScore(score) };
  }, [form]);

  function update(patch: Partial<Draft>) {
    if (!current || !form) return;
    setDrafts((prev) => ({ ...prev, [current.slug]: { ...form, ...patch } }));
  }

  function updateSkill(i: number, patch: Partial<SkillDraft>) {
    if (!form) return;
    const skills = form.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) as [SkillDraft, SkillDraft];
    update({ skills });
  }

  function reset() {
    if (!current) return;
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[current.slug];
      return next;
    });
  }

  async function copyRow() {
    if (!current || !form) return;
    try {
      await navigator.clipboard.writeText(toRow(current, form));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "artists.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Isi Stat Artist</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Lengkapi base stat dan skill, lalu unduh CSV dan timpa <code className="text-zinc-300">data/artists.csv</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular rounded-xl border border-white/10 bg-panel/80 px-3 py-2 text-sm text-zinc-300">
            {completeCount}/{artists.length} lengkap
          </span>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            Tim
          </Link>
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[20rem_1fr]">
        <section aria-label="Daftar artist" className="min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Cari nama atau region…"
            aria-label="Cari artist"
            className="w-full rounded-xl border border-white/10 bg-panel/80 px-3 py-3 text-base placeholder:text-zinc-400 focus:border-brand/60"
          />
          <ul className="mt-3 flex max-h-[65dvh] flex-col gap-1 overflow-y-auto pr-1">
            {visible.map((a) => {
              const complete = isComplete(drafts[a.slug] ?? draftFromArtist(a));
              const active = a.slug === selected;
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => setSelected(a.slug)}
                    aria-pressed={active}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors duration-200 ${
                      active ? "border-gold/45 bg-gold/10" : "border-white/10 bg-panel/70 hover:border-white/25"
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-panel-2 text-sm font-semibold text-zinc-300">
                      {a.hasThumb ? (
                        <Image src={`/assets/images/artists/thumb/${a.slug}.webp`} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        a.name[0]
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block truncate text-xs text-zinc-400">
                        {[a.region, a.season].filter(Boolean).join(" ") || "tanpa region"}
                      </span>
                    </span>
                    <span
                      aria-label={complete ? "lengkap" : "belum lengkap"}
                      className={`h-2 w-2 shrink-0 rounded-full ${complete ? "bg-emerald-400" : "bg-zinc-600"}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Form stat artist" className="min-w-0 rounded-2xl border border-white/10 bg-panel/80 p-4">
          {current && form ? (
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-semibold">{current.name}</h2>
                {preview && (
                  <span className="tabular rounded-md border border-white/10 bg-panel-2 px-2 py-1 text-sm">
                    Skor <strong>{preview.score.toLocaleString("id-ID")}</strong> · Tier <strong>{preview.tier}</strong>
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Base SING
                  <input
                    value={form.baseSing}
                    onChange={(e) => update({ baseSing: digits(e.target.value) })}
                    inputMode="numeric"
                    placeholder="mis. 34827"
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Base DANCE
                  <input
                    value={form.baseDance}
                    onChange={(e) => update({ baseDance: digits(e.target.value) })}
                    inputMode="numeric"
                    placeholder="mis. 25071"
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Region
                  <select
                    value={form.region}
                    onChange={(e) => update({ region: e.target.value as Region })}
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r || "—"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  Season
                  <input
                    value={form.season}
                    onChange={(e) => update({ season: digits(e.target.value) })}
                    inputMode="numeric"
                    placeholder="mis. 14"
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60"
                  />
                </label>
              </div>

              {form.skills.map((skill, i) => (
                <fieldset key={i} className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[1fr_8rem]">
                  <legend className="px-1 text-xs text-zinc-400">Skill {i + 1}</legend>
                  <label className="flex flex-col gap-1 text-sm text-zinc-400">
                    Efek
                    <select
                      value={skill.effect}
                      onChange={(e) => updateSkill(i, { effect: e.target.value as Effect | "", value: e.target.value ? skill.value : "" })}
                      className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
                    >
                      <option value="">—</option>
                      {EFFECTS.map((effect) => (
                        <option key={effect} value={effect}>
                          {EFFECT_LABEL[effect]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-400">
                    Nilai
                    <input
                      value={skill.value}
                      onChange={(e) => updateSkill(i, { value: digits(e.target.value) })}
                      inputMode="numeric"
                      disabled={skill.effect === ""}
                      placeholder={skill.effect.startsWith("dps") ? "200/240" : "12"}
                      className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60 disabled:opacity-40"
                    />
                  </label>
                </fieldset>
              ))}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyRow}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/15 bg-panel-2 px-4 text-sm font-semibold text-zinc-200 transition-colors duration-200 hover:border-white/30"
                >
                  {copied ? "Tersalin" : "Salin baris CSV"}
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
                >
                  Unduh artists.csv
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-300"
                >
                  Reset baris
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                Draf tersimpan di browser ini. File tidak ditulis otomatis ke server.
              </p>
            </form>
          ) : (
            <p className="text-zinc-400">Pilih artist di daftar.</p>
          )}
        </section>
      </div>
    </main>
  );
}
