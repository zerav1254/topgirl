import { adminClient } from "./supabase-admin.ts";

// Koleksi = daftar slug yang dimiliki user. Baris ada = punya.
export async function loadOwned(userId: string): Promise<string[]> {
  const { data, error } = await adminClient().from("user_artists").select("artist_slug").eq("user_id", userId);
  if (error) return [];
  return (data as { artist_slug: string }[]).map((r) => r.artist_slug);
}

// Idempoten: punya -> insert on conflict do nothing; belum -> delete.
export async function setOwned(userId: string, slug: string, owned: boolean): Promise<boolean> {
  const sb = adminClient();
  const { error } = owned
    ? await sb.from("user_artists").upsert({ user_id: userId, artist_slug: slug }, { onConflict: "user_id,artist_slug", ignoreDuplicates: true })
    : await sb.from("user_artists").delete().eq("user_id", userId).eq("artist_slug", slug);
  return !error;
}
