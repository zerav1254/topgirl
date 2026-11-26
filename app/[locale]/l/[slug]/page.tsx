import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtists } from "@/lib/artists-cache";
import { DICT, isLocale, t, type Locale } from "@/lib/i18n";
import { loadShared } from "@/lib/lineups";
import { GENRE_BONUS, TEAM_SIZE, teamSkillTotals } from "@/lib/team";
import { DEFAULT_CATEGORY, EFFECT_LABEL, TIER_ORDER } from "@/lib/score";
import { Avatar, GenreIcon, ICONS, Icon, SkillList, TierBadge, formatStat, isPercent } from "@/components/artist-ui";
import { UserAvatar } from "@/components/user-avatar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"];
  const shared = await loadShared(slug);
  return {
    title: shared ? `${C.lineup.shareTitle.replace("{name}", shared.lineup.name)} — ${C.meta.title}` : C.lineup.notFound,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const C = DICT[locale];

  const [shared, artists] = await Promise.all([loadShared(slug), getArtists()]);
  if (!shared) notFound();

  const bySlug = new Map(artists.map((a) => [a.slug, a]));
  const genreImages = new Map(artists.map((a) => [a.genre, a.genreImage]));
  const team = shared.lineup.slugs.map((s) => bySlug.get(s)).filter((a) => a !== undefined);

  const totalScore = team.reduce((sum, a) => sum + a.scores[DEFAULT_CATEGORY], 0);
  const avgScore = team.length > 0 ? totalScore / team.length : 0;
  const tierCounts = TIER_ORDER.map((tier) => [tier, team.filter((a) => a.tiers[DEFAULT_CATEGORY] === tier).length] as const).filter(([, n]) => n > 0);
  const genreCount = new Map<string, number>();
  for (const a of team) genreCount.set(a.genre, (genreCount.get(a.genre) ?? 0) + 1);
  const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]);
  const [topGenre, topCount] = genres[0] ?? ["", 0];
  const genreBonus = GENRE_BONUS[topCount] ?? 0;
  const { playerDmg, stats } = teamSkillTotals(team);

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel/80 p-4 sm:p-5">
        <span aria-hidden="true" className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <UserAvatar src={shared.ownerAvatarUrl} name={shared.ownerName ?? "TG"} frame={shared.ownerAvatarFrame} px={56} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
            <h1 className="font-display text-xl font-bold tracking-tight break-words sm:text-2xl">
              {C.lineup.shareTitle.replace("{name}", shared.lineup.name)}
            </h1>
            {shared.ownerName && (
              <p className="truncate text-sm text-zinc-400">
                {t(C.lineup.by, { name: shared.ownerName })}
                {shared.ownerServer ? ` · ${C.profile.ingameServer} ${shared.ownerServer}` : ""}
              </p>
            )}
          </div>
          <span className="tabular inline-flex shrink-0 items-center rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-display text-xs font-semibold text-zinc-100">
            {team.length}/{TEAM_SIZE}
          </span>
        </div>
      </header>

      {team.length > 0 && (
        <>
          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-panel/70 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.lineup.totalScore}</dt>
              <dd className="tabular mt-0.5 font-display text-xl font-bold text-zinc-100">{formatStat(totalScore, locale)}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-panel/70 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.lineup.avgScore}</dt>
              <dd className="tabular mt-0.5 font-display text-xl font-bold text-gold">{formatStat(avgScore, locale)}</dd>
            </div>
          </dl>

          <section className="rounded-xl border border-white/10 bg-panel/70 p-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.team.tiers}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {tierCounts.map(([tier, n]) => (
                <span key={tier} className="inline-flex items-center gap-1">
                  <TierBadge tier={tier} />
                  <span className="tabular text-xs text-zinc-400">×{n}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
              {genres.map(([g, n]) => (
                <span key={g} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-300">
                  <GenreIcon image={genreImages.get(g) ?? null} className="h-3 w-3" />
                  {g} <span className="text-zinc-400">×{n}</span>
                </span>
              ))}
              {genreBonus > 0 ? (
                <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {t(C.team.synergy, { n: topCount, genre: topGenre, bonus: genreBonus })}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">{t(C.team.synergyNeed, { n: topCount, genre: topGenre })}</span>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-panel/70 p-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{C.team.stats}</h2>
            {stats.length === 0 ? (
              <p className="mt-1.5 text-sm text-zinc-400">{C.team.noStats}</p>
            ) : (
              <dl className="mt-1.5 flex flex-col gap-1.5 text-sm">
                {stats.map(([effect, value]) => {
                  const boosted = (effect === "skill_dmg" || effect === "basic_atk") && playerDmg > 0;
                  return (
                    <div key={effect} className="flex items-baseline justify-between gap-2">
                      <dt className="min-w-0 truncate text-zinc-400">{EFFECT_LABEL[effect][locale]}</dt>
                      <dd className="tabular shrink-0 whitespace-nowrap font-semibold text-zinc-200">
                        {formatStat(value, locale)}
                        {isPercent(effect) && "%"}
                        {boosted && (
                          <span className="ml-1 font-normal text-emerald-300">
                            +{formatStat(playerDmg, locale)}% = {formatStat(value + playerDmg, locale)}%
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </section>
        </>
      )}

      {team.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-400">{C.lineup.notFound}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {team.map((a, i) => (
            <li
              key={a.slug}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel/70 p-2.5 transition-colors duration-200 hover:border-white/25"
            >
              <span className="tabular w-4 shrink-0 text-center text-xs text-zinc-400">{i + 1}</span>
              <Avatar artist={a} tier={a.tiers[DEFAULT_CATEGORY]} size="h-11 w-11" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm text-zinc-400">
                  <GenreIcon image={a.genreImage} className="h-3 w-3 shrink-0" />
                  <span className="truncate">{a.genre}</span>
                </span>
                <span className="block truncate text-base font-semibold">{a.name}</span>
                <SkillList baseDmg={a.baseDmg} skills={a.skills} locale={locale} className="mt-1" />
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="tabular font-display text-base font-semibold text-zinc-100">{formatStat(a.scores[DEFAULT_CATEGORY], locale)}</span>
                <TierBadge tier={a.tiers[DEFAULT_CATEGORY]} />
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link
        href={`/${locale}/team`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
      >
        <Icon d={ICONS.plus} className="h-4 w-4 shrink-0" />
        {C.lineup.buildOwn}
      </Link>
    </main>
  );
}
