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
import { formatStat } from "./artist-ui";
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

const isComplete = (d: Draft) => d.skills.some((s) => s.effect !== "");

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
    });
  }

  function submitPhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("photo");
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
          form.reset();
          router.refresh();
        }
      } catch {
        setPhotoStatus(C.photoFailed);
      }
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{C.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">{C.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocaleSwitcher locale={locale} className="mr-1" />
          <span className="tabular rounded-xl border border-white/10 bg-panel/80 px-3 py-2 text-sm text-zinc-300">
            {t(C.progress, {
              done: artists.filter((a) => isComplete(draftFromArtist(a))).length,
              total: artists.length,
            })}
          </span>
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            {C.teamLink}
          </Link>
          <form action={logout.bind(null, locale)}>
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
            >
              {C.logout}
            </button>
          </form>
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[20rem_1fr]">
        <section aria-label={C.listLabel} className="min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder={C.searchPlaceholder}
            aria-label={DICT[locale].common.searchArtist}
            className="w-full rounded-xl border border-white/10 bg-panel/80 px-3 py-3 text-base placeholder:text-zinc-400 focus:border-brand/60"
          />
          <ul className="mt-3 flex max-h-[65dvh] flex-col gap-1 overflow-y-auto pr-1">
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
                    }}
                    aria-pressed={active}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors duration-200 ${
                      active ? "border-gold/45 bg-gold/10" : "border-white/10 bg-panel/70 hover:border-white/25"
                    }`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-panel-2 text-sm font-semibold text-zinc-300">
                      {a.photoUrl ? (
                        <Image src={a.photoUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        a.name[0]
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block truncate text-xs text-zinc-400">
                        {[a.origin, a.season].filter(Boolean).join(" ") || C.noOrigin}
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
          </ul>
        </section>

        <section aria-label={C.formLabel} className="min-w-0 rounded-2xl border border-white/10 bg-panel/80 p-4">
          {current && form ? (
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-semibold">{current.name}</h2>
                {preview && (
                  <span className="tabular rounded-md border border-white/10 bg-panel-2 px-2 py-1 text-sm">
                    {C.score} <strong>{formatStat(preview.score, locale)}</strong> · {C.tier} <strong>{preview.tier}</strong>
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  {C.genre}
                  <select
                    value={form.genre}
                    onChange={(e) => update({ genre: e.target.value })}
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
                  >
                    {lookups.genres.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-400">
                  {C.origin}
                  <select
                    value={form.origin}
                    onChange={(e) => update({ origin: e.target.value })}
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
                  >
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
                    className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60"
                  />
                </label>
              </div>

              {form.skills.map((skill, i) => {
                const unit = lookups.effects.find((e) => e.id === skill.effect)?.unit ?? "percent";
                return (
                  <fieldset key={i} className="grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[1fr_8rem]">
                    <legend className="px-1 text-xs text-zinc-400">{t(C.skill, { n: i + 1 })}</legend>
                    <label className="flex flex-col gap-1 text-sm text-zinc-400">
                      {C.effect}
                      <select
                        value={skill.effect}
                        onChange={(e) => updateSkill(i, { effect: e.target.value as Effect | "", value: e.target.value ? skill.value : "" })}
                        className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
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
                      <span>
                        {C.value} <span className="text-zinc-500">{unit === "flat" ? C.flat : C.percent}</span>
                      </span>
                      <input
                        value={skill.value}
                        onChange={(e) => updateSkill(i, { value: digits(e.target.value) })}
                        inputMode="numeric"
                        disabled={skill.effect === ""}
                        placeholder={unit === "flat" ? "200/240" : "12"}
                        className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-brand/60 disabled:opacity-40"
                      />
                    </label>
                  </fieldset>
                );
              })}

              <div className="flex flex-wrap items-center gap-2">
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
          ) : (
            <p className="text-zinc-400">{C.pick}</p>
          )}

          {current ? (
            <form onSubmit={submitPhoto} className="mt-5 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
              <input type="hidden" name="slug" value={current.slug} />
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-panel-2 text-lg font-semibold text-zinc-300">
                {current.photoUrl ? (
                  <Image src={current.photoUrl} alt="" width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  current.name[0]
                )}
              </span>
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
          ) : null}
        </section>
      </div>
    </main>
  );
}
