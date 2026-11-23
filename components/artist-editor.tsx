"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import type { Lookups } from "@/lib/lookups";
import { scoreArtist, tierFromScore, type Effect, type Skill } from "@/lib/score";
import { logout, saveArtist, uploadPhoto } from "@/app/[locale]/manage/actions";
import { Avatar, SearchInput, formatStat } from "./artist-ui";
import { LocaleSwitcher } from "./locale-switcher";

type SkillDraft = { effect: Effect | ""; value: string };
type Draft = {
  slug: string;
  genre: string;
  origin: string;
  season: string;
  skills: [SkillDraft, SkillDraft];
};

const digits = (v: string) => v.replace(/\D/g, "");

// Kompres di browser: batas body Vercel 4,5 MB, jadi foto HP tidak dikirim mentah.
const MAX_SIDE = 1280;

async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("compress");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.webp`, { type: "image/webp" });
}

function draftFromArtist(a: Artist): Draft {
  const skill = (i: number): SkillDraft => ({
    effect: a.skills[i]?.effect ?? "",
    value: a.skills[i]?.value?.toString() ?? "",
  });
  return {
    slug: a.slug,
    genre: a.genre,
    origin: a.origin ?? "",
    season: a.season?.toString() ?? "",
    skills: [skill(0), skill(1)],
  };
}

// Kedua slot wajib terisi effect: semua artist punya 2 skill di DB.
const isComplete = (d: Draft) => d.skills.every((s) => s.effect !== "");

// ponytail: draft hanya menyimpan stat; name/genre belum bisa diedit dari web.
function toFormData(d: Draft, a: Artist): FormData {
  const fd = new FormData();
  fd.set("slug", d.slug);
  fd.set("name", a.name);
  fd.set("genre", d.genre);
  fd.set("origin", d.origin);
  fd.set("season", d.origin ? d.season : "");
  d.skills.forEach((s, i) => {
    fd.set(`s${i + 1}_effect`, s.effect);
    fd.set(`s${i + 1}_value`, s.effect ? s.value : "");
  });
  return fd;
}

const inputClass =
  "min-h-11 rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-400 focus:border-brand/60";
const cardClass = "rounded-2xl border border-white/10 bg-panel/60";

export function ArtistEditor({
  artists,
  defaultSlug,
  lookups,
  locale,
}: {
  artists: Artist[];
  defaultSlug?: string;
  lookups: Lookups;
  locale: Locale;
}) {
  const C = DICT[locale].editor;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(
    () =>
      (defaultSlug && artists.some((a) => a.slug === defaultSlug) ? defaultSlug : null) ??
      artists.find((a) => !isComplete(draftFromArtist(a)))?.slug ??
      artists[0]?.slug ??
      "",
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");
  const [saving, startSaving] = useTransition();
  const [uploading, startUploading] = useTransition();

  const current = artists.find((a) => a.slug === selected);
  const form = draft?.slug === selected ? draft : current ? draftFromArtist(current) : null;
  const done = artists.filter((a) => isComplete(draftFromArtist(a))).length;
  const pct = artists.length ? Math.round((done / artists.length) * 100) : 0;

  const visible = useMemo(
    () =>
      artists.filter(
        (a) =>
          query === "" ||
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.origin?.toLowerCase().includes(query.toLowerCase()),
      ),
    [artists, query],
  );

  const preview = useMemo(() => {
    if (!form) return null;
    const skills: Skill[] = form.skills
      .filter((s) => s.effect !== "")
      .map((s) => ({ effect: s.effect as Effect, value: s.value === "" ? null : Number(s.value) }));
    const score = scoreArtist(skills);
    return { score, tier: tierFromScore(score) };
  }, [form]);

  function update(patch: Partial<Draft>) {
    if (!form) return;
    setDraft({ ...form, ...patch });
    setStatus("");
  }

  function updateSkill(i: number, patch: Partial<SkillDraft>) {
    if (!form) return;
    const skills = form.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) as [SkillDraft, SkillDraft];
    update({ skills });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form || !current) return;
    startSaving(async () => {
      const result = await saveArtist(locale, toFormData(form, current));
      setStatus(result.ok ? C.saved : result.error);
      // Progress bar dan titik "lengkap" di daftar dihitung dari props server.
      if (result.ok) router.refresh();
    });
  }

  function submitPhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const photoForm = e.currentTarget;
    const input = photoForm.elements.namedItem("photo");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!current || !file) return;
    setPhotoStatus("");
    startUploading(async () => {
      try {
        const fd = new FormData();
        fd.set("slug", current.slug);
        fd.set("photo", await compressPhoto(file));
        const result = await uploadPhoto(locale, fd);
        setPhotoStatus(result.ok ? C.saved : result.error);
        if (result.ok) {
          photoForm.reset();
          router.refresh();
        }
      } catch {
        setPhotoStatus(C.photoFailed);
      }
    });
  }

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-28 lg:px-8">
      <header className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/assets/icon-topgirl.webp"
              alt=""
              width={72}
              height={72}
              sizes="36px"
              priority
              className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover"
            />
            <div className="min-w-0">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
              <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">{C.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher locale={locale} />
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
            >
              {C.teamLink}
            </Link>
            <form action={logout.bind(null, locale)}>
              <button
                type="submit"
                className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
              >
                {C.logout}
              </button>
            </form>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-400">{C.subtitle}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <span className="tabular shrink-0 text-xs text-zinc-400">{t(C.progress, { done, total: artists.length })}</span>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[19rem_1fr]">
        <section aria-label={C.listLabel} className={`${cardClass} flex min-w-0 flex-col p-3`}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-display text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.listLabel}</h2>
            <span className="tabular text-xs text-zinc-400">{visible.length}</span>
          </div>
          <SearchInput value={query} onChange={setQuery} locale={locale} placeholder={C.searchPlaceholder} />
          <ul className="mt-2 flex max-h-[42dvh] flex-col gap-1 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-17rem)]">
            {visible.map((a) => {
              const complete = isComplete(draftFromArtist(a));
              const active = a.slug === selected;
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(a.slug);
                      setStatus("");
                      setPhotoStatus("");
                    }}
                    aria-pressed={active}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors duration-200 ${
                      active
                        ? "border-gold/45 bg-gold/10"
                        : "border-transparent bg-panel-2/40 hover:border-white/15 hover:bg-panel-2"
                    }`}
                  >
                    <Avatar artist={a} size="h-9 w-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block truncate text-xs text-zinc-400">
                        {[a.origin, a.season && `S${a.season}`].filter(Boolean).join(" · ") || C.noOrigin}
                      </span>
                    </span>
                    <span
                      aria-label={complete ? C.complete : C.incomplete}
                      className={`h-2 w-2 shrink-0 rounded-full ${complete ? "bg-emerald-400" : "bg-zinc-600"}`}
                    />
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && <li className="px-2 py-3 text-sm text-zinc-400">{DICT[locale].team.empty}</li>}
          </ul>
        </section>

        <section aria-label={C.formLabel} className={`${cardClass} flex min-w-0 flex-col gap-4 p-4 sm:p-5`}>
          {current && form ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar artist={current} size="h-12 w-12" />
                  <div className="min-w-0">
                    <h2 className="font-display truncate text-xl font-semibold">{current.name}</h2>
                    <p className="truncate text-xs text-zinc-400">
                      {[current.genre, current.origin ?? C.noOrigin, current.season && `S${current.season}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                {preview && (
                  <span className="tabular rounded-lg border border-white/10 bg-ink/40 px-2.5 py-1.5 text-sm text-zinc-300">
                    {C.score} <strong className="text-gold">{formatStat(preview.score, locale)}</strong>
                    <span className="mx-1.5 text-zinc-400">·</span>
                    {C.tier} <strong>{preview.tier}</strong>
                  </span>
                )}
              </div>

              <form className="flex flex-col gap-4" onSubmit={submit}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-sm text-zinc-400">
                    {C.genre}
                    <select value={form.genre} onChange={(e) => update({ genre: e.target.value })} className={inputClass}>
                      {lookups.genres.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-400">
                    {C.origin}
                    <select value={form.origin} onChange={(e) => update({ origin: e.target.value })} className={inputClass}>
                      <option value="">—</option>
                      {lookups.origins.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-zinc-400">
                    {C.season}
                    <input
                      value={form.season}
                      onChange={(e) => update({ season: digits(e.target.value) })}
                      inputMode="numeric"
                      placeholder="14"
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {form.skills.map((skill, i) => {
                    const unit = lookups.effects.find((e) => e.id === skill.effect)?.unit ?? "percent";
                    return (
                      <fieldset key={i} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-ink/30 p-3">
                        <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                          {t(C.skill, { n: i + 1 })}
                        </legend>
                        <label className="flex flex-col gap-1 text-sm text-zinc-400">
                          {C.effect}
                          <select
                            value={skill.effect}
                            onChange={(e) =>
                              updateSkill(i, { effect: e.target.value as Effect | "", value: e.target.value ? skill.value : "" })
                            }
                            className={inputClass}
                          >
                            <option value="">—</option>
                            {lookups.effects.map((effect) => (
                              <option key={effect.id} value={effect.id}>
                                {effect.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-zinc-400">
                          <span className="flex items-center justify-between">
                            {C.value} <span className="text-xs text-zinc-400">{unit === "flat" ? C.flat : C.percent}</span>
                          </span>
                          <input
                            value={skill.value}
                            onChange={(e) => updateSkill(i, { value: digits(e.target.value) })}
                            inputMode="numeric"
                            disabled={skill.effect === ""}
                            placeholder={unit === "flat" ? "200/240" : "12"}
                            className={`${inputClass} disabled:opacity-40`}
                          />
                        </label>
                      </fieldset>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25 disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? C.saving : C.save}
                  </button>
                  {status ? (
                    <p aria-live="polite" className={`text-sm ${status === C.saved ? "text-emerald-300" : "text-red-300"}`}>
                      {status}
                    </p>
                  ) : null}
                </div>
              </form>

              <form onSubmit={submitPhoto} className="flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
                <input type="hidden" name="slug" value={current.slug} />
                <Avatar artist={current} size="h-14 w-14" />
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-zinc-400">
                  {C.photo}
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="cursor-pointer rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-panel-2 file:px-3 file:py-1 file:text-zinc-200"
                  />
                </label>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/15 bg-panel-2 px-4 text-sm font-semibold text-zinc-200 transition-colors duration-200 hover:border-white/30 disabled:cursor-wait disabled:opacity-60"
                >
                  {uploading ? C.uploading : C.upload}
                </button>
                {photoStatus ? (
                  <p aria-live="polite" className={`w-full text-sm ${photoStatus === C.saved ? "text-emerald-300" : "text-red-300"}`}>
                    {photoStatus}
                  </p>
                ) : null}
                <p className="w-full text-xs text-zinc-400">{C.photoHint}</p>
              </form>
            </>
          ) : (
            <p className="text-zinc-400">{C.pick}</p>
          )}
        </section>
      </div>
    </main>
  );
}
