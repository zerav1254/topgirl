"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DICT, localeOr, type Locale } from "@/lib/i18n";
import { deleteLineup, saveLineup, setShare } from "@/lib/lineups";
import { allow } from "@/lib/rate-limit";
import { TEAM_SIZE } from "@/lib/team";

export type LineupResult = { ok: boolean; error: string; link?: string };

const SLUG_RE = /^[a-z0-9-]+$/;

async function userId(): Promise<string | null> {
  try {
    return (await requireUser()).id;
  } catch {
    return null;
  }
}

export async function createLineup(locale: Locale, fd: FormData): Promise<LineupResult> {
  const l = localeOr(locale);
  const C = DICT[l].lineup;
  const uid = await userId();
  if (!uid) return { ok: false, error: C.loginHint };
  if (!allow(`lineup:${uid}`, 20, 60_000)) return { ok: false, error: C.error };

  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  if (!name) return { ok: false, error: C.error };

  // Slug dari klien tetap divalidasi; duplikat dibuang di lib/lineups.
  const slugs = String(fd.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SLUG_RE.test(s))
    .slice(0, TEAM_SIZE);
  if (slugs.length === 0) return { ok: false, error: C.needTeam };

  if (!(await saveLineup(uid, name, slugs))) return { ok: false, error: C.error };
  revalidatePath(`/${l}/lineups`);
  return { ok: true, error: "" };
}

export async function remove(locale: Locale, id: string): Promise<LineupResult> {
  const l = localeOr(locale);
  const C = DICT[l].lineup;
  const uid = await userId();
  if (!uid) return { ok: false, error: C.loginHint };
  if (!allow(`lineup:${uid}`, 20, 60_000)) return { ok: false, error: C.error };
  if (!(await deleteLineup(uid, id))) return { ok: false, error: C.error };
  revalidatePath(`/${l}/lineups`);
  return { ok: true, error: "" };
}

export async function toggleShare(locale: Locale, id: string, share: boolean): Promise<LineupResult> {
  const l = localeOr(locale);
  const C = DICT[l].lineup;
  const uid = await userId();
  if (!uid) return { ok: false, error: C.loginHint };
  if (!allow(`lineup:${uid}`, 20, 60_000)) return { ok: false, error: C.error };
  const slug = await setShare(uid, id, share);
  if (slug === null) return { ok: false, error: C.error };
  revalidatePath(`/${l}/lineups`);
  return { ok: true, error: "", link: slug ? `/${l}/l/${slug}` : undefined };
}
