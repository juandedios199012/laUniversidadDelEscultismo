/** Isotipo de Juegos3D: cubo isométrico sobre degradado neón (mismo diseño que los iconos de la app). */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0 drop-shadow-[0_6px_20px_rgba(139,92,246,0.55)]">
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ec4899" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lm-bg)" />
      <g fill="none" stroke="#fff" strokeWidth="3.2" strokeLinejoin="round">
        <path d="M32 14 L48 23 L48 41 L32 50 L16 41 L16 23 Z" />
        <path d="M16 23 L32 32 L48 23 M32 32 L32 50" />
      </g>
      <path d="M32 14 L48 23 L32 32 L16 23 Z" fill="#fff" fillOpacity="0.28" />
    </svg>
  );
}
