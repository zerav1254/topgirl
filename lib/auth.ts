import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "topgirl_admin";
const MAX_AGE = 60 * 60 * 24 * 30;

const secret = () => process.env.AUTH_SECRET ?? "";

function token(): string {
  return createHmac("sha256", secret()).update("admin:v1").digest("base64url");
}

export function sameSecret(given: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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
