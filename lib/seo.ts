import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n.ts";

export const SITE_NAME = "TopGirl Fan Site";
export const SITE_ICON = "/assets/icon-topgirl.webp";

const OG_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_US", fr: "fr_FR", ko: "ko_KR", zh: "zh_CN", ja: "ja_JP", de: "de_DE" };

// Chunk metadata bersama: canonical + hreflang per locale, Open Graph, Twitter.
// Dipakai root layout (basePath "") dan halaman info (basePath "/info").
export function pageMetadata({
  locale,
  basePath = "",
  title,
  description,
}: {
  locale: Locale;
  basePath?: string;
  title: string;
  description: string;
}): Metadata {
  const url = `/${locale}${basePath}`;
  return {
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(LOCALES.map((x) => [x, `/${x}${basePath}`])), "x-default": `/id${basePath}` },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((x) => x !== locale).map((x) => OG_LOCALE[x]),
      images: [{ url: SITE_ICON, width: 512, height: 512, alt: SITE_NAME }],
    },
    twitter: { card: "summary", title, description, images: [SITE_ICON] },
  };
}
