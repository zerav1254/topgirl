import type { Metadata } from "next";
import { loadArtists } from "@/lib/artists";
import { ArtistEditor } from "@/components/artist-editor";

export const metadata: Metadata = {
  title: "Isi Stat — TopGirl",
  description: "Lengkapi base stat dan skill artist, lalu unduh CSV untuk data/artists.csv.",
};

export default function Page() {
  return <ArtistEditor artists={loadArtists()} />;
}
