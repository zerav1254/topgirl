"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLineup, remove, toggleShare } from "@/app/[locale]/lineup/actions";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import type { Lineup } from "@/lib/lineups";
import { TEAM_SIZE } from "@/lib/team";
import { getServerTeam, readTeam, subscribeTeam } from "@/lib/team-store";
import { Avatar, ICONS, Icon } from "./artist-ui";
import { LineupTags } from "./lineup-tags";

type Result = { ok: boolean; error: string; link?: string };

export function LineupsTab({
  lineups,
  preview,
  locale,
  signedIn,
  siteUrl,
}: {
  lineups: Lineup[];
  preview: Artist[];
  locale: Locale;
  signedIn: boolean;
  siteUrl: string;
}) {
  const C = DICT[locale].lineup;
  const router = useRouter();
  const saved = useSyncExternalStore(subscribeTeam, readTeam, getServerTeam);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState("");

  const bySlug = useMemo(() => new Map(preview.map((a) => [a.slug, a])), [preview]);
  const sharedCount = lineups.filter((l) => l.shareSlug).length;

  const slugs = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(saved ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  }, [saved]);

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? (res.link ? `${C.shared}: ${siteUrl}${res.link}` : C.saved) : res.error);
      router.refresh();
    });

  if (!signedIn) return <p className="text-sm text-zinc-400">{C.loginHint}</p>;

  const btn = "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors duration-200";

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-panel/70 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.title}</dt>
          <dd className="tabular mt-0.5 font-display text-xl font-bold text-zinc-100">{lineups.length}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-panel/70 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.shared}</dt>
          <dd className="tabular mt-0.5 font-display text-xl font-bold text-emerald-300">{sharedCount}</dd>
        </div>
      </dl>

      <form
        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-panel/80 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("slugs", slugs.join(","));
          run(() => createLineup(locale, fd));
        }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
            <Icon d={ICONS.layers} className="h-4 w-4 shrink-0" />
          </span>
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{C.saveTitle}</h2>
          <span className="tabular shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold text-zinc-100">
            {slugs.length}/{TEAM_SIZE}
          </span>
        </div>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          {C.name}
          <input
            name="name"
            required
            maxLength={60}
            defaultValue=""
            className="min-h-11 rounded-lg border border-white/10 bg-panel px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
          />
        </label>
        <p className="text-xs text-zinc-400">{slugs.length === 0 ? C.needTeam : C.subtitle}</p>
        <button
          type="submit"
          disabled={pending || slugs.length === 0}
          className={`${btn} w-full border-gold/45 bg-gold/15 text-gold hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Icon d={ICONS.save} className="h-4 w-4 shrink-0" />
          {C.save}
        </button>
      </form>

      {lineups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">{C.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lineups.map((l) => {
            const link = l.shareSlug ? `${siteUrl}/${locale}/l/${l.shareSlug}` : "";
            const team = l.slugs.map((s) => bySlug.get(s)).filter((a) => a !== undefined);
            return (
              <li key={l.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-panel/70 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex shrink-0 -space-x-2">
                    {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                      const slug = l.slugs[i];
                      const a = slug ? bySlug.get(slug) : undefined;
                      return a ? (
                        <span key={i} className="rounded-lg ring-2 ring-panel">
                          <Avatar artist={a} size="h-9 w-9" />
                        </span>
                      ) : (
                        <span key={i} aria-hidden="true" className="h-9 w-9 rounded-lg border border-dashed border-white/10 bg-panel-2/60 ring-2 ring-panel" />
                      );
                    })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${
                          l.shareSlug ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/15 bg-white/5 text-zinc-300"
                        }`}
                      >
                        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${l.shareSlug ? "bg-emerald-400" : "bg-zinc-400"}`} />
                        {l.shareSlug ? C.shared : C.private}
                      </span>
                      <span className="tabular text-xs text-zinc-400">
                        {l.slugs.length}/{TEAM_SIZE}
                      </span>
                    </span>
                  </span>
                </div>
                <LineupTags team={team} locale={locale} />
                <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-gold" style={{ width: `${(l.slugs.length / TEAM_SIZE) * 100}%` }} />
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => toggleShare(locale, l.id, !l.shareSlug))}
                    className={`${btn} border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
                  >
                    <Icon d={l.shareSlug ? ICONS.unlink : ICONS.share} className="h-4 w-4 shrink-0" />
                    {l.shareSlug ? C.unshare : C.share}
                  </button>
                  {l.shareSlug && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(link);
                            setCopied(l.id);
                          } catch {
                            setCopied("");
                          }
                        }}
                        className={`${btn} border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
                      >
                        <Icon d={ICONS.copy} className="h-4 w-4 shrink-0" />
                        {copied === l.id ? C.copied : C.copy}
                      </button>
                      <a href={link} target="_blank" rel="noreferrer" className={`${btn} inline-flex items-center border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}>
                        <Icon d={ICONS.external} className="h-4 w-4 shrink-0" />
                        {C.open}
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(C.confirmDelete)) run(() => remove(locale, l.id));
                    }}
                    className={`${btn} ml-auto border-white/10 text-zinc-400 hover:border-red-400/40 hover:text-red-300`}
                  >
                    <Icon d={ICONS.trash} className="h-4 w-4 shrink-0" />
                    {C.delete}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-white/10 bg-panel/70 px-3 py-2 text-sm break-words text-zinc-300">
          {message}
        </p>
      )}

      <p role="status" className="sr-only">
        {copied ? C.copied : ""}
      </p>
    </div>
  );
}
