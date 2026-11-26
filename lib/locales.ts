// Daftar locale tanpa dictionary: dipakai proxy tanpa menarik semua terjemahan.
export const LOCALES = ["id", "en", "fr", "ko", "zh", "ja", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

// Locale dari URL yang tidak dikenal jatuh ke default (id), bukan 404.
export const localeOr = (value: string): Locale => (isLocale(value) ? value : "id");
