import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_KR, Sora } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { DICT, LOCALES, isLocale, type Locale } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
// preload: false — Inter/Sora tidak punya glyph Hangul; Noto baru diunduh saat halaman memuat teks Korea.
const notoKo = Noto_Sans_KR({ variable: "--font-ko", display: "swap", preload: false });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Vercel menyetel VERCEL_PROJECT_PRODUCTION_URL di production; lokal pakai localhost.
const SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "localhost:3000"}`;

const OG_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_US", fr: "fr_FR", ko: "ko_KR" };
const ICON = "/assets/icon-topgirl.webp";

export const viewport: Viewport = { themeColor: "#0b0b0f", colorScheme: "dark" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "id";
  const meta = DICT[l].meta;
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    icons: { icon: ICON, apple: "/assets/apple-icon.png" },
    alternates: {
      canonical: `/${l}`,
      languages: Object.fromEntries(LOCALES.map((x) => [x, `/${x}`])),
    },
    openGraph: {
      type: "website",
      siteName: "TopGirl",
      title: meta.title,
      description: meta.description,
      url: `/${l}`,
      locale: OG_LOCALE[l],
      alternateLocale: LOCALES.filter((x) => x !== l).map((x) => OG_LOCALE[x]),
      images: [{ url: ICON, width: 512, height: 512, alt: "TopGirl" }],
    },
    twitter: {
      card: "summary",
      title: meta.title,
      description: meta.description,
      images: [ICON],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={`${inter.variable} ${sora.variable} ${notoKo.variable}`}>
      <body className="min-h-dvh text-zinc-100 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-lg focus:border focus:border-gold/45 focus:bg-panel focus:px-4 focus:text-sm focus:font-semibold focus:text-gold"
        >
          {DICT[locale].common.skip}
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
