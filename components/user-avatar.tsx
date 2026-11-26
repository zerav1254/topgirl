import Image from "next/image";
import { avatarFrameSrc, isAvatarFrame } from "@/lib/avatar-frames";

// Avatar profil: frame opsional dari manifest mengelilingi foto bulat 64px.
export function UserAvatar({ src, name, frame }: { src: string | null; name: string; frame: string | null }) {
  const photo = src ? (
    <Image src={src} alt="" width={160} height={160} sizes="80px" className="h-full w-full object-cover" />
  ) : (
    <span aria-hidden="true" className="grid h-full w-full place-items-center font-display text-2xl font-bold text-white/60">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );

  if (frame && isAvatarFrame(frame)) {
    return (
      <span className="relative grid h-28 w-28 shrink-0 place-items-center">
        <span className="block h-16 w-16 overflow-hidden rounded-full bg-panel-2">{photo}</span>
        <Image
          src={avatarFrameSrc(frame)}
          alt=""
          width={192}
          height={192}
          sizes="112px"
          className="pointer-events-none absolute inset-0 h-full w-full translate-x-[3px] translate-y-[3px] object-contain"
        />
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-2xl bg-gradient-to-br from-gold/80 to-brand/70 p-0.5">
      <span className="block h-20 w-20 overflow-hidden rounded-full bg-panel-2">{photo}</span>
    </span>
  );
}
