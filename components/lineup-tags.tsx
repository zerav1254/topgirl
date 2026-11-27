import type { Artist } from "@/lib/artists";
import type { Locale } from "@/lib/i18n";
import { EFFECT_LABEL } from "@/lib/score";
import { genreSynergy, lineupEffects } from "@/lib/team";
import { GenreIcon } from "./artist-ui";

// Tag lineup: ringkasan sinyal skill tim, bukan nilai stat (nilai ada di halaman share).
export function LineupTags({ team, locale }: { team: Artist[]; locale: Locale }) {
  const tags = lineupEffects(team);
  // Genre hanya yang sudah dapat bonus sinergi (3+ artis), urut jumlah terbanyak.
  const genres = genreSynergy(team).genres.filter(([, n]) => n >= 3);
  const genreImages = new Map(team.map((a) => [a.genre, a.genreImage] as const));
  // Season hanya dari artis terbatas season, terbesar dulu; artis reguler (null) tidak menambah tag.
  const seasons = [...new Set(team.map((a) => a.season).filter((s): s is number => s !== null))].sort((a, b) => b - a);
  if (tags.length === 0 && seasons.length === 0 && genres.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-1">
      {genres.map(([genre, n]) => {
        const image = genreImages.get(genre) ?? null;
        return (
          <span
            key={`genre-${genre}`}
            title={genre}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-2xs font-semibold text-emerald-300"
          >
            {image ? <GenreIcon image={image} className="h-3.5 w-3.5 shrink-0" /> : genre}
            <span className="tabular">×{n}</span>
            <span className="sr-only">{genre}</span>
          </span>
        );
      })}
      {seasons.map((s) => (
        <span
          key={`season-${s}`}
          className="tabular inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-2xs font-semibold text-gold"
        >
          S{s}
        </span>
      ))}
      {tags.map((tag) => (
        <span
          key={tag.effect}
          className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-surface px-1.5 py-0.5 text-2xs font-semibold text-zinc-300"
        >
          {EFFECT_LABEL[tag.effect][locale]}
          <span className="tabular text-zinc-400">×{tag.count}</span>
        </span>
      ))}
    </span>
  );
}
