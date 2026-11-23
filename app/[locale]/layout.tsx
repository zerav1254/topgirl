import type { Metadata } from "next";
import { Inter, Noto_Sans_KR, Sora } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { DICT, LOCALES, isLocale } from "@/lib/i18n";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });
// preload: false — Inter/Sora tidak punya glyph Hangul; Noto baru diunduh saat halaman memuat teks Korea.
const notoKo = Noto_Sans_KR({ variable: "--font-ko", display: "swap", preload: false });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const meta = DICT[isLocale(locale) ? locale : "id"].meta;
  return {
    title: meta.title,
    description: meta.description,
    icons: { icon: "/assets/icon-topgirl.webp", apple: "/assets/apple-icon.png" },
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
