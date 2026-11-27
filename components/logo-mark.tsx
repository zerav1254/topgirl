// Logo mark "Z" — geometri sama dengan app/icon.svg (sumber logo, lihat DESIGN.md).
// Warna lewat token @theme, bukan hex baru.
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="14"
        fill="var(--color-panel-2)"
        stroke="var(--color-gold)"
        strokeOpacity=".3"
        strokeWidth="2"
      />
      <path d="M18 17h28L18 47h28" fill="none" stroke="var(--color-gold)" strokeWidth="8" />
    </svg>
  );
}
