import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../supabase.ts";

// Client per request: session dari cookie, RLS berlaku (anon/authenticated).
export async function createSupabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component tidak boleh menulis cookie. Refresh sesi ditangani proxy.ts.
        }
      },
    },
  });
}
