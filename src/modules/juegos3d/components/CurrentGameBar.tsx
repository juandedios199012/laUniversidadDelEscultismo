import { useEffect } from 'react';
import { Library } from 'lucide-react';
import type { CatalogGame } from '../lib/catalog';
import { CATALOG } from '../lib/catalog';
import { sceneTheme, AREA_THEME, CATEGORY_LABEL } from './theme';
import { GlassCard } from './ui/GlassCard';
import { GradientButton } from './ui/GradientButton';
import { cn } from '../lib/cn';

/** Juego activo + acceso al catálogo (también con Ctrl/⌘ + K). */
export function CurrentGameBar({ game, onOpenCatalog }: { game: CatalogGame; onOpenCatalog: () => void }) {
  const arch = sceneTheme(game);
  const area = AREA_THEME[game.area];
  const Icon = arch.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCatalog();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenCatalog]);

  return (
    <GlassCard glow={arch.glow} padded={false} className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', arch.gradient)}>
            <Icon size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/55">
              <span className="font-mono font-semibold">{game.id}</span>
              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold', area.chip)}>{game.area}</span>
              <span>{CATEGORY_LABEL[game.category]}</span>
              <span className="text-white/30">·</span>
              <span>Escena: {arch.label}</span>
            </div>
            <h2 className="mt-1 line-clamp-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-white sm:text-xl">
              {game.name}
            </h2>
          </div>
        </div>
        <GradientButton variant="primary" icon={Library} onClick={onOpenCatalog} className="w-full sm:w-auto">
          Explorar {CATALOG.length} juegos
          <kbd className="ml-1 hidden rounded-md bg-white/20 px-1.5 py-0.5 font-sans text-[10px] lg:inline">⌘K</kbd>
        </GradientButton>
      </div>
    </GlassCard>
  );
}
