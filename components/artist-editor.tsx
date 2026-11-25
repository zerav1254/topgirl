"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { compressPhoto } from "@/lib/image-client";
import { uploadPhoto } from "@/app/[locale]/manage/actions";
import { signOut } from "@/app/[locale]/login/actions";
import { Avatar, SearchInput } from "./artist-ui";
import { LocaleSwitcher } from "./locale-switcher";

const cardClass = "rounded-2xl border border-white/10 bg-panel/60";

// Halaman ini sengaja hanya mengurus foto. Stat, skill, genre, dan origin dikunci
// supaya skor dan pool tetap konsisten; ubah lewat SQL/migration kalau perlu.
export function ArtistEditor({
  artists,
  defaultSlug,
  locale,
}: {
  artists: Artist[];
  defaultSlug?: string;
  locale: Locale;
}) {
  const C = DICT[locale].editor;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(
    () =>
      (defaultSlug && artists.some((a) => a.slug === defaultSlug) ? defaultSlug : null) ??
      artists.find((a) => !a.photoUrl)?.slug ??
      artists[0]?.slug ??
      "",
  );
  const [photoStatus, setPhotoStatus] = useState("");
  const [uploading, startUploading] = useTransition();

  const current = artists.find((a) => a.slug === selected);
  const done = artists.filter((a) => a.photoUrl).length;
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
            <form action={signOut.bind(null, locale)}>
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
          <div
            role="progressbar"
            aria-label={C.progressLabel}
            aria-valuemin={0}
            aria-valuemax={artists.length}
            aria-valuenow={done}
            aria-valuetext={t(C.progress, { done, total: artists.length })}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
          >
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
              const hasPhoto = Boolean(a.photoUrl);
              const active = a.slug === selected;
              return (
                <li key={a.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(a.slug);
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
                      <span className="block truncate text-xs text-zinc-400">{a.origin || C.noOrigin}</span>
                    </span>
                    <span
                      role="img"
                      aria-label={hasPhoto ? C.complete : C.incomplete}
                      className={`h-2 w-2 shrink-0 rounded-full ${hasPhoto ? "bg-emerald-400" : "bg-zinc-600"}`}
                    />
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && <li className="px-2 py-3 text-sm text-zinc-400">{DICT[locale].team.empty}</li>}
          </ul>
        </section>

        <section aria-label={C.formLabel} className={`${cardClass} flex min-w-0 flex-col gap-4 p-4 sm:p-5`}>
          {current ? (
            <>
              <div className="flex min-w-0 items-center gap-3 border-b border-white/10 pb-3">
                <Avatar artist={current} size="h-12 w-12" />
                <div className="min-w-0">
                  <h2 className="font-display truncate text-xl font-semibold">{current.name}</h2>
                  <p className="truncate text-xs text-zinc-400">
                    {[current.genre, current.origin ?? C.noOrigin].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              <form onSubmit={submitPhoto} className="flex flex-wrap items-end gap-3">
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
