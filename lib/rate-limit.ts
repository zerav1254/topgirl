// ponytail: limiter per instance (Map), bukan lintas lambda. Cukup menahan spam satu
// pengguna di satu instance; naikkan ke Vercel Firewall/Upstash bila butuh batas global.
const hits = new Map<string, { n: number; reset: number }>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || cur.reset <= now) {
    hits.set(key, { n: 1, reset: now + windowMs });
  } else if (cur.n >= limit) {
    return false;
  } else {
    cur.n++;
  }
  if (hits.size > 2000) {
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }
  return true;
}
