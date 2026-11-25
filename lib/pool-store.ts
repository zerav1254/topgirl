import { EMPTY_POOL, type Pool } from "./pool.ts";

// Store pool (season server) di localStorage; terpisah dari topgirl.team.v1.
const STORAGE_KEY = "topgirl.pool.v3";
// Format lama menyimpan origin: dibaca supaya season tidak hilang saat upgrade.
const LEGACY_KEYS = ["topgirl.pool.v2", "topgirl.pool.v1"];

const poolListeners = new Set<() => void>();

const notify = () => poolListeners.forEach((listener) => listener());

let storageBound = false;
const onStorage = (e: StorageEvent) => {
  if (e.key === STORAGE_KEY) notify();
};

export const readPool = () => {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current !== null) return current;
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy !== null) return legacy;
  }
  return null;
};
export const getServerPool = () => null;

export function subscribePool(listener: () => void) {
  poolListeners.add(listener);
  if (!storageBound && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    storageBound = true;
  }
  return () => {
    poolListeners.delete(listener);
  };
}

// Penulisan bisa gagal (mode privat / kuota); pool kembali "semua", bukan crash.
export function writePool(next: Pool) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* diabaikan */
  }
  notify();
}

export function parsePool(raw: string | null): Pool {
  try {
    const parsed: unknown = JSON.parse(raw ?? "null");
    // Bentuk lama: array origin (v1) atau { origins, season } (v2). Origin diabaikan.
    if (Array.isArray(parsed)) return EMPTY_POOL;
    if (typeof parsed === "number" && Number.isInteger(parsed)) return { season: parsed };
    if (parsed && typeof parsed === "object") {
      const { season } = parsed as { season?: unknown };
      return { season: typeof season === "number" && Number.isInteger(season) ? season : null };
    }
    return EMPTY_POOL;
  } catch {
    return EMPTY_POOL;
  }
}
