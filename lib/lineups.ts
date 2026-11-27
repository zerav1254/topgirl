import { randomBytes } from "node:crypto";
import { cache } from "react";
import { adminClient } from "./supabase.ts";

export type Lineup = {
  id: string;
  name: string;
  slugs: string[];
  shareSlug: string | null;
  updatedAt: string;
};

type Row = { id: string; name: string; slugs: string[]; share_slug: string | null; updated_at: string };

const COLS = "id,name,slugs,share_slug,updated_at";

const toLineup = (r: Row): Lineup => ({
  id: r.id,
  name: r.name,
  slugs: r.slugs,
  shareSlug: r.share_slug,
  updatedAt: r.updated_at,
});

// lineups RLS tanpa policy: semua akses lewat service_role, user_id selalu dari session.
export async function loadLineups(userId: string): Promise<Lineup[]> {
  const { data, error } = await adminClient().from("lineups").select(COLS).eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) return [];
  return (data as Row[]).map(toLineup);
}

export async function saveLineup(userId: string, name: string, slugs: string[]): Promise<boolean> {
  const sb = adminClient();
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return false;
  // slugs text[] tanpa FK: pastikan setiap slug benar-benar ada sebelum disimpan.
  const { data, error } = await sb.from("artists").select("slug").in("slug", unique);
  if (error || (data as { slug: string }[]).length !== unique.length) return false;

  const { error: insertError } = await sb.from("lineups").insert({ user_id: userId, name, slugs: unique });
  return !insertError;
}

export async function deleteLineup(userId: string, id: string): Promise<boolean> {
  const { error } = await adminClient().from("lineups").delete().eq("id", id).eq("user_id", userId);
  return !error;
}

// 12 byte base64url: tidak bisa ditebak berurutan. null = privat.
export async function setShare(userId: string, id: string, share: boolean): Promise<string | null> {
  const sb = adminClient();
  if (!share) {
    const { error } = await sb.from("lineups").update({ share_slug: null }).eq("id", id).eq("user_id", userId);
    return error ? null : "";
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const slug = randomBytes(12).toString("base64url");
    const { error } = await sb.from("lineups").update({ share_slug: slug }).eq("id", id).eq("user_id", userId);
    if (!error) return slug;
    if (error.code !== "23505") return null;
  }
  return null;
}

// cache(): generateMetadata + page dalam request yang sama berbagi satu hasil query.
export const loadShared = cache(async (shareSlug: string): Promise<{ lineup: Lineup; ownerName: string | null; ownerServer: number | null; ownerAvatarUrl: string | null; ownerAvatarFrame: string | null } | null> => {
  const sb = adminClient();
  const { data, error } = await sb.from("lineups").select(`${COLS},user_id`).eq("share_slug", shareSlug).maybeSingle();
  if (error || !data) return null;

  const row = data as Row & { user_id: string };
  const { data: profile } = await sb
    .from("profiles")
    .select("ingame_nickname,name,ingame_server,avatar_url,avatar_frame")
    .eq("user_id", row.user_id)
    .maybeSingle();

  const owner = profile as { ingame_nickname: string | null; name: string | null; ingame_server: number | null; avatar_url: string | null; avatar_frame: string | null } | null;
  return {
    lineup: toLineup(row),
    // Koleksi tidak ditampilkan di halaman share: status milik penonton, bukan pemilik lineup.
    ownerName: owner?.ingame_nickname ?? owner?.name ?? null,
    ownerServer: owner?.ingame_server ?? null,
    ownerAvatarUrl: owner?.avatar_url ?? null,
    ownerAvatarFrame: owner?.avatar_frame ?? null,
  };
});

export type PublicLineup = Lineup & {
  ownerId: string;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
  ownerAvatarFrame: string | null;
};

// Jelajah lineup: semua baris ber-share_slug, terbaru dulu. Profil diambil sekali untuk
// seluruh batch (hindari N+1), bukan per lineup.
export async function loadPublicLineups(limit = 12): Promise<PublicLineup[]> {
  const sb = adminClient();
  const { data, error } = await sb
    .from("lineups")
    .select(`${COLS},user_id`)
    .not("share_slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const rows = data as (Row & { user_id: string })[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profileRows } = await sb
    .from("profiles")
    .select("user_id,ingame_nickname,name,avatar_url,avatar_frame")
    .in("user_id", ids);
  const profiles = new Map(
    ((profileRows ?? []) as { user_id: string; ingame_nickname: string | null; name: string | null; avatar_url: string | null; avatar_frame: string | null }[]).map(
      (p) => [p.user_id, p],
    ),
  );

  return rows.map((r) => {
    const p = profiles.get(r.user_id);
    return {
      ...toLineup(r),
      ownerId: r.user_id,
      ownerName: p?.ingame_nickname ?? p?.name ?? null,
      ownerAvatarUrl: p?.avatar_url ?? null,
      ownerAvatarFrame: p?.avatar_frame ?? null,
    };
  });
}

export type PublicProfile = {
  name: string | null;
  ingameNickname: string | null;
  ingameServer: number | null;
  avatarUrl: string | null;
  avatarFrame: string | null;
  lineups: Lineup[];
};

// Profil publik = user_id (uuid). Hanya lineup ber-share_slug yang ikut, jadi isi profil
// tidak bisa dipakai mengintip lineup privat. Tanpa lineup share, identitas ikut disembunyikan.

export const loadPublicProfile = cache(async (userId: string): Promise<PublicProfile | null> => {
  const sb = adminClient();
  const [profile, rows] = await Promise.all([
    sb.from("profiles").select("name,ingame_nickname,ingame_server,avatar_url,avatar_frame").eq("user_id", userId).maybeSingle(),
    sb.from("lineups").select(COLS).eq("user_id", userId).not("share_slug", "is", null).order("updated_at", { ascending: false }),
  ]);
  if (profile.error || !profile.data) return null;
  const lineups = rows.error ? [] : (rows.data as Row[]).map(toLineup);
  if (lineups.length === 0) return { name: null, ingameNickname: null, ingameServer: null, avatarUrl: null, avatarFrame: null, lineups: [] };

  const p = profile.data as {
    name: string | null;
    ingame_nickname: string | null;
    ingame_server: number | null;
    avatar_url: string | null;
    avatar_frame: string | null;
  };
  return {
    name: p.name,
    ingameNickname: p.ingame_nickname,
    ingameServer: p.ingame_server,
    avatarUrl: p.avatar_url,
    avatarFrame: p.avatar_frame,
    lineups,
  };
});
