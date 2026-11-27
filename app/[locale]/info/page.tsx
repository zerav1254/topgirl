import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ICONS, Icon, formatStat, isPercent, TierBadge } from "@/components/artist-ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DICT, isLocale, localeOr, numberLocale, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import {
  BANDS,
  EFFECT_LABEL,
  SCALE,
  SCORE,
  SKILL_WEIGHT,
  STAT_REF,
  STAT_WEIGHT,
  scoreArtist,
  tierFromScore,
  type Effect,
  type Skill,
  type StageStats,
} from "@/lib/score";

// Stat Sing/Dance di level maks (sumber: CHeroLevelCard).
const EXAMPLES: { name: string; skills: Skill[]; stats: StageStats }[] = [
  {
    name: "Longkui",
    skills: [{ effect: "skill_dmg", value: 30 }, { effect: "player_dmg", value: 30 }],
    stats: { sing: 23175, dance: 23175 },
  },
  {
    name: "Monica",
    skills: [{ effect: "player_dmg", value: 30 }, { effect: "player_dmg", value: 30 }],
    stats: { sing: 23175, dance: 23175 },
  },
];

// Nilai dari config client v1.0.158 (lihat .topgirl-ripper/FINDINGS.md).
const BATTLE_CONSTS = [
  { name: "battle_normal_attack", value: "200", label: "battleNormalAttack" },
  { name: "skill_cast_round", value: "10", label: "battleSkillRound" },
  { name: "attr_reduction_factor", value: "0.1", label: "battleAttrFactor" },
  { name: "fans_power_factor", value: "1.5", label: "battleFansPower" },
  { name: "power_reduction_factor", value: "0.4", label: "battlePowerReduction" },
] as const;

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
          {t(C.formulaText, { skill: SKILL_WEIGHT, stat: STAT_WEIGHT })}
        </p>
        <p className="mt-3 text-sm text-zinc-400">{t(C.formulaNote, { scale: SCALE, ref: STAT_REF.toLocaleString(number) })}</p>
      </section>

      <section aria-labelledby="info-weights" className="flex flex-col gap-3">
        <div>
          <h2 id="info-weights" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
            {C.weights}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">{C.weightsNote}</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-panel/60">
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
              {(Object.entries(SCORE) as [Effect, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([effect, weight]) => (
                  <tr key={effect} className="border-t border-white/5">
                    <td className="px-3 py-2 text-zinc-300">{EFFECT_LABEL[effect][locale]}</td>
                    <td className="tabular px-3 py-2 text-right font-semibold text-zinc-100">{formatWeight(weight)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="info-player" className="rounded-2xl border border-white/10 bg-panel/60 p-4 sm:p-5">
        <h2 id="info-player" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {C.player}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{C.playerNote}</p>
      </section>

      <section aria-labelledby="info-battle" className="rounded-2xl border border-white/10 bg-panel/60 p-4 sm:p-5">
        <h2 id="info-battle" className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
          {C.battle}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{C.battleIntro}</p>
        <p className="tabular mt-3 overflow-x-auto rounded-xl border border-white/10 bg-ink/60 px-3 py-3 font-mono text-sm text-zinc-100">
          {C.battleFormulaText}
        </p>
        <p className="mt-3 text-sm text-zinc-400">{C.battleFormulaNote}</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-panel/60">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {C.battleConst}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  {C.battleValue}
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {C.battleMeaning}
                </th>
              </tr>
            </thead>
            <tbody>
              {BATTLE_CONSTS.map((row) => (
                <tr key={row.name} className="border-t border-white/5">
                  <td className="px-3 py-2 font-mono text-[13px] text-zinc-300">{row.name}</td>
                  <td className="tabular px-3 py-2 text-right font-semibold text-zinc-100">{row.value}</td>
                  <td className="px-3 py-2 text-zinc-300">{C[row.label]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          <span className="font-semibold text-zinc-300">{C.battleSkillOne}.</span> {C.battleSkillOneValue}.{" "}
          {C.battleSkillOneNote}
        </p>
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
              {EXAMPLES.map(({ name, skills, stats }) => {
                const score = scoreArtist(skills, stats);
                return (
                  <tr key={name} className="border-t border-white/5">
                    <td className="px-3 py-2 font-semibold text-zinc-100">{name}</td>
                    <td className="px-3 py-2 text-zinc-300">
                      {skills.map(skillLine).join(" + ")}
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        {C.stats} {formatStat(stats.sing ?? 0, locale)} / {formatStat(stats.dance ?? 0, locale)}
                      </span>
                    </td>
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
