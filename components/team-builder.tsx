"use client";

import { useMemo, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toggleOwned } from "@/app/[locale]/collection/actions";
import type { Artist } from "@/lib/artists";
import { DICT, type Locale } from "@/lib/i18n";
import { parsePool, getServerPool, readPool, subscribePool, writePool } from "@/lib/pool-store";
import { blockedOf, poolActive, poolOf, poolTiers, rankInPool } from "@/lib/pool";
import type { Category } from "@/lib/score";
import { bestLineup, TEAM_SIZE } from "@/lib/team";
import { getServerTeam, readTeam, subscribeTeam, writeTeam } from "@/lib/team-store";
import { isCategory, useArtistFilter } from "./artist-filter";
import { ArtistsTab } from "./artists-tab";
import { LocaleSwitcher } from "./locale-switcher";
import { PoolPicker } from "./pool-picker";
import { TeamTab } from "./team-tab";

type Tab = "artists" | "team";

// Shell dipakai dua rute: /{locale} (artists) dan /{locale}/team. Tab dari route, bukan query.
export function TeamBuilder({
  artists,
  locale,
  tab,
  owned,
  user,
  avatarUrl,
}: {
  artists: Artist[];
  locale: Locale;
  tab: Tab;
  // null = belum login; array (boleh kosong) = sudah login.
  owned: string[] | null;
  user: string | null;
  // Avatar akun (Google/Discord); null = pakai inisial.
  avatarUrl: string | null;
}) {
  const C = DICT[locale];
  const [, startOwn] = useTransition();
  const [ownedError, setOwnedError] = useState("");
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  // Optimistic: tombol langsung berubah, dikembalikan ke data server kalau aksi gagal.
  const [ownedSlugs, addOwned] = useOptimistic<string[], [string, boolean]>(owned ?? [], (list, [slug, next]) =>
    next ? (list.includes(slug) ? list : [...list, slug]) : list.filter((s) => s !== slug),
  );
  const ownedSet = useMemo(() => (owned ? new Set(ownedSlugs) : null), [owned, ownedSlugs]);
  // Tidak ada bar kategori terpisah: filter "Spesialis" menentukan kategori skor/tier.
  const state = useArtistFilter(artists, locale, ownedSet ?? undefined);
  const category: Category = isCategory(state.filter.specialty) ? state.filter.specialty : "solo";

  const poolRaw = useSyncExternalStore(subscribePool, readPool, getServerPool);
  const pool = useMemo(() => parsePool(poolRaw), [poolRaw]);
  // Pool kosong = seluruh database: peringkat tidak ditampilkan supaya skala tetap absolut.
  const scoped = useMemo(() => poolOf(artists, pool), [artists, pool]);
  // Artis di atas season server: tetap tampil, tapi tidak masuk peringkat/lineup otomatis.
  const blocked = useMemo(() => new Set(blockedOf(artists, pool).map((a) => a.slug)), [artists, pool]);
  const rank = useMemo(
    () => (poolActive(pool) ? rankInPool(artists, pool, category) : null),
    [artists, pool, category],
  );
  const seasonTiers = useMemo(
    () => (poolActive(pool) ? poolTiers(artists, pool, category) : null),
    [artists, pool, category],
  );

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

  // Eksplisit lewat tombol: jangan menimpa tim yang sedang disusun tanpa klik.
  function autoLineup() {
    const best = bestLineup(scoped, category);
    if (best.length > 0) writeTeam(best.map((a) => a.slug));
  }

  function markOwned(slug: string, next: boolean) {
    if (!owned) return;
    setOwnedError("");
    setPendingSlug(slug);
    startOwn(async () => {
      addOwned([slug, next]);
      const result = await toggleOwned(locale, slug, next);
      // Aksi server sudah me-revalidate rute; tidak perlu router.refresh().
      if (!result.ok) setOwnedError(result.error || C.collection.error);
      setPendingSlug(null);
    });
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
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Link
            href={`/${locale}${user ? "/profile" : "/login"}`}
            className="flex min-h-11 max-w-40 items-center gap-1.5 truncate rounded-lg border border-white/10 px-2 text-xs font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            {user && (
              <span className="block h-6 w-6 shrink-0 overflow-hidden rounded-md border border-white/10 bg-panel-2">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" width={48} height={48} sizes="24px" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid h-full w-full place-items-center text-[10px] font-bold text-white/70">
                    {user.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
            )}
            <span className="truncate">{user ? user : C.auth.login}</span>
          </Link>
          <LocaleSwitcher locale={locale} />
        </div>
      </header>

      <PoolPicker artists={artists} pool={pool} locale={locale} onChange={writePool} />

      {tab === "artists" ? (
        <ArtistsTab
          artists={artists}
          scoped={scoped}
          blocked={blocked}
          rank={rank}
          seasonTiers={seasonTiers}
          owned={ownedSet}
          onOwned={markOwned}
          onToggle={toggle}
          ownedError={ownedError}
          pendingSlug={pendingSlug}
          picked={picked}
          locale={locale}
          category={category}
          state={state}
        />
      ) : (
        <TeamTab
          artists={artists}
          scoped={scoped}
          blocked={blocked}
          rank={rank}
          seasonTiers={seasonTiers}
          team={team}
          picked={picked}
          locale={locale}
          category={category}
          state={state}
          onToggle={toggle}
          onAssign={assign}
          onAuto={autoLineup}
          onReset={() => writeTeam([])}
        />
      )}
    </div>
  );
}
