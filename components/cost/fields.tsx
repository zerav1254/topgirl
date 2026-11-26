import type { DICT } from "@/lib/i18n";

export type CostDict = (typeof DICT)["id"]["cost"];
export type Total = { name: string; amount: number };

export const field = "h-11 w-full rounded-lg border border-white/10 bg-panel/80 px-2.5 text-base font-semibold tabular text-zinc-100";
export const label = "text-[11px] font-semibold uppercase tracking-wide text-zinc-400";

export const clamp = (value: string, min: number, max: number) => Math.max(min, Math.min(max, Number(value) || min));

export function NumberField({
  id,
  text,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  text: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`min-h-9 cursor-pointer rounded-lg border px-2.5 text-xs font-semibold transition-colors duration-200 ${
            value === option.id
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-white/10 bg-panel/80 text-zinc-300 hover:border-white/25 hover:text-zinc-100"
          }`}
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
      {totals.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {totals.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 break-words text-zinc-300">{item.name}</span>
              <span className="tabular shrink-0 font-bold text-gold">{format(item.amount)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400">{empty}</p>
      )}
      {note ? <p className="mt-3 text-xs text-zinc-400">{note}</p> : null}
    </>
  );
}
