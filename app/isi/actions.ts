"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminCookie, isAdmin, sameSecret, setAdminCookie } from "@/lib/auth";
import { PHOTO_BUCKET, adminClient } from "@/lib/supabase";

export type SaveResult = { ok: boolean; error: string };

const txt = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const pos = (fd: FormData, key: string) => {
  const n = Number(txt(fd, key));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export async function login(fd: FormData): Promise<void> {
  const ok = sameSecret(String(fd.get("password") ?? ""), process.env.ADMIN_PASSWORD ?? "");
  if (!ok) redirect("/isi?error=login");
  await setAdminCookie();
  redirect("/isi");
}

export async function logout(): Promise<void> {
  await clearAdminCookie();
  redirect("/isi");
}

export async function saveArtist(fd: FormData): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sesi habis. Muat ulang halaman lalu masuk lagi." };

  const slug = txt(fd, "slug");
  const name = txt(fd, "name");
  const genre = txt(fd, "genre");
  const region = txt(fd, "region") || null;
  if (!slug || !name) return { ok: false, error: "Nama wajib diisi." };

  // Region/genre/effect divalidasi foreign key di DB (lihat supabase/schema.sql).
  const skills = [1, 2].flatMap((slot) => {
    const effect = txt(fd, `s${slot}_effect`);
    return effect ? [{ slot, effect, value: pos(fd, `s${slot}_value`) }] : [];
  });

  const fail = (e: { code?: string; message: string }) => ({
    ok: false,
    error: e.code === "23503" ? "Genre, region, atau efek tidak dikenal." : e.message,
  });

  const sb = adminClient();
  const { data, error } = await sb
    .from("artists")
    .update({
      name,
      genre,
      region,
      season: pos(fd, "season"),
      base_sing: pos(fd, "base_sing"),
      base_dance: pos(fd, "base_dance"),
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

  revalidatePath("/");
  revalidatePath("/isi");
  return { ok: true, error: "" };
}

export async function uploadPhoto(fd: FormData): Promise<void> {
  const slug = txt(fd, "slug");
  if (!(await isAdmin())) redirect("/isi");

  const file = fd.get("photo");
  if (!slug || !(file instanceof File) || file.size === 0) redirect(`/isi?a=${slug}&error=foto`);
  if (file.size > 10 * 1024 * 1024) redirect(`/isi?a=${slug}&error=ukur`);

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    redirect(`/isi?a=${slug}&error=format`);
  }

  const sb = adminClient();
  const path = `${slug}.webp`;
  const up = await sb.storage.from(PHOTO_BUCKET).upload(path, webp, { contentType: "image/webp", upsert: true });
  if (up.error) redirect(`/isi?a=${slug}&error=upload`);

  await sb.from("artists").update({ photo_path: path, updated_at: new Date().toISOString() }).eq("slug", slug);
  revalidatePath("/");
  revalidatePath("/isi");
  redirect(`/isi?a=${slug}`);
}
