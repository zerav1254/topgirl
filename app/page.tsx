import { loadArtists } from "@/lib/artists";
import { TeamBuilder } from "@/components/team-builder";

export default function Home() {
  return <TeamBuilder artists={loadArtists()} />;
}
