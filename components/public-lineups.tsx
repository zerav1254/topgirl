import Link from "next/link";
import type { Artist } from "@/lib/artists";
import { DICT, t, type Locale } from "@/lib/i18n";
import type { PublicLineup } from "@/lib/lineups";
import { TEAM_SIZE } from "@/lib/team";
import { Avatar, ICONS, Icon } from "./artist-ui";
import { LineupTags } from "./lineup-tags";

// Kartu lineup komunitas: server component, tanpa state. Dibuka lewat tautan share yang sudah ada.
export function PublicLineups({ lineups, preview, locale }: { lineups: PublicLineup[]; preview: Artist[]; locale: Locale }) {
  const C = DICT[locale].lineup;
  const bySlug = new Map(preview.map((a) => [a.slug, a]));

  return (
    <section aria-label={C.communityTitle} className="flex flex-col gap-2">
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">{C.communityTitle}</h2>
        <p className="text-xs text-zinc-400">{C.communityHint}</p>
      </div>
      {lineups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-zinc-400">{C.communityEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lineups.map((l) => {
            const team = l.slugs.map((s) => bySlug.get(s)).filter((a) => a !== undefined);
            return (
              <li key={l.id}>
                <Link
                  href={`/${locale}/l/${l.shareSlug}`}
                  className="flex min-h-14 flex-col gap-2 rounded-xl border border-line bg-panel/70 p-3 transition-colors duration-200 hover:border-white/25 hover:bg-panel-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex shrink-0 -space-x-2">
                      {team.map((a) => (
                        <span key={a.slug} className="rounded-lg ring-2 ring-panel">
                          <Avatar artist={a} size="h-8 w-8" />
                        </span>
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{l.name}</span>
                      <span className="block truncate text-xs text-zinc-400">
                        {l.ownerName ? t(C.by, { name: l.ownerName }) : C.communityAnon}
                        <span className="tabular"> · {l.slugs.length}/{TEAM_SIZE}</span>
                      </span>
                    </span>
                    <Icon d={ICONS.chevronRight} className="h-4 w-4 shrink-0 text-zinc-400" />
                  </span>
                  <LineupTags team={team} locale={locale} />
                  <span aria-hidden="true" className="block h-1 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${(l.slugs.length / TEAM_SIZE) * 100}%` }} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
