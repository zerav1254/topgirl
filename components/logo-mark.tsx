import Image from "next/image";

// Logo mark "Z" — PNG dari public/logo.png (sumber logo, lihat DESIGN.md).
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`shrink-0 overflow-hidden rounded-xl ${className}`} style={{ width: size, height: size }}>
      <Image src="/logo.png" alt="" width={64} height={64} sizes={`${size}px`} className="h-full w-full object-cover" priority />
    </span>
  );
}
