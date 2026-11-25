import { EMPTY_POOL, type Pool } from "./pool.ts";

// Store pool (origin + season server) di localStorage; terpisah dari topgirl.team.v1.
const STORAGE_KEY = "topgirl.pool.v2";
// Format lama: array origin saja. Dibaca sekali supaya pilihan origin tidak hilang.
const LEGACY_KEY = "topgirl.pool.v1";

const poolListeners = new Set<() => void>();

const notify = () => poolListeners.forEach((listener) => listener());

let storageBound = false;
const onStorage = (e: StorageEvent) => {
  if (e.key === STORAGE_KEY) notify();
};

export const readPool = () => localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
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
    // Bentuk lama: ["Tokyo", ...] tanpa season.
    if (Array.isArray(parsed)) {
      return { origins: parsed.filter((v): v is string => typeof v === "string"), season: null };
    }
    if (parsed && typeof parsed === "object") {
      const { origins, season } = parsed as { origins?: unknown; season?: unknown };
      return {
        origins: Array.isArray(origins) ? origins.filter((v): v is string => typeof v === "string") : [],
        season: typeof season === "number" && Number.isInteger(season) ? season : null,
      };
    }
    return EMPTY_POOL;
  } catch {
    return EMPTY_POOL;
  }
}
