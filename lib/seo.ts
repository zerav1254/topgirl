import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n.ts";

export const SITE_NAME = "TopGirl Fan Site";
const OG_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_US", fr: "fr_FR", ko: "ko_KR", zh: "zh_CN", ja: "ja_JP", de: "de_DE" };

// Chunk metadata bersama: canonical + hreflang per locale, Open Graph, Twitter.
// Gambar ikon/OG disuplai file convention (app/icon.png, app/apple-icon.png,
// app/opengraph-image.png, app/twitter-image.png).
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
      // Objek openGraph eksplisit menekan injeksi og:image otomatis dari file
      // convention, jadi gambar ditunjuk langsung (app/opengraph-image.png).
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: "summary", title, description, images: ["/twitter-image.png"] },
  };
}
