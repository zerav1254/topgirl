import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { adminClient } from "./supabase.ts";
import { createSupabaseServer } from "./supabase/server.ts";

export type Role = "admin" | "user";

export type Profile = {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  ingameId: number | null;
  ingameServer: number | null;
  ingameNickname: string | null;
  role: Role;
};

type Row = {
  user_id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  ingame_id: number | null;
  ingame_server: number | null;
  ingame_nickname: string | null;
  role: Role;
};

const COLUMNS = "user_id,email,name,avatar_url,ingame_id,ingame_server,ingame_nickname,role";

const toProfile = (r: Row): Profile => ({
  userId: r.user_id,
  email: r.email,
  name: r.name,
  avatarUrl: r.avatar_url,
  ingameId: r.ingame_id,
  ingameServer: r.ingame_server,
  ingameNickname: r.ingame_nickname,
  role: r.role,
});

// cache(): layout + page + action dalam satu request berbagi hasil, bukan bolak-balik ke Supabase.
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

// profiles punya RLS tanpa policy: baca lewat service_role, bukan session client.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await adminClient().from("profiles").select(COLUMNS).eq("user_id", user.id).maybeSingle();
  if (error || !data) return null;
  return toProfile(data as Row);
});

export type Identity = { id: string; provider: string };

// Identitas provider yang terhubung ke akun (untuk daftar bind di halaman profil).
export const getIdentities = cache(async (): Promise<Identity[]> => {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error || !data) return [];
  return data.identities.map((i) => ({ id: i.id, provider: i.provider }));
});

export class UnauthenticatedError extends Error {
  constructor() {
    super("unauthenticated");
    this.name = "UnauthenticatedError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}
