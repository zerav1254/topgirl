"use client";

import { useState } from "react";
import type { DICT } from "@/lib/i18n";

export type CostDict = (typeof DICT)["id"]["cost"];
export type Total = { itemId?: number; name: string; amount: number };

export const field = "h-11 w-full rounded-lg border border-line bg-panel/80 px-2.5 text-base font-semibold tabular text-zinc-100";
export const label = "text-2xs font-semibold uppercase tracking-wide text-zinc-400";

// Kelas kartu tab dan kotak hasil; dipakai semua panel biar tidak drift.
export const panel = "rounded-2xl border border-line bg-panel/70 p-4 sm:p-5";
export const result = "mt-4 rounded-xl border border-line bg-panel-2/60 px-3 py-3";
export const invalid = "mt-3 text-sm text-red-300";

export const chip = (active: boolean, size: "md" | "sm" = "md") =>
  `min-h-11 cursor-pointer rounded-lg border ${size === "sm" ? "px-2.5 text-xs" : "px-3 text-sm"} font-semibold transition-colors duration-200 ${
    active
      ? "border-gold/50 bg-gold/10 text-gold"
      : "border-line bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
  }`;

export const clamp = (value: string, min: number, max: number) => {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

export function NumberField({
  id,
  text,
  value,
  min,
  max,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  text: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  // Draft string saat fokus: angka di luar rentang boleh diketik dulu, clamp saat blur.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={label}>
        {text}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft ?? String(value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onFocus={() => setDraft(String(value))}
        onBlur={() => {
          const next = clamp(draft ?? String(value), min, max);
          setDraft(null);
          onChange(String(next));
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value.trim() !== "" && Number.isFinite(n)) onChange(String(clamp(e.target.value, min, max)));
        }}
        className={field}
      />
    </div>
  );
}

export function Select({
  id,
  text,
  value,
  onChange,
  children,
}: {
  id: string;
  text: string;
  value: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={label}>
        {text}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} className={field}>
        {children}
      </select>
    </div>
  );
}

// Pilihan mode di dalam satu tab (mis. Gedung/Ruangan).
export function Segmented<T extends string>({
  text,
  value,
  onChange,
  options,
}: {
  text: string;
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div role="group" aria-label={text} className="mb-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={chip(value === option.id, "sm")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Totals({
  totals,
  note,
  empty,
  format,
}: {
  totals: Total[];
  note?: string;
  empty: string;
  format: (value: number) => string;
}) {
  return (
    <>
      <div aria-live="polite">
        {totals.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {totals.map((item) => (
              <li key={item.itemId ?? item.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 break-words text-zinc-300">{item.name}</span>
                <span className="tabular shrink-0 font-bold text-gold">{format(item.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">{empty}</p>
        )}
      </div>
      {note ? <p className="mt-3 text-xs text-zinc-400">{note}</p> : null}
    </>
  );
}
