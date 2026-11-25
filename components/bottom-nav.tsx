"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DICT, t, type Locale } from "@/lib/i18n";
import { TEAM_SIZE } from "@/lib/team";
import { getServerTeam, readTeam, subscribeTeam } from "@/lib/team-store";
import { ICONS, Icon } from "./artist-ui";

const ITEM = "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-center text-xs font-semibold leading-tight transition-colors duration-200";
const IDLE = "text-zinc-400 hover:bg-white/5 hover:text-zinc-200";
const ACTIVE = "text-gold bg-gold/10";

export function BottomNav({ locale, admin }: { locale: Locale; admin: boolean }) {
  const C = DICT[locale];
  const base = `/${locale}`;
  const pathname = usePathname() ?? base;
  const saved = useSyncExternalStore(subscribeTeam, readTeam, getServerTeam);

  const count = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(saved ?? "[]");
      return Array.isArray(parsed) ? Math.min(parsed.length, TEAM_SIZE) : 0;
    } catch {
      return 0;
    }
  }, [saved]);

  const onArtists = pathname === base || pathname === `${base}/`;
  const onTeam = pathname === `${base}/team`;
  const onProfile = pathname.startsWith(`${base}/profile`);
  const full = count >= TEAM_SIZE;

  return (
    <nav
      aria-label={C.header.mainNav}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-panel/95 backdrop-blur"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className={`mx-auto grid max-w-lg ${admin ? "grid-cols-5" : "grid-cols-4"} gap-1 px-2 pt-1`}>
        <Link
          href={base}
          aria-current={onArtists ? "page" : undefined}
          className={`${ITEM} ${onArtists ? ACTIVE : IDLE}`}
        >
          <Icon d={ICONS.star} className="h-5 w-5" />
          {C.header.artists}
        </Link>
        <Link
          href={`${base}/team`}
          aria-current={onTeam ? "page" : undefined}
          className={`${ITEM} relative ${onTeam ? ACTIVE : IDLE}`}
        >
          <span className="relative">
            <Icon d={ICONS.users} className="h-5 w-5" />
            <span
              aria-hidden="true"
              className={`tabular absolute -top-2.5 -right-3 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold ${
                full ? "bg-gold text-ink" : count > 0 ? "bg-brand text-white" : "bg-white/10 text-zinc-300"
              }`}
            >
              {count}
            </span>
          </span>
          <span>
            {C.header.team}
            <span className="sr-only"> {t(C.header.tabCount, { n: count, size: TEAM_SIZE })}</span>
          </span>
        </Link>
        <Link
          href={`${base}/lineups`}
          aria-current={pathname === `${base}/lineups` ? "page" : undefined}
          className={`${ITEM} ${pathname === `${base}/lineups` ? ACTIVE : IDLE}`}
        >
          <Icon d={ICONS.layers} className="h-5 w-5" />
          {C.header.lineups}
        </Link>
        {admin && (
          <Link
            href={`${base}/manage`}
            aria-current={pathname === `${base}/manage` ? "page" : undefined}
            className={`${ITEM} ${pathname === `${base}/manage` ? ACTIVE : IDLE}`}
          >
            <Icon d={ICONS.edit} className="h-5 w-5" />
            {C.header.manage}
          </Link>
        )}
        <Link
          href={`${base}/profile`}
          aria-current={onProfile ? "page" : undefined}
          className={`${ITEM} ${onProfile ? ACTIVE : IDLE}`}
        >
          <Icon d={ICONS.user} className="h-5 w-5" />
          {C.profile.title}
        </Link>
      </div>
    </nav>
  );
}
