"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/auth";
import { DICT, type Locale } from "@/lib/i18n";
import { saveProfile } from "@/app/[locale]/profile/actions";

const FIELD = "rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60";

export function ProfileForm({ profile, locale }: { profile: Profile; locale: Locale }) {
  const C = DICT[locale].profile;
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await saveProfile(locale, fd);
          setMessage(res.ok ? C.saved : res.error);
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        {C.name}
        <input name="name" defaultValue={profile.name ?? ""} maxLength={60} className={FIELD} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          {C.ingameId}
          <input name="ingameId" defaultValue={profile.ingameId ?? ""} inputMode="numeric" pattern="[0-9]*" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          {C.ingameServer}
          <input name="ingameServer" defaultValue={profile.ingameServer ?? ""} inputMode="numeric" pattern="[0-9]*" className={FIELD} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        {C.ingameNickname}
        <input name="ingameNickname" defaultValue={profile.ingameNickname ?? ""} maxLength={40} className={FIELD} />
      </label>
      <p className="text-xs text-zinc-400">{C.hint}</p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25 disabled:opacity-60"
      >
        {pending ? C.saving : C.save}
      </button>
      {message ? (
        <p role="status" className="text-sm text-zinc-300">
          {message}
        </p>
      ) : null}
    </form>
  );
}
