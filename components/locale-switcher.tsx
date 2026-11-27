"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ICONS, Icon } from "@/components/artist-ui";
import { DICT, LANG_CODE, LANG_NAME, LOCALES, type Locale } from "@/lib/i18n";

const FLAG: Record<Locale, string> = { id: "id", en: "en", fr: "fr", ko: "ko", zh: "zh", ja: "ja", de: "de" };

function Flag({ locale, className = "h-3.5 w-5" }: { locale: Locale; className?: string }) {
  return (
    <Image
      src={`/assets/flags/${FLAG[locale]}.svg`}
      alt=""
      width={20}
      height={14}
      sizes="20px"
      className={`shrink-0 rounded-[2px] border border-white/15 object-cover ${className}`}
    />
  );
}

// Path locale adalah segmen pertama; ganti segmen itu saja, sisa path + query tetap.
export function LocaleSwitcher({ locale, className = "" }: { locale: Locale; className?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar atau Escape; fokus pindah ke bahasa aktif saat menu dibuka.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      box.current?.querySelector<HTMLElement>("button")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function change(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    router.push(`/${next}${rest ? `/${rest}` : ""}${window.location.search}`);
  }

  function onListKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div
      ref={box}
      className={`relative ${className}`}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          setOpen(true);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={DICT[locale].lang.label}
        className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-panel/80 px-2.5 transition-colors duration-200 hover:border-white/25 focus:border-brand/60"
      >
        <Flag locale={locale} />
        <span className="text-xs font-semibold text-zinc-300">{LANG_CODE[locale]}</span>
        <Icon d={ICONS.chevronDown} className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {open && (
        <div
          ref={list}
          role="listbox"
          aria-label={DICT[locale].lang.label}
          onKeyDown={onListKey}
          className="absolute top-full right-0 z-50 mt-1 w-44 rounded-lg border border-line bg-panel"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={l === locale}
              aria-label={LANG_NAME[l]}
              onClick={() => change(l)}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-2 px-2.5 text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                l === locale ? "bg-gold/10 font-semibold text-gold" : "text-zinc-300 hover:bg-surface hover:text-zinc-100"
              }`}
            >
              <Flag locale={l} />
              <span className="text-xs font-semibold">{LANG_CODE[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
