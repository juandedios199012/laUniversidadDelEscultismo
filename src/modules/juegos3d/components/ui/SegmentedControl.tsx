import React from 'react';
import { cn } from '../../lib/cn';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ElementType;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Oculta el texto en pantallas pequeñas y deja solo el icono. */
  compactOnMobile?: boolean;
  className?: string;
}

/** Selector de una opción entre varias (cámara, velocidad…), con la activa en degradado. */
export function SegmentedControl<T extends string | number>({
  options, value, onChange, ariaLabel, compactOnMobile, className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-1', className)}
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all',
              'focus-visible:outline-2 focus-visible:outline-cyan-300',
              active
                ? 'bg-gradient-to-r from-violet-500/90 to-cyan-500/80 text-white shadow-[0_4px_18px_-6px_rgba(34,211,238,0.8)]'
                : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
            )}
          >
            {Icon && <Icon size={14} aria-hidden />}
            <span className={cn(compactOnMobile && Icon && 'hidden sm:inline')}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
