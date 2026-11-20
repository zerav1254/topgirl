import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: "TopGirl Team Builder",
  description: "Susun tim 5 artist terbaik: bandingkan tier, genre, dan skill.",
  icons: { icon: "/assets/icon-topgirl.webp", apple: "/assets/apple-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-dvh text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
