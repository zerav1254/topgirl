import { loadArtists } from "@/lib/artists";
import { TeamBuilder } from "@/components/team-builder";

export const revalidate = 300;

export default async function Home() {
  const artists = await loadArtists();
  return <TeamBuilder artists={artists} />;
}
