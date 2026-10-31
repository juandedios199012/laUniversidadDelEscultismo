import React, { useEffect, useState } from 'react';

/**
 * Narración sobre la escena: muestra el paso de las reglas de ESTE juego que corresponde
 * al momento de la reproducción (los pasos se reparten a lo largo de la secuencia).
 */
export function RuleNarration({ steps, clock, duration }: { steps: string[]; clock: React.RefObject<number>; duration: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const t = clock.current ?? 0;
      setIndex(Math.min(steps.length - 1, Math.floor((t / duration) * steps.length)));
    }, 120);
    return () => clearInterval(id);
  }, [clock, duration, steps.length]);

  if (steps.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-3 right-24 top-3 sm:right-36">
      <div className="inline-flex max-w-xl items-start gap-2 rounded-2xl border border-white/15 bg-black/50 px-3 py-2 text-white backdrop-blur-md">
        <span className="mt-0.5 shrink-0 rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums">
          {index + 1}/{steps.length}
        </span>
        <span key={index} className="line-clamp-2 text-[11px] leading-snug text-white/90 sm:text-xs">
          {steps[index]}
        </span>
      </div>
    </div>
  );
}
