"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { setOwned } from "@/lib/collection";
import { DICT, LOCALES, localeOr, type Locale } from "@/lib/i18n";

export type OwnedResult = { ok: boolean; error: string };

const SLUG_RE = /^[a-z0-9-]+$/;

export async function toggleOwned(locale: Locale, slug: string, owned: boolean): Promise<OwnedResult> {
  const l = localeOr(locale);
  const C = DICT[l].collection;
  // Slug divalidasi sebelum menyentuh DB: FK sudah menjaga, tapi regex menolak input sampah lebih awal.
  if (!SLUG_RE.test(slug)) return { ok: false, error: C.error };

  let userId: string;
  try {
    userId = (await requireUser()).id;
  } catch {
    return { ok: false, error: C.loginHint };
  }

  if (!(await setOwned(userId, slug, owned))) return { ok: false, error: C.error };

  // Koleksi memengaruhi peringkat pool di semua locale.
  for (const x of LOCALES) revalidatePath(`/${x}`);
  return { ok: true, error: "" };
}
