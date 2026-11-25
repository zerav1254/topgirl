import { randomBytes } from "node:crypto";
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
  const { error } = await adminClient().from("lineups").insert({ user_id: userId, name, slugs: [...new Set(slugs)] });
  return !error;
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

export async function loadShared(shareSlug: string): Promise<{ lineup: Lineup; ownerName: string | null; ownerServer: number | null } | null> {  const sb = adminClient();
  const { data, error } = await sb.from("lineups").select(`${COLS},user_id`).eq("share_slug", shareSlug).maybeSingle();
  if (error || !data) return null;

  const row = data as Row & { user_id: string };
  const { data: profile } = await sb
    .from("profiles")
    .select("ingame_nickname,name,ingame_server")
    .eq("user_id", row.user_id)
    .maybeSingle();

  const owner = profile as { ingame_nickname: string | null; name: string | null; ingame_server: number | null } | null;
  return {
    lineup: toLineup(row),
    // Koleksi tidak ditampilkan di halaman share: status milik penonton, bukan pemilik lineup.
    ownerName: owner?.ingame_nickname ?? owner?.name ?? null,
    ownerServer: owner?.ingame_server ?? null,
  };
}

export type PublicProfile = {
  name: string | null;
  ingameNickname: string | null;
  ingameServer: number | null;
  avatarUrl: string | null;
  lineups: Lineup[];
};

// Profil publik = user_id (uuid). Hanya lineup ber-share_slug yang ikut, jadi isi profil
// tidak bisa dipakai mengintip lineup privat.

export async function loadPublicProfile(userId: string): Promise<PublicProfile | null> {
  const sb = adminClient();
  const [profile, rows] = await Promise.all([
    sb.from("profiles").select("name,ingame_nickname,ingame_server,avatar_url").eq("user_id", userId).maybeSingle(),
    sb.from("lineups").select(COLS).eq("user_id", userId).not("share_slug", "is", null).order("updated_at", { ascending: false }),
  ]);
  if (profile.error || !profile.data) return null;
  const p = profile.data as {
    name: string | null;
    ingame_nickname: string | null;
    ingame_server: number | null;
    avatar_url: string | null;
  };
  return {
    name: p.name,
    ingameNickname: p.ingame_nickname,
    ingameServer: p.ingame_server,
    avatarUrl: p.avatar_url,
    lineups: rows.error ? [] : (rows.data as Row[]).map(toLineup),
  };
}
