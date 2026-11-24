import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadArtists } from "@/lib/artists";
import { DICT, isLocale, localeOr } from "@/lib/i18n";
import { TeamBuilder } from "@/components/team-builder";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: DICT[localeOr(locale)].header.docArtists };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const artists = await loadArtists();
  return <TeamBuilder artists={artists} locale={locale} tab="artists" />;
}
