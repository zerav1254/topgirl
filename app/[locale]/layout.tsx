import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, Noto_Sans_KR, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BottomNav } from "@/components/bottom-nav";
import { DOCS } from "@/lib/docs";
import { DICT, LOCALES, localeOr } from "@/lib/i18n";
import { SITE_ICON, pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
// preload: false — Inter/Sora tidak punya glyph Hangul; Noto baru diunduh saat halaman memuat teks Korea.
const notoKo = Noto_Sans_KR({ variable: "--font-ko", display: "swap", preload: false });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// Hex literal: metadata viewport tidak bisa membaca custom property @theme.
export const viewport: Viewport = { themeColor: "#0b0b0f", colorScheme: "dark" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = localeOr(locale);
  const meta = DICT[l].meta;
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    icons: { icon: SITE_ICON, apple: "/assets/apple-icon.png" },
    ...pageMetadata({ locale: l, title: meta.title, description: meta.description }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  // Jangan notFound() di layout: Next memakai 404 default, bukan [locale]/not-found.
  // Halaman di bawah segmen ini yang memvalidasi lalu memanggil notFound().
  const locale = localeOr(raw);

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
        <footer className="mx-auto w-full max-w-4xl px-4 pb-28 text-xs leading-relaxed text-zinc-500">
          <p>{DOCS[locale].legal.sections[0].body}</p>
          <Link
            href={`/${locale}/doc/legal`}
            className="mt-1 inline-block min-h-11 font-semibold text-zinc-400 underline-offset-2 hover:text-gold hover:underline"
          >
            {DOCS[locale].legal.title}
          </Link>
        </footer>
        <BottomNav locale={locale} />
        <Analytics />
      </body>
    </html>
  );
}
