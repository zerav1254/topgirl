import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALES } from "./lib/locales.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// "/" ikut bahasa browser (q-value dihormati); locale tak dikenal jatuh ke id.
function preferredLocale(header: string | null): string {
  const parts = (header ?? "").split(",").map((part) => {
    const [rawTag, ...params] = part.trim().toLowerCase().split(";");
    const weight = Number(params.find((p) => p.trim().startsWith("q="))?.slice(2) ?? 1);
    // "in" = kode lama bahasa Indonesia.
    const tag = rawTag === "in" ? "id" : rawTag.slice(0, 2);
    return { tag, weight: Number.isFinite(weight) ? weight : 0 };
  });
  const valid = parts.filter((p) => isLocale(p.tag)).sort((a, b) => b.weight - a.weight);
  return valid[0]?.tag ?? LOCALES[0];
}

// Hanya refresh sesi. Tanpa env Supabase (mis. build CI), proxy jadi passthrough.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const locale = preferredLocale(request.headers.get("accept-language"));
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  let response = NextResponse.next({ request });
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml|webmanifest)$).*)"],
};
