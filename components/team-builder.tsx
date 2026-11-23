"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import { TEAM_SIZE } from "@/lib/team";
import { ICONS, Icon } from "./artist-ui";
import { ArtistsTab } from "./artists-tab";
import { LocaleSwitcher } from "./locale-switcher";
import { TeamTab } from "./team-tab";

const STORAGE_KEY = "topgirl.team.v1";

const listeners = new Set<() => void>();
const readTeam = () => localStorage.getItem(STORAGE_KEY);
const getServerTeam = () => null;

function subscribeTeam(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeTeam(next: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((notify) => notify());
}

type Tab = "artists" | "team";

export function TeamBuilder({ artists, locale }: { artists: Artist[]; locale: Locale }) {
  const [tab, setTab] = useState<Tab>("artists");
  const C = DICT[locale];

  const bySlug = useMemo(() => new Map(artists.map((a) => [a.slug, a])), [artists]);
  const saved = useSyncExternalStore(subscribeTeam, readTeam, getServerTeam);
  const picked = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(saved ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string" && bySlug.has(s)).slice(0, TEAM_SIZE) : [];
    } catch {
      return [];
    }
  }, [saved, bySlug]);

  useEffect(() => {
    document.title = tab === "team" ? C.header.docTeam : C.header.docArtists;
  }, [tab, C]);

  const team = picked.map((slug) => bySlug.get(slug)).filter((a): a is Artist => Boolean(a));
  const full = team.length >= TEAM_SIZE;

  function toggle(slug: string) {
    writeTeam(picked.includes(slug) ? picked.filter((s) => s !== slug) : picked.length >= TEAM_SIZE ? picked : [...picked, slug]);
  }

  return (
    <div id="main" className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pt-4 pb-28 sm:px-6 sm:pt-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/assets/icon-topgirl.webp"
            alt=""
            width={96}
            height={96}
            sizes="40px"
            priority
            className="h-10 w-10 shrink-0 rounded-xl border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <h1 className="font-display truncate text-xl font-bold tracking-tight sm:text-2xl">
              {tab === "artists" ? C.header.artists : C.header.team}
            </h1>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <LocaleSwitcher locale={locale} />
          <Link
            href={`/${locale}/manage`}
            className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            {C.header.manage}
          </Link>
        </div>
      </header>

      {tab === "artists" ? (
        <ArtistsTab artists={artists} picked={picked} full={full} locale={locale} onToggle={toggle} onOpenTeam={() => setTab("team")} />
      ) : (
        <TeamTab artists={artists} team={team} picked={picked} full={full} locale={locale} onToggle={toggle} onReset={() => writeTeam([])} />
      )}

      <nav
        aria-label={C.header.mainNav}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-panel/95 backdrop-blur"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-1 px-2 pt-1">
          <button
            type="button"
            onClick={() => setTab("artists")}
            aria-current={tab === "artists" ? "true" : undefined}
            className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              tab === "artists" ? "text-gold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon d={ICONS.list} className="h-5 w-5" />
            {C.header.artists}
          </button>
          <button
            type="button"
            onClick={() => setTab("team")}
            aria-current={tab === "team" ? "true" : undefined}
            className={`relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold transition-colors duration-200 ${
              tab === "team" ? "text-gold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="relative">
              <Icon d={ICONS.users} className="h-5 w-5" />
              <span
                aria-hidden="true"
                className={`tabular absolute -top-2.5 -right-3 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold ${
                  full ? "bg-gold text-ink" : team.length > 0 ? "bg-brand text-white" : "bg-white/10 text-zinc-300"
                }`}
              >
                {team.length}
              </span>
            </span>
            <span>
              {C.header.team}
              <span className="sr-only"> {t(C.header.tabCount, { n: team.length, size: TEAM_SIZE })}</span>
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
