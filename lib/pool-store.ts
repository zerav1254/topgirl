// Store pool (origin terpilih) di localStorage; terpisah dari topgirl.team.v1.
const STORAGE_KEY = "topgirl.pool.v1";

const poolListeners = new Set<() => void>();

const notify = () => poolListeners.forEach((listener) => listener());

let storageBound = false;
const onStorage = (e: StorageEvent) => {
  if (e.key === STORAGE_KEY) notify();
};

export const readPool = () => localStorage.getItem(STORAGE_KEY);
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
export function writePool(next: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* diabaikan */
  }
  notify();
}

export function parsePool(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
