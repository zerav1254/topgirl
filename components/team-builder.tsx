"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import type { Category } from "@/lib/score";
import { TEAM_SIZE } from "@/lib/team";
import { getServerTeam, readTeam, subscribeTeam, writeTeam } from "@/lib/team-store";
import { isCategory, useArtistFilter } from "./artist-filter";
import { ArtistsTab } from "./artists-tab";
import { LocaleSwitcher } from "./locale-switcher";
import { TeamTab } from "./team-tab";

type Tab = "artists" | "team";

// Shell dipakai dua rute: /{locale} (artists) dan /{locale}/team. Tab dari route, bukan query.
export function TeamBuilder({ artists, locale, tab }: { artists: Artist[]; locale: Locale; tab: Tab }) {
  const C = DICT[locale];
  // Tidak ada bar kategori terpisah: filter "Spesialis" menentukan kategori skor/tier.
  const state = useArtistFilter(artists, locale);
  const category: Category = isCategory(state.filter.specialty) ? state.filter.specialty : "solo";

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
    <div id="main" className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pt-3 pb-28 sm:px-6 sm:pt-6">
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/assets/icon-topgirl.webp"
            alt=""
            width={96}
            height={96}
            sizes="40px"
            priority
            className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-2xl">
              {tab === "artists" ? C.header.artists : C.header.team}
            </h1>
          </div>
        </div>
        <div className="flex w-full items-center justify-end sm:w-auto">
          <LocaleSwitcher locale={locale} />
        </div>
      </header>

      {tab === "artists" ? (
        <ArtistsTab artists={artists} picked={picked} locale={locale} category={category} state={state} />
      ) : (
        <TeamTab
          artists={artists}
          team={team}
          picked={picked}
          locale={locale}
          category={category}
          state={state}
          onToggle={toggle}
          onAssign={assign}
          onReset={() => writeTeam([])}
        />
      )}
    </div>
  );
}
