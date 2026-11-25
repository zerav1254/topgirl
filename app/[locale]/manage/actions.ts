"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { DICT, LOCALES, localeOr, type Locale } from "@/lib/i18n";
import { PHOTO_BUCKET, adminClient } from "@/lib/supabase";

const SLUG_RE = /^[a-z0-9-]+$/;

// Revalidasi semua locale: foto/stat dipakai di setiap halaman bahasa.
function revalidateAll() {
  for (const l of LOCALES) {
    revalidatePath(`/${l}`);
    revalidatePath(`/${l}/manage`);
  }
}

const txt = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

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
