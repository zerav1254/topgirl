"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { remove, toggleShare } from "@/app/[locale]/lineup/actions";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import type { Lineup } from "@/lib/lineups";
import { TEAM_SIZE } from "@/lib/team";
import { Avatar, ICONS, Icon } from "./artist-ui";
import { LineupTags } from "./lineup-tags";

type Result = { ok: boolean; error: string; link?: string };

export function LineupsTab({
  lineups,
  preview,
  locale,
  siteUrl,
}: {
  lineups: Lineup[];
  preview: Artist[];
  locale: Locale;
  siteUrl: string;
}) {
  const C = DICT[locale].lineup;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState("");

  const bySlug = useMemo(() => new Map(preview.map((a) => [a.slug, a])), [preview]);
  const sharedCount = lineups.filter((l) => l.shareSlug).length;

  const run = (fn: () => Promise<Result>, ok?: string) =>
    start(async () => {
      setCopied("");
      const res = await fn();
      setMessage(res.ok ? (ok ?? (res.link ? `${C.shared}: ${siteUrl}${res.link}` : C.saved)) : res.error);
      router.refresh();
    });

  const btn = "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200";

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-panel/70 p-3">
          <dt className="text-2xs font-semibold uppercase tracking-wide text-zinc-400">{C.title}</dt>
          <dd className="tabular mt-0.5 font-display text-xl font-bold text-zinc-100">{lineups.length}</dd>
        </div>
        <div className="rounded-xl border border-line bg-panel/70 p-3">
          <dt className="text-2xs font-semibold uppercase tracking-wide text-zinc-400">{C.shared}</dt>
          <dd className="tabular mt-0.5 font-display text-xl font-bold text-emerald-300">{sharedCount}</dd>
        </div>
      </dl>

      {lineups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-zinc-400">{C.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lineups.map((l) => {
            const link = l.shareSlug ? `${siteUrl}/${locale}/l/${l.shareSlug}` : "";
            const team = l.slugs.map((s) => bySlug.get(s)).filter((a) => a !== undefined);
            return (
              <li key={l.id} className="flex flex-col gap-2 rounded-xl border border-line bg-panel/70 p-3">
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
                        <span key={i} aria-hidden="true" className="h-9 w-9 rounded-lg border border-dashed border-line bg-panel-2/60 ring-2 ring-panel" />
                      );
                    })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-semibold ${
                          l.shareSlug ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/15 bg-surface text-zinc-300"
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
                    aria-label={l.shareSlug ? C.unshare : C.share}
                    title={l.shareSlug ? C.unshare : C.share}
                    className={`${btn} border-line text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
                  >
                    <Icon d={l.shareSlug ? ICONS.unlink : ICONS.share} className="h-5 w-5 shrink-0" />
                  </button>
                  {l.shareSlug && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(link);
                            setCopied(l.id);
                            setMessage("");
                          } catch {
                            setCopied("");
                            setMessage(C.copyFailed);
                          }
                        }}
                        aria-label={copied === l.id ? C.copied : C.copy}
                        title={copied === l.id ? C.copied : C.copy}
                        className={`${btn} border-line hover:border-white/25 ${copied === l.id ? "text-emerald-300" : "text-zinc-300 hover:text-zinc-100"}`}
                      >
                        <Icon d={ICONS.copy} className="h-5 w-5 shrink-0" />
                      </button>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={C.open}
                        title={C.open}
                        className={`${btn} border-line text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
                      >
                        <Icon d={ICONS.external} className="h-5 w-5 shrink-0" />
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(C.confirmDelete)) run(() => remove(locale, l.id), "");
                    }}
                    aria-label={C.delete}
                    title={C.delete}
                    className={`${btn} ml-auto border-line text-zinc-400 hover:border-red-400/40 hover:text-red-300`}
                  >
                    <Icon d={ICONS.trash} className="h-5 w-5 shrink-0" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-line bg-panel/70 px-3 py-2 text-sm break-words text-zinc-300">
          {message}
        </p>
      )}

      <p role="status" className="sr-only">
        {copied ? C.copied : ""}
      </p>
    </div>
  );
}
