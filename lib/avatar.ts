import "server-only";
import { adminClient } from "./supabase-admin.ts";
import { AVATAR_BUCKET } from "./supabase.ts";

const SIGNED_URL_TTL = 3600;

export async function avatarUrl(path: string | null, fallback: string | null): Promise<string | null> {
  if (!path) return fallback;
  const { data, error } = await adminClient().storage.from(AVATAR_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return error ? fallback : data.signedUrl;
}

export async function avatarUrls<T extends { user_id: string; avatar_path: string | null; avatar_url: string | null }>(rows: T[]): Promise<Map<string, string | null>> {
  const paths = rows.map((row) => row.avatar_path).filter((path): path is string => Boolean(path));
  const signed = paths.length ? await adminClient().storage.from(AVATAR_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL) : { data: [], error: null };
  const urls = new Map((signed.data ?? []).map((item) => [item.path, item.signedUrl]));
  return new Map(rows.map((row) => [row.user_id, (row.avatar_path && urls.get(row.avatar_path)) || row.avatar_url]));
}
