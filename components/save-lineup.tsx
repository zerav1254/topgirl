"use client";

import { useState, useTransition } from "react";
import { createLineup } from "@/app/[locale]/lineup/actions";
import { DICT, type Locale } from "@/lib/i18n";
import { TEAM_SIZE } from "@/lib/team";
import { Turnstile, resetTurnstile } from "./turnstile";
import { ICONS, Icon } from "./artist-ui";

// Simpan tim yang sedang disusun; daftar dan pengelolaannya ada di halaman Lineup.
export function SaveLineup({ slugs, locale, signedIn }: { slugs: string[]; locale: Locale; signedIn: boolean }) {
  const C = DICT[locale].lineup;
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  if (!signedIn) {
    return <p className="text-sm text-zinc-400">{C.loginHint}</p>;
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-line bg-panel/80 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        fd.set("slugs", slugs.join(","));
        start(async () => {
          const res = await createLineup(locale, fd);
          const ok = res.ok;
          if (ok) form.reset();
          resetTurnstile();
          setMessage(ok ? C.saved : res.error);
        });
      }}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
          <Icon d={ICONS.layers} className="h-4 w-4 shrink-0" />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{C.saveTitle}</h2>
        <span className="tabular shrink-0 rounded-md border border-white/15 bg-surface px-2 py-0.5 text-xs font-semibold text-zinc-100">
          {slugs.length}/{TEAM_SIZE}
        </span>
      </div>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        {C.name}
        <input
          name="name"
          required
          maxLength={60}
          defaultValue=""
          className="min-h-11 rounded-lg border border-line bg-panel px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
        />
      </label>
      <p className="text-xs text-zinc-400">{slugs.length === 0 ? C.needTeam : C.subtitle}</p>
      <Turnstile action="lineup-create" />
      <button
        type="submit"
        disabled={pending || slugs.length === 0}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gold/45 bg-gold/15 px-3 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon d={ICONS.save} className="h-4 w-4 shrink-0" />
        {C.save}
      </button>
      {message ? (
        <p role="status" className="text-sm text-zinc-300">
          {message}
        </p>
      ) : null}
    </form>
  );
}
