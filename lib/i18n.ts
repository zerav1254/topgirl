import { en } from "./dict/en.ts";
import { id, type Dict } from "./dict/id.ts";

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type { Dict };

export const DICT: Record<Locale, Dict> = { id, en };

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

export const t = (text: string, vars?: Record<string, string | number>) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`)) : text;

export const numberLocale = (locale: Locale) => (locale === "id" ? "id-ID" : "en-US");
