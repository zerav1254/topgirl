import { NextResponse } from "next/server";
import { localeOr } from "@/lib/i18n";
import { createSupabaseServer } from "@/lib/supabase/server";

// Tukar `code` jadi session di cookie, lalu kembali ke halaman locale.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "";
  const locale = localeOr(next.split("/")[1]);
  // Hanya path internal: tolak "//host" dan URL absolut supaya tidak jadi open redirect.
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}`;

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.redirect(new URL(`/${locale}/login?error=auth`, request.url));
}
