import React from 'react';
import { cn } from '../../lib/cn';

export type Glow = 'none' | 'violet' | 'cyan' | 'pink' | 'emerald' | 'amber';

const GLOW: Record<Exclude<Glow, 'none'>, string> = {
  violet: 'from-violet-500/40 to-fuchsia-500/10',
  cyan: 'from-cyan-400/35 to-sky-500/10',
  pink: 'from-pink-500/40 to-orange-400/10',
  emerald: 'from-emerald-400/35 to-lime-400/10',
  amber: 'from-amber-400/40 to-pink-500/10',
};

interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'aside' | 'header';
  glow?: Glow;
  padded?: boolean;
}

/** Tarjeta de vidrio esmerilado: base de todos los bloques del bento. */
export function GlassCard({ as: Tag = 'section', glow = 'none', padded = true, className, children, ...rest }: GlassCardProps) {
  return (
    <Tag
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl',
        'shadow-[0_10px_40px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)]',
        padded && 'p-4 sm:p-5',
        className
      )}
      {...rest}
    >
      {glow !== 'none' && (
        <div
          aria-hidden
          className={cn('pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br blur-3xl', GLOW[glow])}
        />
      )}
      <div className="relative min-w-0">{children}</div>
    </Tag>
  );
}

/** Título pequeño en mayúsculas con icono, para encabezar tarjetas. */
export function Eyebrow({ icon: Icon, children, className }: { icon?: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55', className)}>
      {Icon && <Icon size={13} className="text-cyan-300" />}
      {children}
    </div>
  );
}
