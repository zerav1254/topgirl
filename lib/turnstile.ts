// Verifikasi Cloudflare Turnstile lewat siteverify (kanonik): wajib
// success === true, action cocok, dan hostname di allowlist
// TURNSTILE_HOSTNAMES (produksi: zerav.web.id, tanpa localhost).
const HOSTNAMES = new Set(
  (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean),
);

type SiteverifyResult = { success?: boolean; action?: string; hostname?: string };

export async function verifyTurnstile(token: unknown, action: string, ip: string | null): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || HOSTNAMES.size === 0) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET ?? "",
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
    });
    if (!res.ok) return false;
    const result = (await res.json()) as SiteverifyResult;
    return result.success === true && result.action === action && HOSTNAMES.has(result.hostname ?? "");
  } catch {
    return false;
  }
}

// IP klien untuk remoteip (header Vercel/proxy standar).
export async function clientIp(): Promise<string | null> {
  const { headers } = await import("next/headers");
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}
