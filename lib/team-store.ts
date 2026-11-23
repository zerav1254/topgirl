// Store bersama untuk tim di localStorage dan query tab; dipakai BottomNav + TeamBuilder.
const STORAGE_KEY = "topgirl.team.v1";

const teamListeners = new Set<() => void>();

const notify = () => teamListeners.forEach((listener) => listener());

// Tab lain menulis localStorage -> sinkronkan lewat event storage (tidak terpicu di tab asal).
let storageBound = false;
const onStorage = (e: StorageEvent) => {
  if (e.key === STORAGE_KEY) notify();
};

export const readTeam = () => localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();
}

export const URL_EVENT = "topgirl:url";

export const subscribeUrl = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  window.addEventListener(URL_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(URL_EVENT, listener);
  };
};

export const readUrl = () => window.location.search;
export const getServerUrl = () => "";
