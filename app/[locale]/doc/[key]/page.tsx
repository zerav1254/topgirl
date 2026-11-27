import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ICONS, Icon } from "@/components/artist-ui";
import { DOCS, DOC_KEYS, type DocKey } from "@/lib/docs";
import { DICT, isLocale, t, type Locale } from "@/lib/i18n";
import { TEAM_SIZE } from "@/lib/team";

export function generateStaticParams() {
  return DOC_KEYS.map((key) => ({ key }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; key: string }> }): Promise<Metadata> {
  const { locale, key } = await params;
  if (!isLocale(locale) || !DOC_KEYS.includes(key as DocKey)) return {};
  const doc = DOCS[locale][key as DocKey];
  return {
    title: `${doc.title} — ${DICT[locale].meta.title}`,
    description: doc.intro,
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; key: string }> }) {
  const { locale: raw, key: rawKey } = await params;
  if (!isLocale(raw) || !DOC_KEYS.includes(rawKey as DocKey)) notFound();
  const locale: Locale = raw;
  const key = rawKey as DocKey;
  const C = DICT[locale];
  const doc = DOCS[locale][key];

  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-3 pb-28 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
          <h1 className="font-display text-lg font-bold tracking-tight sm:text-2xl">{doc.title}</h1>
        </div>
        <LocaleSwitcher locale={locale} />
      </header>

      <p className="text-sm text-zinc-400">{doc.intro}</p>

      <section className="flex flex-col gap-3">
        {doc.sections.map((s) => (
          <article key={s.title} className="rounded-2xl border border-line bg-panel/80 p-4 sm:p-5">
            <h2 className="mb-1 text-sm font-semibold text-zinc-100">{s.title}</h2>
            <p className="text-sm leading-relaxed text-zinc-400">{t(s.body, { size: TEAM_SIZE })}</p>
          </article>
        ))}
      </section>

      <nav aria-label={C.profile.links} className="flex flex-wrap gap-2">
        {DOC_KEYS.filter((k) => k !== key).map((k) => (
          <Link
            key={k}
            href={`/${locale}/doc/${k}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
          >
            <Icon d={k === "privacy" ? ICONS.shield : k === "legal" ? ICONS.file : ICONS.info} className="h-4 w-4 shrink-0" />
            {DOCS[locale][k].title}
          </Link>
        ))}
      </nav>

      <Link
        href={`/${locale}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
      >
        <Icon d={ICONS.home} className="h-4 w-4 shrink-0" />
        {C.isi.home}
      </Link>
    </main>
  );
}
