"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminCookie, isAdmin, sameSecret, setAdminCookie } from "@/lib/auth";
import { DICT, LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { PHOTO_BUCKET, adminClient } from "@/lib/supabase";

export type SaveResult = { ok: boolean; error: string };

const txt = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const pos = (fd: FormData, key: string) => {
  const n = Number(txt(fd, key));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

const safeLocale = (locale: Locale): Locale => (isLocale(locale) ? locale : "id");

export async function login(locale: Locale, fd: FormData): Promise<void> {
  const l = safeLocale(locale);
  const ok = sameSecret(String(fd.get("password") ?? ""), process.env.ADMIN_PASSWORD ?? "");
  if (!ok) redirect(`/${l}/manage?error=login`);
  await setAdminCookie();
  redirect(`/${l}/manage`);
}

export async function logout(locale: Locale): Promise<void> {
  await clearAdminCookie();
  redirect(`/${safeLocale(locale)}/manage`);
}

export async function saveArtist(locale: Locale, fd: FormData): Promise<SaveResult> {
  const C = DICT[safeLocale(locale)].actions;
  if (!(await isAdmin())) return { ok: false, error: C.session };

  const slug = txt(fd, "slug");
  const name = txt(fd, "name");
  const genre = txt(fd, "genre");
  const origin = txt(fd, "origin") || null;
  if (!slug || !name) return { ok: false, error: C.nameRequired };

  // Origin/genre/effect divalidasi foreign key di DB (lihat supabase/schema.sql).
  const skills = [1, 2].flatMap((slot) => {
    const effect = txt(fd, `s${slot}_effect`);
    return effect ? [{ slot, effect, value: pos(fd, `s${slot}_value`) }] : [];
  });

  const fail = (e: { code?: string; message: string }) => ({
    ok: false,
    error: e.code === "23503" ? C.unknownRef : e.message,
  });

  const sb = adminClient();
  const { data, error } = await sb
    .from("artists")
    .update({
      name,
      genre,
      origin,
      season: pos(fd, "season"),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select("id")
    .single();
  if (error) return fail(error);

  const del = await sb.from("artist_skills").delete().eq("artist_id", data.id);
  if (del.error) return fail(del.error);

  if (skills.length) {
    const ins = await sb.from("artist_skills").insert(skills.map((s) => ({ ...s, artist_id: data.id })));
    if (ins.error) return fail(ins.error);
  }

  for (const l of LOCALES) {
    revalidatePath(`/${l}`);
    revalidatePath(`/${l}/manage`);
  }
  return { ok: true, error: "" };
}

export async function uploadPhoto(locale: Locale, fd: FormData): Promise<void> {
  const l = safeLocale(locale);
  const slug = txt(fd, "slug");
  if (!(await isAdmin())) redirect(`/${l}/manage`);

  const file = fd.get("photo");
  if (!slug || !(file instanceof File) || file.size === 0) redirect(`/${l}/manage?a=${slug}&error=foto`);
  if (file.size > 10 * 1024 * 1024) redirect(`/${l}/manage?a=${slug}&error=ukur`);

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    redirect(`/${l}/manage?a=${slug}&error=format`);
  }

  const sb = adminClient();
  const path = `${slug}.webp`;
  const up = await sb.storage.from(PHOTO_BUCKET).upload(path, webp, { contentType: "image/webp", upsert: true });
  if (up.error) redirect(`/${l}/manage?a=${slug}&error=upload`);

  await sb.from("artists").update({ photo_path: path, updated_at: new Date().toISOString() }).eq("slug", slug);
  revalidatePath(`/${l}`);
  revalidatePath(`/${l}/manage`);
  redirect(`/${l}/manage?a=${slug}`);
}
