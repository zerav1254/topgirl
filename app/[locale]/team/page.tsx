import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtists } from "@/lib/artists-cache";
import { getProfile } from "@/lib/auth";
import { loadOwned } from "@/lib/collection";
import { DICT, isLocale, localeOr } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { TeamBuilder } from "@/components/team-builder";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = localeOr(locale);
  const C = DICT[l];
  return {
    title: C.header.docTeam,
    description: C.meta.description,
    ...pageMetadata({ locale: l, basePath: "/team", title: C.header.docTeam, description: C.meta.description }),
  };
}

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [artists, profile] = await Promise.all([getArtists(), getProfile()]);
  const owned = profile ? await loadOwned(profile.userId) : null;
  return (
    <TeamBuilder
      artists={artists}
      locale={locale}
      tab="team"
      owned={owned}
      user={profile?.name ?? profile?.email ?? null}
      avatarUrl={profile?.avatarUrl ?? null}
    />
  );
}
