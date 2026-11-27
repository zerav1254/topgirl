import Image from "next/image";

// Avatar profil: foto bulat + frame universal (aset di public/assets/avatars/frame.webp).
// `px` = diameter foto; frame digambar 1.4x di atasnya (lubang tengah ~62%, pusat +3%).
export function UserAvatar({ src, name, px = 80 }: { src: string | null; name: string; px?: number }) {
  const photo = src ? (
    <Image src={src} alt="" width={160} height={160} sizes={`${Math.round(px * 0.8)}px`} className="h-full w-full object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-full w-full place-items-center font-display font-bold text-white/60"
      style={{ fontSize: Math.max(9, Math.round(px * 0.3)) }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );

  const box = Math.round(px * 1.4);
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: box, height: box }}>
      <span className="block overflow-hidden rounded-full bg-panel-2" style={{ width: Math.round(px * 0.8), height: Math.round(px * 0.8) }}>
        {photo}
      </span>
      <Image
        src="/assets/avatars/frame.webp"
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
