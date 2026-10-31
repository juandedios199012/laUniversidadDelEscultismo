import React from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'glass' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ElementType;
  /** Solo icono (botón cuadrado). Requiere `aria-label`. */
  iconOnly?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 shadow-[0_8px_30px_-8px_rgba(139,92,246,0.8)] hover:brightness-110 hover:shadow-[0_8px_36px_-6px_rgba(34,211,238,0.7)]',
  glass: 'text-white/90 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.08]',
};

// Alturas mínimas de 40–48 px: objetivos táctiles cómodos en móvil
const SIZES: Record<Size, { base: string; square: string; icon: number }> = {
  sm: { base: 'h-9 px-3 text-xs gap-1.5', square: 'h-9 w-9', icon: 15 },
  md: { base: 'h-11 px-4 text-sm gap-2', square: 'h-11 w-11', icon: 18 },
  lg: { base: 'h-12 px-6 text-base gap-2', square: 'h-12 w-12', icon: 20 },
};

/** Botón único de la app (DRY): degradado neón, vidrio o fantasma. */
export function GradientButton({ variant = 'glass', size = 'md', icon: Icon, iconOnly, className, children, ...rest }: GradientButtonProps) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-2xl font-semibold transition-all duration-200',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300',
        iconOnly ? s.square : s.base,
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={s.icon} aria-hidden />}
      {!iconOnly && children}
    </button>
  );
}
