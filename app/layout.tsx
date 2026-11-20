import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopGirl Team Builder",
  description: "Susun tim 5 artist terbaik: bandingkan tier, genre, dan skill.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
