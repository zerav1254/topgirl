"use server";

import { redirect } from "next/navigation";
import { localeOr, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { createSupabaseServer } from "@/lib/supabase/server";

// Provider ditentukan di server, bukan dari FormData: klien tidak boleh memilih provider sembarangan.
export async function signIn(locale: Locale, provider: "google" | "discord"): Promise<void> {
  const l = localeOr(locale);
  if (provider !== "google" && provider !== "discord") redirect(`/${l}/login?error=auth`);
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${SITE_URL}/auth/callback?next=/${l}` },
  });
  if (error || !data.url) redirect(`/${l}/login?error=auth`);
  redirect(data.url);
}

export async function signOut(locale: Locale): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect(`/${localeOr(locale)}`);
}
