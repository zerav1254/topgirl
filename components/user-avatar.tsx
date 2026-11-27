import Image from "next/image";

// Avatar profil: foto bulat atau inisial. `px` = diameter foto.
export function UserAvatar({ src, name, px = 80 }: { src: string | null; name: string; px?: number }) {
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

  return (
    <span className="shrink-0 rounded-2xl bg-gradient-to-br from-gold/80 to-brand/70 p-0.5">
      <span className="block overflow-hidden rounded-full bg-panel-2" style={{ width: px, height: px }}>
        {photo}
      </span>
    </span>
  );
}
