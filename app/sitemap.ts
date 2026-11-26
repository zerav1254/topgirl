import type { MetadataRoute } from "next";
import { DOC_KEYS } from "@/lib/docs";
import { LOCALES } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

// Hanya halaman publik yang diindeks; login, profil, lineup, dan share tidak.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = ["", "/team", "/info", ...DOC_KEYS.map((k) => `/doc/${k}`)];
  return LOCALES.flatMap((locale) =>
    paths.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified,
      changeFrequency: path.startsWith("/doc/") ? "yearly" : "weekly",
      priority: path === "" ? 1 : 0.7,
    })),
  );
}
