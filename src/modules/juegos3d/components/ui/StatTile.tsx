import React from 'react';
import { cn } from '../../lib/cn';

type Tone = 'violet' | 'cyan' | 'pink' | 'lime';

const TONE: Record<Tone, string> = {
  violet: 'from-violet-500/30 to-violet-500/0 text-violet-200',
  cyan: 'from-cyan-400/30 to-cyan-400/0 text-cyan-200',
  pink: 'from-pink-500/30 to-pink-500/0 text-pink-200',
  lime: 'from-lime-400/30 to-lime-400/0 text-lime-200',
};

/** Celda de dato del bento: icono en burbuja de color, etiqueta y valor. */
export function StatTile({ icon: Icon, label, value, tone = 'violet', className }: {
  icon: React.ElementType; label: string; value: React.ReactNode; tone?: Tone; className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.03] p-3', className)}>
      <div className={cn('mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br', TONE[tone])}>
        <Icon size={16} aria-hidden />
      </div>
      <div className="text-[11px] font-medium text-white/50">{label}</div>
      <div className="text-sm font-semibold leading-snug text-white">{value}</div>
    </div>
  );
}
