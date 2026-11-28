import "server-only";
import { adminClient } from "./supabase-admin.ts";

export async function allow(key: string, limit: number, windowMs: number): Promise<boolean> {
  const { data, error } = await adminClient().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  });
  return !error && data === true;
}
