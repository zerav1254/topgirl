import type { Metadata } from "next";
import { loadArtists } from "@/lib/artists";
import { isAdmin } from "@/lib/auth";
import { ArtistEditor } from "@/components/artist-editor";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Isi Stat — TopGirl",
  description: "Masuk untuk mengisi base stat, skill, dan foto artist.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  login: "Password salah.",
  foto: "Pilih file foto dulu.",
  ukur: "Foto lebih dari 10 MB.",
  format: "File bukan gambar yang didukung.",
  upload: "Upload gagal. Coba lagi.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; a?: string }> }) {
  const params = await searchParams;

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold">TopGirl</p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">Masuk admin</h1>
        <p className="mt-2 text-sm text-zinc-400">Halaman ini hanya untuk pemilik data.</p>
        <form action={login} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-base text-zinc-100 focus:border-brand/60"
            />
          </label>
          {params.error && ERRORS[params.error] ? (
            <p role="alert" className="text-sm text-red-300">
              {ERRORS[params.error]}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-gold/45 bg-gold/15 px-4 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/25"
          >
            Masuk
          </button>
        </form>
      </main>
    );
  }

  const artists = await loadArtists();

  return (
    <>
      {params.error && ERRORS[params.error] ? (
        <p role="alert" className="mx-auto max-w-6xl px-4 pt-4 text-sm text-red-300 sm:px-6 lg:px-8">
          {ERRORS[params.error]}
        </p>
      ) : null}
      <ArtistEditor artists={artists} defaultSlug={params.a} />
    </>
  );
}
