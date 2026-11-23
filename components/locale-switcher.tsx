"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DICT, LOCALES, t, type Locale } from "@/lib/i18n";

// Path locale adalah segmen pertama; ganti segmen itu saja, sisa path tetap.
export function LocaleSwitcher({ locale, className = "" }: { locale: Locale; className?: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");
  const label = t(DICT[locale].lang.switch, { name: locale === "id" ? "English" : "Indonesia" });
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}`}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          aria-label={l === locale ? undefined : label}
          className={`inline-flex min-h-9 items-center rounded-md px-2 text-xs font-semibold uppercase transition-colors duration-200 ${
            l === locale ? "text-gold" : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          {l}
        </Link>
      ))}
    </span>
  );
}
