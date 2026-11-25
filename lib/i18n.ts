import { de } from "./dict/de.ts";
import { en } from "./dict/en.ts";
import { fr } from "./dict/fr.ts";
import { id, type Dict } from "./dict/id.ts";
import { ja } from "./dict/ja.ts";
import { ko } from "./dict/ko.ts";
import { zh } from "./dict/zh.ts";

export const LOCALES = ["id", "en", "fr", "ko", "zh", "ja", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export type { Dict };

export const DICT: Record<Locale, Dict> = { id, en, fr, ko, zh, ja, de };

// Nama bahasa untuk aria-label tombol ganti bahasa (ditulis dalam bahasanya sendiri).
export const LANG_NAME: Record<Locale, string> = {
  id: "Indonesia",
  en: "English",
  fr: "Français",
  ko: "한국어",
  zh: "简体中文",
  ja: "日本語",
  de: "Deutsch",
};

// Singkatan yang tampil di switcher (dipakai bersama bendera).
export const LANG_CODE: Record<Locale, string> = { id: "ID", en: "EN", fr: "FR", ko: "KO", zh: "ZH", ja: "JA", de: "DE" };

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

// Locale dari URL yang tidak dikenal jatuh ke default (id), bukan 404.
export const localeOr = (value: string): Locale => (isLocale(value) ? value : "id");

export const t = (text: string, vars?: Record<string, string | number>) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`)) : text;

const NUMBER_LOCALE: Record<Locale, string> = { id: "id-ID", en: "en-US", fr: "fr-FR", ko: "ko-KR", zh: "zh-CN", ja: "ja-JP", de: "de-DE" };

export const numberLocale = (locale: Locale) => NUMBER_LOCALE[locale];
