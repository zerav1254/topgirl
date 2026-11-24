import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "topgirl_admin";
const MAX_AGE = 60 * 60 * 24 * 30;

const secret = () => process.env.AUTH_SECRET ?? "";
const password = () => process.env.ADMIN_PASSWORD ?? "";

// Sertakan fingerprint password: ganti ADMIN_PASSWORD -> cookie lama otomatis tidak valid.
function token(): string {
  const s = secret();
  if (!s) throw new Error("AUTH_SECRET belum diset.");
  return createHmac("sha256", s).update("admin:v1").update(password()).digest("base64url");
}

// Hash dulu supaya panjang input tidak bocor lewat timing/length, lalu banding konstan.
export function sameSecret(given: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(value) && Boolean(secret()) && sameSecret(value as string, token());
}

export async function setAdminCookie(): Promise<void> {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
