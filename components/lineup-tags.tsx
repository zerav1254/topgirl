import type { Artist } from "@/lib/artists";
import type { Locale } from "@/lib/i18n";
import { EFFECT_LABEL } from "@/lib/score";
import { genreSynergy, lineupEffects } from "@/lib/team";

// Tag lineup: ringkasan sinyal skill tim, bukan nilai stat (nilai ada di halaman share).
export function LineupTags({ team, locale }: { team: Artist[]; locale: Locale }) {
  const tags = lineupEffects(team);
  // Genre hanya yang sudah dapat bonus sinergi (3+ artis), urut jumlah terbanyak.
  const genres = genreSynergy(team).genres.filter(([, n]) => n >= 3);
  // Season hanya dari artis terbatas season, terbesar dulu; artis reguler (null) tidak menambah tag.
  const seasons = [...new Set(team.map((a) => a.season).filter((s): s is number => s !== null))].sort((a, b) => b - a);
  if (tags.length === 0 && seasons.length === 0 && genres.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-1">
      {genres.map(([genre, n]) => (
        <span
          key={`genre-${genre}`}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300"
        >
          {genre}
          <span className="tabular">×{n}</span>
        </span>
      ))}
      {seasons.map((s) => (
        <span
          key={`season-${s}`}
          className="tabular inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[11px] font-semibold text-gold"
        >
          S{s}
        </span>
      ))}
      {tags.map((tag) => (
        <span
          key={tag.effect}
          className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300"
        >
          {EFFECT_LABEL[tag.effect][locale]}
          <span className="tabular text-zinc-400">×{tag.count}</span>
        </span>
      ))}
    </span>
  );
}
