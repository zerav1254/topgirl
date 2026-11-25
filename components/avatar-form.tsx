"use client";

import { useState, useTransition } from "react";
import { uploadAvatar } from "@/app/[locale]/profile/actions";
import { DICT, type Locale } from "@/lib/i18n";
import { compressPhoto } from "@/lib/image-client";

export function AvatarForm({ locale }: { locale: Locale }) {
  const C = DICT[locale].profile;
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem("avatar");
        const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
        if (!file) {
          setMessage(C.avatarError);
          return;
        }
        start(async () => {
          try {
            const fd = new FormData();
            fd.set("avatar", await compressPhoto(file));
            const res = await uploadAvatar(locale, fd);
            setMessage(res.ok ? C.saved : res.error);
            if (res.ok) form.reset();
          } catch {
            setMessage(C.avatarError);
          }
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        {C.avatar}
        <input
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="min-h-11 cursor-pointer rounded-lg border border-white/10 bg-panel/80 px-3 py-2 text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-sm file:font-semibold file:text-zinc-100"
        />
      </label>
      <p className="text-xs text-zinc-400">{C.avatarHint}</p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:border-white/25 hover:text-zinc-100 disabled:opacity-60"
      >
        {pending ? C.saving : C.avatarUpload}
      </button>
      {message ? (
        <p role="status" className="text-sm text-zinc-300">
          {message}
        </p>
      ) : null}
    </form>
  );
}
