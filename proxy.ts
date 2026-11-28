import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALES } from "./lib/locales.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseOrigin = url ? new URL(url).origin : "";

function security(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${supabaseOrigin} https://challenges.cloudflare.com https://vitals.vercel-insights.com`,
    `img-src 'self' data: blob: ${supabaseOrigin} https://lh3.googleusercontent.com https://cdn.discordapp.com`,
    "font-src 'self'",
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  return { csp, headers };
}

function preferredLocale(header: string | null): string {
  const parts = (header ?? "").split(",").map((part) => {
    const [rawTag, ...params] = part.trim().toLowerCase().split(";");
    const weight = Number(params.find((p) => p.trim().startsWith("q="))?.slice(2) ?? 1);
    const tag = rawTag === "in" ? "id" : rawTag.slice(0, 2);
    return { tag, weight: Number.isFinite(weight) ? weight : 0 };
  });
  const valid = parts.filter((p) => isLocale(p.tag)).sort((a, b) => b.weight - a.weight);
  return valid[0]?.tag ?? LOCALES[0];
}

export async function proxy(request: NextRequest) {
  const { csp, headers } = security(request);
  if (request.nextUrl.pathname === "/") {
    const response = NextResponse.redirect(new URL(`/${preferredLocale(request.headers.get("accept-language"))}`, request.url));
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  let response = NextResponse.next({ request: { headers } });
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers } });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|assets|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|webmanifest)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
