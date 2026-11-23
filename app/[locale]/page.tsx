import { notFound } from "next/navigation";
import { loadArtists } from "@/lib/artists";
import { isLocale } from "@/lib/i18n";
import { TeamBuilder } from "@/components/team-builder";

export const revalidate = 300;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const artists = await loadArtists();
  return <TeamBuilder artists={artists} locale={locale} />;
}
