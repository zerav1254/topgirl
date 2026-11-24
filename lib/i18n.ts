import { en } from "./dict/en.ts";
import { fr } from "./dict/fr.ts";
import { id, type Dict } from "./dict/id.ts";
import { ko } from "./dict/ko.ts";

export const LOCALES = ["id", "en", "fr", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export type { Dict };

export const DICT: Record<Locale, Dict> = { id, en, fr, ko };

// Nama bahasa untuk aria-label tombol ganti bahasa (ditulis dalam bahasanya sendiri).
export const LANG_NAME: Record<Locale, string> = { id: "Indonesia", en: "English", fr: "Français", ko: "한국어" };

// Singkatan yang tampil di switcher (dipakai bersama bendera).
export const LANG_CODE: Record<Locale, string> = { id: "ID", en: "EN", fr: "FR", ko: "KO" };

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

// Locale dari URL yang tidak dikenal jatuh ke default (id), bukan 404.
export const localeOr = (value: string): Locale => (isLocale(value) ? value : "id");

export const t = (text: string, vars?: Record<string, string | number>) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`)) : text;

const NUMBER_LOCALE: Record<Locale, string> = { id: "id-ID", en: "en-US", fr: "fr-FR", ko: "ko-KR" };

export const numberLocale = (locale: Locale) => NUMBER_LOCALE[locale];
