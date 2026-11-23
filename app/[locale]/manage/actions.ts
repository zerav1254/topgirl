"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearAdminCookie, isAdmin, sameSecret, setAdminCookie } from "@/lib/auth";
import { DICT, LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { EFFECTS } from "@/lib/score";
import { PHOTO_BUCKET, adminClient } from "@/lib/supabase";

export type SaveResult = { ok: boolean; error: string };

const EFFECT_SET = new Set<string>(EFFECTS);
const SLUG_RE = /^[a-z0-9-]+$/;

// ponytail: throttle login in-memory per instance. Ganti ke store bersama kalau butuh batas lintas instance.
const WINDOW = 5 * 60_000;
const MAX_TRIES = 5;
const tries = new Map<string, { n: number; at: number }>();

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

// Revalidasi semua locale: foto/stat dipakai di setiap halaman bahasa.
function revalidateAll() {
  for (const l of LOCALES) {
    revalidatePath(`/${l}`);
    revalidatePath(`/${l}/manage`);
  }
}

const txt = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const pos = (fd: FormData, key: string) => {
  const n = Number(txt(fd, key));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

const safeLocale = (locale: Locale): Locale => (isLocale(locale) ? locale : "id");

export async function login(locale: Locale, fd: FormData): Promise<void> {
  const l = safeLocale(locale);
  const key = await clientKey();
  const now = Date.now();
  const prev = tries.get(key);
  const blocked = Boolean(prev && now - prev.at < WINDOW && prev.n >= MAX_TRIES);
  if (blocked || !sameSecret(String(fd.get("password") ?? ""), process.env.ADMIN_PASSWORD ?? "")) {
    tries.set(key, !prev || now - prev.at >= WINDOW ? { n: 1, at: now } : { n: prev.n + 1, at: now });
    redirect(`/${l}/manage?error=login`);
  }
  tries.delete(key);
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

  const skills = [1, 2].flatMap((slot) => {
    const effect = txt(fd, `s${slot}_effect`);
    return effect ? [{ slot, effect, value: pos(fd, `s${slot}_value`) }] : [];
  });
  // Efek yang tidak dikenal kode tidak boleh masuk DB: akan hilang saat loadArtists memfilter.
  if (skills.some((s) => !EFFECT_SET.has(s.effect))) return { ok: false, error: C.unknownRef };

  const fail = (e: { code?: string; message: string }) => ({
    ok: false,
    error: e.code === "23503" ? C.unknownRef : e.message,
  });

  // Satu transaksi di DB: update baris + ganti skill; gagal di tengah tidak menghapus data lama.
  const { error } = await adminClient().rpc("save_artist_stats", {
    p_slug: slug,
    p_name: name,
    p_genre: genre,
    p_origin: origin ?? "",
    p_season: pos(fd, "season"),
    p_skills: skills,
  });
  if (error) return fail(error);

  revalidateAll();
  return { ok: true, error: "" };
}

export type UploadResult = { ok: boolean; error: string };

// Tidak redirect: hasil dikembalikan supaya klien bisa tampilkan error upload
// (Vercel menolak body >4,5 MB sebelum action ini jalan; foto dikompres di klien).
export async function uploadPhoto(locale: Locale, fd: FormData): Promise<UploadResult> {
  const l = safeLocale(locale);
  const E = DICT[l].isi.errors;
  const slug = txt(fd, "slug");
  if (!(await isAdmin())) return { ok: false, error: DICT[l].actions.session };

  const file = fd.get("photo");
  if (!slug || !SLUG_RE.test(slug) || !(file instanceof File) || file.size === 0) return { ok: false, error: E.foto };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: E.ukur };

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, error: E.format };
  }

  const sb = adminClient();
  const path = `${slug}.webp`;
  const up = await sb.storage.from(PHOTO_BUCKET).upload(path, webp, { contentType: "image/webp", upsert: true });
  if (up.error) return { ok: false, error: E.upload };

  const upd = await sb
    .from("artists")
    .update({ photo_path: path, photo_updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("id");
  if (upd.error) return { ok: false, error: upd.error.message };
  if (!upd.data?.length) return { ok: false, error: E.upload };

  revalidateAll();
  return { ok: true, error: "" };
}
