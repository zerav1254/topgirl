// Store bersama untuk tim di localStorage; dipakai BottomNav + TeamBuilder.
const STORAGE_KEY = "topgirl.team.v1";

const teamListeners = new Set<() => void>();

const notify = () => teamListeners.forEach((listener) => listener());

// Tab lain menulis localStorage -> sinkronkan lewat event storage (tidak terpicu di tab asal).
let storageBound = false;
const onStorage = (e: StorageEvent) => {
  if (e.key === STORAGE_KEY) notify();
};

export const readTeam = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
export const getServerTeam = () => null;

export function subscribeTeam(listener: () => void) {
  teamListeners.add(listener);
  if (!storageBound && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    storageBound = true;
  }
  return () => {
    teamListeners.delete(listener);
  };
}

export function writeTeam(next: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Mode privat / kuota penuh: tim tetap hidup di memori, hanya tidak persist.
  }
  notify();
}
