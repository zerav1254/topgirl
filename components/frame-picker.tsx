"use client";

import { useState } from "react";
import Image from "next/image";
import { AVATAR_FRAMES, avatarFrameSrc } from "@/lib/avatar-frames";

// Pilihan frame avatar; nilai dikirim lewat hidden input `avatarFrame` di form profil.
export function FramePicker({ current, label, noneLabel }: { current: string | null; label: string; noneLabel: string }) {
  const [selected, setSelected] = useState(current);
  const tile = "grid aspect-square place-items-center rounded-lg border p-1 text-[11px] font-semibold transition-colors duration-200";

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm text-zinc-400">{label}</legend>
      <input type="hidden" name="avatarFrame" value={selected ?? ""} />
      <div className="grid max-h-60 grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-white/10 bg-panel/60 p-2">
        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-pressed={selected === null}
          className={`${tile} ${selected === null ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-panel-2/50 text-zinc-400 hover:border-white/25"}`}
        >
          {noneLabel}
        </button>
        {AVATAR_FRAMES.map((frame, i) => (
          <button
            key={frame}
            type="button"
            onClick={() => setSelected(frame)}
            aria-pressed={selected === frame}
            aria-label={`${label} ${i + 1}`}
            className={`${tile} ${selected === frame ? "border-gold bg-gold/15" : "border-white/10 bg-panel-2/50 hover:border-white/25"}`}
          >
            <Image src={avatarFrameSrc(frame)} alt="" width={64} height={64} sizes="64px" loading="lazy" className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
