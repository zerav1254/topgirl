import Image from "next/image";
import type { Artist, Effect } from "@/lib/artists";
import { DICT, numberLocale, type Locale } from "@/lib/i18n";
import { EFFECT_LABEL } from "@/lib/score";

const TIER_STYLE: Record<string, string> = {
  "S+": "border-gold/45 bg-gold/15 text-gold",
  S: "border-brand/45 bg-brand/15 text-red-300",
  A: "border-purple-500/45 bg-purple-500/15 text-purple-300",
  B: "border-sky-500/45 bg-sky-500/15 text-sky-300",
  C: "border-emerald-500/45 bg-emerald-500/15 text-emerald-300",
  D: "border-zinc-500/45 bg-zinc-500/15 text-zinc-300",
};

const AVATAR_STYLE: Record<string, string> = {
  "S+": "from-gold/80 to-brand/70",
  S: "from-brand/80 to-brand/40",
  A: "from-purple-500/80 to-purple-700/50",
  B: "from-sky-500/80 to-sky-700/50",
  C: "from-emerald-500/80 to-emerald-700/50",
  D: "from-zinc-500/80 to-zinc-700/50",
};

const GENRE_IMAGE: Record<string, string> = {
  Pop: "pop",
  Rock: "rock",
  "Hip Hop": "hiphop",
  EDM: "edm",
  "R&B": "rnb",
};

export const isPercent = (effect: Effect) => !effect.startsWith("dps");

const skillText = (s: Artist["skills"][number], locale: Locale) =>
  `${EFFECT_LABEL[s.effect][locale]}${s.value !== null ? ` ${s.value}${isPercent(s.effect) ? "%" : ""}` : ""}`;

// Dua slot boleh berisi efek sama; ringkas jadi "… ×2" supaya tidak terbaca bug.
export const skillList = (skills: Artist["skills"], locale: Locale) => {
  const counts = new Map<string, number>();
  for (const s of skills) {
    const text = skillText(s, locale);
    counts.set(text, (counts.get(text) ?? 0) + 1);
  }
  return [...counts].map(([t, n]) => (n > 1 ? `${t} ×${n}` : t)).join(" / ");
};

export const formatStat = (v: number, locale: Locale) => v.toLocaleString(numberLocale(locale), { maximumFractionDigits: 1 });

export function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  plus: "M12 5v14M5 12h14",
  close: "M18 6 6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  check: "M20 6 9 17l-5-5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

export function TierBadge({ tier, className = "" }: { tier: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-display text-sm font-semibold ${TIER_STYLE[tier] ?? TIER_STYLE.D} ${className}`}>
      {tier}
    </span>
  );
}

export function Avatar({ artist, size = "h-12 w-12" }: { artist: Artist; size?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${AVATAR_STYLE[artist.tier] ?? AVATAR_STYLE.D} ${size}`}>
      {artist.photoUrl ? (
        <Image src={artist.photoUrl} alt="" width={96} height={96} sizes="96px" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-lg font-bold text-white/80">
          {artist.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function GenreIcon({ genre, className = "h-4 w-4" }: { genre: string; className?: string }) {
  const file = GENRE_IMAGE[genre];
  if (!file) return null;
  return <Image src={`/assets/images/genres/${file}.png`} alt="" width={16} height={16} sizes="16px" className={`${className} object-contain`} />;
}

export function SearchInput({
  value,
  onChange,
  locale,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  placeholder?: string;
}) {
  const c = DICT[locale].common;
  return (
    <div className="relative">
      <Icon d={ICONS.search} className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        placeholder={placeholder ?? c.searchPlaceholder}
        aria-label={c.searchArtist}
        className="w-full rounded-xl border border-white/10 bg-panel/80 py-3 pr-9 pl-9 text-base placeholder:text-zinc-400 focus:border-brand/60 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={c.clearSearch}
          className="absolute top-1/2 right-1 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          <Icon d={ICONS.close} className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
