"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { DICT, LOCALES, localeOr, type Locale } from "@/lib/i18n";
import { EFFECT_SET } from "@/lib/score";
import { PHOTO_BUCKET, adminClient } from "@/lib/supabase";

export type SaveResult = { ok: boolean; error: string };

const SLUG_RE = /^[a-z0-9-]+$/;

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

const safeLocale = localeOr;

// Semua action tulis wajib lewat gate role; gagal = sesi habis, bukan pesan internal.
async function hasAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function saveArtist(locale: Locale, fd: FormData): Promise<SaveResult> {
  const C = DICT[safeLocale(locale)].actions;
  if (!(await hasAdmin())) return { ok: false, error: C.session };

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
  if (!(await hasAdmin())) return { ok: false, error: DICT[l].actions.session };

  const file = fd.get("photo");
  if (!slug || !SLUG_RE.test(slug) || !(file instanceof File) || file.size === 0) return { ok: false, error: E.foto };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: E.ukur };

  const sb = adminClient();
  // Pastikan slug ada dulu: upload ke storage bersifat upsert, tanpa cek ini file
  // bisa tertinggal sebagai orphan kalau update baris gagal.
  const found = await sb.from("artists").select("id").eq("slug", slug).maybeSingle();
  if (found.error) return { ok: false, error: found.error.message };
  if (!found.data) return { ok: false, error: E.upload };

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, error: E.format };
  }

  const path = `${slug}.webp`;
  const up = await sb.storage.from(PHOTO_BUCKET).upload(path, webp, { contentType: "image/webp", upsert: true });
  if (up.error) return { ok: false, error: E.upload };

  const upd = await sb
    .from("artists")
    .update({ photo_path: path, photo_updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (upd.error) return { ok: false, error: upd.error.message };

  revalidateAll();
  return { ok: true, error: "" };
}
