// Store bersama untuk tim di localStorage dan query tab; dipakai BottomNav + TeamBuilder.
const STORAGE_KEY = "topgirl.team.v1";

const teamListeners = new Set<() => void>();

export const readTeam = () => localStorage.getItem(STORAGE_KEY);
export const getServerTeam = () => null;

export function subscribeTeam(listener: () => void) {
  teamListeners.add(listener);
  return () => {
    teamListeners.delete(listener);
  };
}

export function writeTeam(next: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  teamListeners.forEach((notify) => notify());
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
