import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { artistCostBook, getCostBook } from "@/lib/costs";
import { DICT, isLocale, type Locale } from "@/lib/i18n";
import { ICONS, Icon } from "@/components/artist-ui";
import { CostCalculator } from "@/components/cost-calculator";
import { LocaleSwitcher } from "@/components/locale-switcher";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const C = DICT[isLocale(locale) ? locale : "id"].cost;
  return { title: C.metaTitle, description: C.metaDescription, robots: { index: false, follow: false } };
}

export default async function CostPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  // Tab artist boleh diakses publik; tab biaya lain hanya untuk user login.
  const user = await getUser();
  const C = DICT[locale].cost;
  const book = await getCostBook();

  return (
    <main id="main" className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-3 pb-28 sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/${locale}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-panel/80 px-3 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100"
        >
          <Icon d={ICONS.arrowLeft} className="h-4 w-4 shrink-0" />
          {C.back}
        </Link>
        <LocaleSwitcher locale={locale} />
      </div>

      <header className="flex flex-col gap-1.5">
        <p className="font-display text-2xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{C.title}</h1>
        <p className="max-w-2xl text-sm text-zinc-400">{C.intro}</p>
      </header>

      <CostCalculator book={user ? book : artistCostBook(book)} signedIn={Boolean(user)} locale={locale} />
    </main>
  );
}
