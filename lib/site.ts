// Satu sumber origin situs: metadata, OAuth callback, dan tautan share memakai ini.
// Produksi default ke domain publik; dev tetap localhost supaya callback OAuth lokal jalan.
const strip = (url: string) => url.replace(/\/+$/, "");
const FALLBACK = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://zerav.web.id";

export const SITE_URL = strip(process.env.NEXT_PUBLIC_SITE_URL ?? "") || FALLBACK;
