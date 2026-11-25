// Satu sumber origin situs: metadata, OAuth callback, dan tautan share memakai ini.
const strip = (url: string) => url.replace(/\/+$/, "");

export const SITE_URL =
  strip(process.env.NEXT_PUBLIC_SITE_URL ?? "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";
