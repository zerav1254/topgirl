import { createClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "artist-thumb";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishable = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !publishable) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY (lihat README).");
}

export const SUPABASE_URL = url;

// Read client (RLS: select-only for anon). Safe to use in server components.
export const supabase = createClient(url, publishable, { auth: { persistSession: false } });

// Write client: service_role, bypasses RLS. Server actions only.
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset.");
  return createClient(url, key, { auth: { persistSession: false } });
}
