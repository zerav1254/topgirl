"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLineup, remove, toggleShare } from "@/app/[locale]/lineup/actions";
import { DICT, type Locale } from "@/lib/i18n";
import type { Lineup } from "@/lib/lineups";
import { getServerTeam, readTeam, subscribeTeam } from "@/lib/team-store";

type Result = { ok: boolean; error: string; link?: string };

export function LineupsTab({ lineups, locale, signedIn }: { lineups: Lineup[]; locale: Locale; signedIn: boolean }) {
  const C = DICT[locale].lineup;
  const router = useRouter();
  const saved = useSyncExternalStore(subscribeTeam, readTeam, getServerTeam);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState("");

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
      setMessage(res.ok ? (res.link ? `${C.shared}: ${res.link}` : C.saved) : res.error);
      router.refresh();
    });

  if (!signedIn) return <p className="text-sm text-zinc-400">{C.loginHint}</p>;

  const btn = "min-h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors duration-200";

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-panel/70 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("slugs", slugs.join(","));
          run(() => createLineup(locale, fd));
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          {C.name}
          <input
            name="name"
            required
            maxLength={60}
            defaultValue=""
            className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
          />
        </label>
        <p className="text-xs text-zinc-400">
          {slugs.length}/5 · {C.subtitle}
        </p>
        <button type="submit" disabled={pending} className={`${btn} border-gold/45 bg-gold/15 text-gold hover:bg-gold/25 disabled:opacity-60`}>
          {C.save}
        </button>
      </form>

      {lineups.length === 0 ? (
        <p className="text-sm text-zinc-400">{C.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lineups.map((l) => {
            const link = l.shareSlug ? `${typeof window === "undefined" ? "" : window.location.origin}/${locale}/l/${l.shareSlug}` : "";
            return (
              <li key={l.id} className="rounded-xl border border-white/10 bg-panel/70 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-semibold">{l.name}</span>
                  <span className="tabular shrink-0 text-xs text-zinc-400">
                    {l.slugs.length}/{5}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">{l.shareSlug ? C.shared : C.private}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => toggleShare(locale, l.id, !l.shareSlug))}
                    className={`${btn} border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}
                  >
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
                        {copied === l.id ? "✓" : C.copy}
                      </button>
                      <a href={link} target="_blank" rel="noreferrer" className={`${btn} inline-flex items-center border-white/10 text-zinc-300 hover:border-white/25 hover:text-zinc-100`}>
                        {C.open}
                      </a>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => remove(locale, l.id))}
                    className={`${btn} ml-auto border-white/10 text-zinc-400 hover:border-red-400/40 hover:text-red-300`}
                  >
                    {C.delete}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p role="status" className="text-sm text-zinc-300">
          {message}
        </p>
      )}
    </div>
  );
}
