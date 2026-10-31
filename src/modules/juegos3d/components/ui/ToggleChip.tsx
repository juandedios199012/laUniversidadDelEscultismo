import React from 'react';
import { cn } from '../../lib/cn';

type Accent = 'cyan' | 'amber' | 'lime' | 'pink';

const ACCENT: Record<Accent, string> = {
  cyan: 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_-4px_rgba(34,211,238,0.7)]',
  amber: 'border-amber-300/60 bg-amber-400/15 text-amber-100 shadow-[0_0_18px_-4px_rgba(251,191,36,0.7)]',
  lime: 'border-lime-300/60 bg-lime-400/15 text-lime-100 shadow-[0_0_18px_-4px_rgba(163,230,53,0.7)]',
  pink: 'border-pink-300/60 bg-pink-400/15 text-pink-100 shadow-[0_0_18px_-4px_rgba(236,72,153,0.7)]',
};

interface ToggleChipProps {
  pressed: boolean;
  onToggle: () => void;
  icon: React.ElementType;
  label: string;
  accent?: Accent;
  title?: string;
}

/** Interruptor en forma de píldora para capas visuales (nombres, visión, vectores). */
export function ToggleChip({ pressed, onToggle, icon: Icon, label, accent = 'cyan', title }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title ?? label}
      onClick={onToggle}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all',
        'focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-[0.97]',
        pressed ? ACCENT[accent] : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white'
      )}
    >
      <Icon size={14} aria-hidden />
      {label}
    </button>
  );
}
