import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase.ts";

export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diset.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}
