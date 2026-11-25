import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const LOCALES = ["id", "en", "fr", "ko", "zh", "ja", "de"];

// "/" ikut bahasa browser; locale tak dikenal jatuh ke id.
function preferredLocale(header: string | null): string {
  for (const part of (header ?? "").split(",")) {
    const tag = part.trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(tag)) return tag;
  }
  return "id";
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
