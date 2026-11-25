"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DICT, localeOr, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { adminClient } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

export type ProfileResult = { ok: boolean; error: string };

type Provider = "google" | "discord";

// Kosong = null (hapus nilai). Bukan angka bulat positif = NaN (tolak).
const num = (fd: FormData, key: string): number | null => {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : Number.NaN;
};

export async function saveProfile(locale: Locale, fd: FormData): Promise<ProfileResult> {
  const C = DICT[localeOr(locale)].profile;
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: C.error };
  }

  const ingameId = num(fd, "ingameId");
  const ingameServer = num(fd, "ingameServer");
  if (Number.isNaN(ingameId) || Number.isNaN(ingameServer)) return { ok: false, error: C.error };

  const name = String(fd.get("name") ?? "").trim() || null;
  const nickname = String(fd.get("ingameNickname") ?? "").trim() || null;
  if ((name && name.length > 60) || (nickname && nickname.length > 40)) return { ok: false, error: C.error };

  const { error } = await adminClient()
    .from("profiles")
    .update({ name, ingame_id: ingameId, ingame_server: ingameServer, ingame_nickname: nickname })
    .eq("user_id", userId);
  if (error) return { ok: false, error: C.error };

  revalidatePath(`/${localeOr(locale)}/profile`);
  return { ok: true, error: "" };
}

// Bind provider kedua ke akun yang sedang login. Butuh "manual linking" aktif di Supabase.
export async function linkProvider(locale: Locale, provider: Provider): Promise<void> {
  const l = localeOr(locale);
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: { redirectTo: `${SITE_URL}/auth/callback?next=/${l}/profile` },
  });
  if (error || !data?.url) redirect(`/${l}/profile?error=link`);
  redirect(data.url);
}

// Lepas provider; identitas terakhir tidak boleh dilepas (akun jadi tidak bisa masuk).
export async function unlinkProvider(locale: Locale, provider: Provider): Promise<void> {
  const l = localeOr(locale);
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUserIdentities();
  const identities = data?.identities ?? [];
  const target = identities.find((i) => i.provider === provider);
  if (!target || identities.length < 2) redirect(`/${l}/profile?error=unlink`);

  const { error } = await supabase.auth.unlinkIdentity(target);
  if (error) redirect(`/${l}/profile?error=unlink`);

  revalidatePath(`/${l}/profile`);
  redirect(`/${l}/profile`);
}
