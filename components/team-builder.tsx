"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import { CATEGORIES, type Category } from "@/lib/score";
import { TEAM_SIZE } from "@/lib/team";
import { getServerTeam, getServerUrl, readTeam, readUrl, subscribeTeam, subscribeUrl, writeTeam } from "@/lib/team-store";
import { ArtistsTab } from "./artists-tab";
import { LocaleSwitcher } from "./locale-switcher";
import { TeamTab } from "./team-tab";

type Tab = "artists" | "team";

export function TeamBuilder({ artists, locale }: { artists: Artist[]; locale: Locale }) {
  const C = DICT[locale];
  // Tab ikut ?tab=team: refresh tidak selalu kembali ke Artists, dan back/forward ikut tersinkron.
  const search = useSyncExternalStore(subscribeUrl, readUrl, getServerUrl);
  const tab: Tab = new URLSearchParams(search).get("tab") === "team" ? "team" : "artists";
  const [category, setCategory] = useState<Category>("solo");

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

  function toggle(slug: string) {
    writeTeam(picked.includes(slug) ? picked.filter((s) => s !== slug) : picked.length >= TEAM_SIZE ? picked : [...picked, slug]);
  }

  // Pilih dari dialog slot: tempatkan di slot yang diklik, buang duplikat artist yang sama.
  function assign(index: number, slug: string) {
    const next = picked.filter((s) => s !== slug);
    if (next[index] !== undefined) next[index] = slug;
    else next.push(slug);
    writeTeam(next.slice(0, TEAM_SIZE));
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
        <div className="flex w-full items-center justify-end sm:w-auto">
          <LocaleSwitcher locale={locale} />
        </div>
      </header>

      <div
        role="group"
        aria-label={C.categories.label}
        className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-panel/60 p-1 sm:grid-cols-4"
      >
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`min-h-11 cursor-pointer rounded-lg px-2 text-sm font-semibold transition-colors duration-200 ${
              category === c ? "bg-gold/15 text-gold" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            {C.categories[c]}
          </button>
        ))}
      </div>

      {tab === "artists" ? (
        <ArtistsTab artists={artists} picked={picked} locale={locale} category={category} />
      ) : (
        <TeamTab
          artists={artists}
          team={team}
          picked={picked}
          locale={locale}
          category={category}
          onToggle={toggle}
          onAssign={assign}
          onReset={() => writeTeam([])}
        />
      )}
    </div>
  );
}
