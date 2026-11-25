import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ICONS, Icon, isPercent, TierBadge } from "@/components/artist-ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DICT, isLocale, localeOr, numberLocale, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import {
  BANDS,
  CATEGORIES,
  EFFECT_LABEL,
  SCALE,
  SCORE,
  scoreArtist,
  tierFromScore,
  type Effect,
  type Skill,
} from "@/lib/score";

const EXAMPLES: { name: string; skills: Skill[] }[] = [
  { name: "Longkui", skills: [{ effect: "skill_dmg", value: 30 }, { effect: "player_dmg", value: 30 }] },
  { name: "Monica", skills: [{ effect: "player_dmg", value: 30 }, { effect: "player_dmg", value: 30 }] },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = localeOr(locale);
  const info = DICT[l].info;
  return {
    title: info.metaTitle,
    description: info.metaDescription,
    ...pageMetadata({ locale: l, basePath: "/info", title: info.metaTitle, description: info.metaDescription }),
  };
}

export default async function InfoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const C = DICT[locale].info;
  const categories = DICT[locale].categories;
  const number = numberLocale(locale);
  const formatWeight = (weight: number) => weight.toLocaleString(number, { maximumFractionDigits: 2 });
  const formatScore = (score: number) => score.toLocaleString(number, { maximumFractionDigits: 1 });
  const skillLine = (s: Skill) =>
    `${EFFECT_LABEL[s.effect][locale]} ${s.value ?? 0}${isPercent(s.effect) ? "%" : ""}`;

  return (
    <main id="main" className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-8 pb-28 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/${locale}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
        >
          <Icon d={ICONS.arrowLeft} className="h-4 w-4 shrink-0" />
          {C.back}
        </Link>
        <LocaleSwitcher locale={locale} />
      </div>

      <header className="flex flex-col gap-2">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{C.title}</h1>
        <p className="max-w-2xl text-sm text-zinc-400">{C.intro}</p>
      </header>

      <section aria-labelledby="info-formula" className="rounded-2xl border border-white/10 bg-panel/60 p-4 sm:p-5">
        <h2 id="info-formula" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {C.formula}
        </h2>
        <p className="tabular mt-3 overflow-x-auto rounded-xl border border-white/10 bg-ink/60 px-3 py-3 font-mono text-sm text-zinc-100">
          {t(C.formulaText, { scale: SCALE })}
        </p>
        <p className="mt-3 text-sm text-zinc-400">{C.formulaNote}</p>
      </section>

      <section aria-labelledby="info-weights" className="flex flex-col gap-3">
        <div>
          <h2 id="info-weights" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
            {C.weights}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{C.weightsNote}</p>
        </div>
        {CATEGORIES.map((category) => {
          const rows = (Object.entries(SCORE[category]) as [Effect, number][]).sort((a, b) => b[1] - a[1]);
          return (
            <div key={category} className="overflow-x-auto rounded-xl border border-white/10 bg-panel/60">
              <h3 className="border-b border-white/10 px-3 py-2 font-display text-sm font-semibold text-gold">
                {categories[category]}
              </h3>
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-semibold">
                      {C.effect}
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">
                      {C.weight}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([effect, weight]) => (
                    <tr key={effect} className="border-t border-white/5">
                      <td className="px-3 py-2 text-zinc-300">{EFFECT_LABEL[effect][locale]}</td>
                      <td className="tabular px-3 py-2 text-right font-semibold text-zinc-100">{formatWeight(weight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="info-player" className="rounded-2xl border border-white/10 bg-panel/60 p-4 sm:p-5">
        <h2 id="info-player" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {C.player}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{C.playerNote}</p>
      </section>

      <section aria-labelledby="info-examples" className="flex flex-col gap-3">
        <div>
          <h2 id="info-examples" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
            {C.examples}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{C.exampleNote}</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-panel/60">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {C.artist}
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {C.calculation}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  {C.score}
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map(({ name, skills }) => {
                const score = scoreArtist(skills, "solo");
                return (
                  <tr key={name} className="border-t border-white/5">
                    <td className="px-3 py-2 font-semibold text-zinc-100">{name}</td>
                    <td className="px-3 py-2 text-zinc-300">{skills.map(skillLine).join(" + ")}</td>
                    <td className="tabular px-3 py-2 text-right">
                      <span className="mr-2 font-semibold text-zinc-100">{formatScore(score)}</span>
                      <TierBadge tier={tierFromScore(score)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="info-tiers" className="flex flex-col gap-3">
        <div>
          <h2 id="info-tiers" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
            {C.tiers}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{C.tiersNote}</p>
          <p className="mt-1 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-300">{C.tierPool}.</span> {C.tierPoolNote}
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-panel/60">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {C.tier}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  {C.minScore}
                </th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map(([tier, min]) => (
                <tr key={tier} className="border-t border-white/5">
                  <td className="px-3 py-2">
                    <TierBadge tier={tier} />
                  </td>
                  <td className="tabular px-3 py-2 text-right font-semibold text-zinc-100">{formatScore(min)}</td>
                </tr>
              ))}
              <tr className="border-t border-white/5">
                <td className="px-3 py-2">
                  <TierBadge tier="D" />
                </td>
                <td className="tabular px-3 py-2 text-right font-semibold text-zinc-100">
                  &lt; {formatScore(BANDS[BANDS.length - 1][1])}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
