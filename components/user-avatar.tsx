import Image from "next/image";
import { avatarFrameSrc, isAvatarFrame } from "@/lib/avatar-frames";

// Avatar profil: frame opsional dari manifest mengelilingi foto bulat. `px` = diameter foto.
export function UserAvatar({ src, name, frame, px = 80 }: { src: string | null; name: string; frame: string | null; px?: number }) {
  const photo = src ? (
    <Image src={src} alt="" width={160} height={160} sizes={`${px}px`} className="h-full w-full object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-full w-full place-items-center font-display font-bold text-white/60"
      style={{ fontSize: Math.max(9, Math.round(px * 0.3)) }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );

  if (frame && isAvatarFrame(frame)) {
    const box = Math.round(px * 1.4);
    return (
      <span className="relative grid shrink-0 place-items-center" style={{ width: box, height: box }}>
        <span className="block overflow-hidden rounded-full bg-panel-2" style={{ width: Math.round(px * 0.8), height: Math.round(px * 0.8) }}>
          {photo}
        </span>
        {/* Bingkai 350px dinormalisasi: lubang tengah ~62% dan pusatnya bergeser ~3%. */}
        <Image
          src={avatarFrameSrc(frame)}
          alt=""
          width={192}
          height={192}
          sizes={`${box}px`}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ transform: `translate(${(px * 0.0375).toFixed(2)}px, ${(px * 0.043).toFixed(2)}px)` }}
        />
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-2xl bg-gradient-to-br from-gold/80 to-brand/70 p-0.5">
      <span className="block overflow-hidden rounded-full bg-panel-2" style={{ width: px, height: px }}>
        {photo}
      </span>
    </span>
  );
}
