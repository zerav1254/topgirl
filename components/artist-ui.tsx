import Image from "next/image";
import type { Artist, Role } from "@/lib/artists";
import { DICT, numberLocale, type Locale } from "@/lib/i18n";
import { BASE_SKILL_INTERVAL, BASE_SKILL_LABEL, EFFECT_LABEL, FLAT_EFFECTS, type Effect } from "@/lib/score";

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

// Warna per peran panggung; 'support' ikut hijau karena belum ada di roster.
const ROLE_STYLE: Record<string, string> = {
  center: "border-gold/45 bg-gold/15 text-gold",
  singer: "border-sky-500/45 bg-sky-500/15 text-sky-300",
  dancer: "border-purple-500/45 bg-purple-500/15 text-purple-300",
  support: "border-emerald-500/45 bg-emerald-500/15 text-emerald-300",
};

export const isPercent = (effect: Effect) => !FLAT_EFFECTS.has(effect);

export const formatStat = (v: number, locale: Locale) => v.toLocaleString(numberLocale(locale), { maximumFractionDigits: 1 });

// Daftar skill berangka dipakai di kartu artist dan dialog picker.
// Baris 1 = skill dasar flat semua artist (tidak ikut rank), baris 2/3 dari tabel skill.
export function SkillList({
  baseDmg,
  skills,
  locale,
  className = "",
}: {
  baseDmg: number;
  skills: Artist["skills"];
  locale: Locale;
  className?: string;
}) {
  const rows = [
    { slot: 1, label: BASE_SKILL_LABEL[locale], value: `${formatStat(baseDmg, locale)} / ${BASE_SKILL_INTERVAL}s` },
    ...skills.map((s, i) => ({
      slot: i + 2,
      label: EFFECT_LABEL[s.effect][locale],
      value: s.value === null ? "—" : `${formatStat(s.value, locale)}${isPercent(s.effect) ? "%" : ""}`,
    })),
  ];
  return (
    <span className={`flex flex-col gap-0.5 ${className}`}>
      {rows.map((r) => (
        <span key={r.slot} className="flex items-baseline justify-between gap-2 text-xs">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="tabular text-2xs font-semibold text-zinc-400">{r.slot}</span>
            <span className="truncate text-zinc-400">{r.label}</span>
          </span>
          <span className="tabular shrink-0 font-semibold text-zinc-200">{r.value}</span>
        </span>
      ))}
    </span>
  );
}

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
  layers: "M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7h.01",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  edit: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "m6 9 6 6 6-6",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  home: "M3 11l9-8 9 8M5 9v11a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3",
  save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM7 3v6h9M7 21v-7h10v7",
  copy: "M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2ZM5 15H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.59 13.51l6.83 3.98M15.41 6.51 8.59 10.49",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L11.75 5.19M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72",
  unlink: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L11.75 5.19M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72M2 2l20 20",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h5",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

export function TierBadge({ tier, className = "" }: { tier: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-display text-sm font-semibold ${TIER_STYLE[tier] ?? TIER_STYLE.D} ${className}`}>
      {tier}
    </span>
  );
}

// Peran panggung; teks dari dict supaya ikut bahasa aktif.
export function RoleBadge({ role, locale, className = "" }: { role: Role; locale: Locale; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-2xs font-semibold whitespace-nowrap ${ROLE_STYLE[role] ?? ROLE_STYLE.support} ${className}`}
    >
      {DICT[locale].artists.role[role]}
    </span>
  );
}

// Peringkat relatif pool. Label dibaca screen reader; "#3" sendiri ambigu tanpa konteks.
export function RankBadge({ rank, size, label, className = "" }: { rank: number; size: number; label: string; className?: string }) {
  return (
    <span
      aria-label={label}
      title={label}
      className={`tabular inline-flex items-center rounded-md border border-white/15 bg-surface px-1.5 py-0.5 font-display text-xs font-semibold text-zinc-100 ${className}`}
    >
      #{rank}
      <span className="text-zinc-400">/{size}</span>
    </span>
  );
}

export function Avatar({ artist, size = "h-12 w-12", tier = artist.tier }: { artist: Artist; size?: string; tier?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${AVATAR_STYLE[tier] ?? AVATAR_STYLE.D} ${size}`}>
      {artist.photoUrl ? (
        <Image src={artist.photoUrl} alt="" width={96} height={96} sizes="56px" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-lg font-bold text-white/80">
          {artist.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function GenreIcon({ image, className = "h-4 w-4" }: { image: string | null; className?: string }) {
  if (!image) return null;
  return <Image src={`/assets/images/genres/${image}.png`} alt="" width={16} height={16} sizes="16px" className={`${className} object-contain`} />;
}

// Ikon atribut sing/dance dari game (ChangGe/TiaoWu) untuk roster, tim, lineup.
const STAT_ICON = {
  sing: "/assets/images/attributes/stat-sing.webp",
  dance: "/assets/images/attributes/stat-dance.webp",
};

export function StatIcon({ stat, className = "h-4 w-4" }: { stat: "sing" | "dance"; className?: string }) {
  return <Image src={STAT_ICON[stat]} alt="" width={16} height={16} sizes="16px" className={`${className} object-contain`} />;
}

// Ikon buff kalkulator dari UI_Icon_Common_StatusInfo; buff koleksi memakai
// varian per genre untuk Menyanyi/Menari, Kelola memakai ikon umum.
const BUFF_ICON = {
  sing: "/assets/images/attributes/buff-sing.webp",
  dance: "/assets/images/attributes/buff-dance.webp",
  manage: "/assets/images/attributes/buff-manage.webp",
  speed: "/assets/images/attributes/buff-speed.webp",
} as const;

const GENRE_BUFF_ICON: Record<string, { sing: string; dance: string }> = {
  Rock: { sing: "/assets/images/attributes/buff-rock-sing.webp", dance: "/assets/images/attributes/buff-rock-dance.webp" },
  EDM: { sing: "/assets/images/attributes/buff-edm-sing.webp", dance: "/assets/images/attributes/buff-edm-dance.webp" },
  Pop: { sing: "/assets/images/attributes/buff-pop-sing.webp", dance: "/assets/images/attributes/buff-pop-dance.webp" },
  "R&B": { sing: "/assets/images/attributes/buff-rnb-sing.webp", dance: "/assets/images/attributes/buff-rnb-dance.webp" },
  "Hip Hop": { sing: "/assets/images/attributes/buff-hiphop-sing.webp", dance: "/assets/images/attributes/buff-hiphop-dance.webp" },
};

export type BuffKey = keyof typeof BUFF_ICON;

export function BuffIcon({ stat, genre, className = "h-4 w-4" }: { stat: BuffKey; genre?: string | null; className?: string }) {
  const src = (genre && (stat === "sing" || stat === "dance") ? GENRE_BUFF_ICON[genre]?.[stat] : undefined) ?? BUFF_ICON[stat];
  return <Image src={src} alt="" width={16} height={16} sizes="16px" className={`${className} object-contain`} />;
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
        className="w-full rounded-xl border border-line bg-panel/80 py-3 pr-12 pl-9 text-base placeholder:text-zinc-400 focus:border-brand/60 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={c.clearSearch}
          className="absolute top-1/2 right-0.5 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-zinc-400 hover:bg-surface hover:text-zinc-200"
        >
          <Icon d={ICONS.close} className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
