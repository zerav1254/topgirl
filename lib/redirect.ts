// Hanya path internal: tolak "//host", backslash (dinormalkan URL jadi "//host"), dan kontrol.
const INTERNAL = /^\/(?!\/)[^\\\r\n]*$/;

export const safeNextPath = (next: string, fallback: string) => (INTERNAL.test(next) ? next : fallback);
