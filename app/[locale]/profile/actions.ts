"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DICT, localeOr, type Locale } from "@/lib/i18n";
import { allow } from "@/lib/rate-limit";
import { clientIp, verifyTurnstile } from "@/lib/turnstile";
import { SITE_URL } from "@/lib/site";
import { adminClient } from "@/lib/supabase-admin";
import { AVATAR_BUCKET, SUPABASE_URL } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

export type ProfileResult = { ok: boolean; error: string };

type Provider = "google" | "discord";

// Kosong = null (hapus nilai). Bukan angka bulat positif = NaN (tolak).
const num = (fd: FormData, key: string, max = Number.MAX_SAFE_INTEGER): number | null => {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n <= max ? n : Number.NaN;
};

export async function saveProfile(locale: Locale, fd: FormData): Promise<ProfileResult> {
  const C = DICT[localeOr(locale)].profile;
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: C.error };
  }

  if (!allow(`profile:${userId}`, 20, 60_000)) return { ok: false, error: C.error };

  const ingameId = num(fd, "ingameId");
  const ingameServer = num(fd, "ingameServer", 32767);
  if (Number.isNaN(ingameId) || Number.isNaN(ingameServer)) return { ok: false, error: C.error };

  const name = String(fd.get("name") ?? "").trim() || null;
  const nickname = String(fd.get("ingameNickname") ?? "").trim() || null;
  if ((name && name.length > 60) || (nickname && nickname.length > 40)) return { ok: false, error: C.error };

  const { error } = await adminClient()
    .from("profiles")
    .update({ name, ingame_id: ingameId, ingame_server: ingameServer, ingame_nickname: nickname })
    .eq("user_id", userId);
  if (error) return { ok: false, error: C.error };

  const l = localeOr(locale);
  revalidatePath(`/${l}/profile`);
  revalidatePath(`/${l}/u/${userId}`);
  return { ok: true, error: "" };
}

// Avatar user: path tetap <user_id>.webp + upsert, jadi satu file per akun, tanpa orphan.
export async function uploadAvatar(locale: Locale, fd: FormData): Promise<ProfileResult> {
  const l = localeOr(locale);
  const C = DICT[l].profile;
  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: DICT[l].actions.session };
  }

  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) return { ok: false, error: C.avatarError };
  if (!allow(`avatar:${userId}`, 5, 10 * 60_000)) return { ok: false, error: C.avatarError };
  if (!(await verifyTurnstile(fd.get("cf-turnstile-response"), "avatar-upload", await clientIp()))) {
    return { ok: false, error: C.avatarError };
  }

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 4096 * 4096 })
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { ok: false, error: C.avatarError };
  }

  const sb = adminClient();
  const path = `${userId}.webp`;
  const upload = await sb.storage.from(AVATAR_BUCKET).upload(path, webp, { contentType: "image/webp", upsert: true });
  if (upload.error) return { ok: false, error: C.avatarError };

  // Query versi: path tetap, tanpa ini browser/CDN menyajikan avatar lama.
  const url = `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${path}?v=${Date.now()}`;
  const { error } = await sb.from("profiles").update({ avatar_url: url }).eq("user_id", userId);
  if (error) return { ok: false, error: C.avatarError };

  revalidatePath(`/${l}/profile`);
  revalidatePath(`/${l}/u/${userId}`);
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
