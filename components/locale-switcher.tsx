"use client";

import { usePathname, useRouter } from "next/navigation";
import { DICT, LANG_NAME, LOCALES, type Locale } from "@/lib/i18n";

// Path locale adalah segmen pertama; ganti segmen itu saja, sisa path + query tetap.
export function LocaleSwitcher({ locale, className = "" }: { locale: Locale; className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");

  function change(next: string) {
    router.push(`/${next}${rest ? `/${rest}` : ""}${window.location.search}`);
  }

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        aria-label={DICT[locale].lang.label}
        className="h-11 cursor-pointer appearance-none rounded-lg border border-white/10 bg-panel/80 pr-7 pl-2.5 text-xs font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 focus:border-brand/60"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} className="bg-panel text-zinc-100">
            {LANG_NAME[l]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-zinc-500"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
