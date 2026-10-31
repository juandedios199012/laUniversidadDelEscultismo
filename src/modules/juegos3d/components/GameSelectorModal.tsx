import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Library, Search, X } from 'lucide-react';
import { AREAS, Area, CATALOG, CATEGORIES, CatalogMatch, Category, countBy, filterCatalog, searchCatalog } from '../lib/catalog';
import { sceneTheme, AREA_THEME } from './theme';
import { GradientButton } from './ui/GradientButton';
import { SegmentedControl } from './ui/SegmentedControl';
import { cn } from '../lib/cn';

interface GameSelectorModalProps {
  open: boolean;
  onClose: () => void;
  currentId: string;
  onSelect: (id: string) => void;
}

type CategoryFilter = 'all' | Category;
const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...(Object.keys(CATEGORIES) as Category[]).map((c) => ({ value: c, label: `${CATEGORIES[c]} · JUE-${c}` })),
];

/** Explorador de los juegos del catálogo: búsqueda en vivo + filtros por área y categoría. */
export function GameSelectorModal({ open, onClose, currentId, onSelect }: GameSelectorModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [areas, setAreas] = useState<ReadonlySet<Area>>(new Set());
  const [category, setCategory] = useState<CategoryFilter>('all');
  const deferredQuery = useDeferredValue(query); // la escritura nunca espera al filtrado

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = 'hidden';
      // En pantallas táctiles no se enfoca: el teclado taparía los resultados
      if (!window.matchMedia('(pointer: coarse)').matches) searchInput.current?.focus();
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) document.documentElement.style.overflow = '';
  }, [open]);

  const categories = useMemo<ReadonlySet<Category>>(() => new Set(category === 'all' ? [] : [category]), [category]);
  const results = useMemo(() => searchCatalog({ query: deferredQuery, areas, categories }), [deferredQuery, areas, categories]);
  // Contadores por área según búsqueda y categoría actuales (sin el filtro de área)
  const areaCounts = useMemo(
    () => countBy(filterCatalog({ query: deferredQuery, areas: new Set(), categories }), (g) => g.area),
    [deferredQuery, categories]
  );

  const toggleArea = (a: Area) =>
    setAreas((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });

  const clearFilters = () => {
    setQuery('');
    setAreas(new Set());
    setCategory('all');
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Catálogo de juegos"
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className={cn(
        'm-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-white',
        'sm:m-auto sm:h-[86vh] sm:w-[min(72rem,94vw)] sm:rounded-3xl',
        'backdrop:bg-black/70 backdrop:backdrop-blur-sm'
      )}
    >
      <div className="flex h-full flex-col overflow-hidden border-white/10 bg-ink-900/95 backdrop-blur-2xl sm:rounded-3xl sm:border">
        {/* Encabezado + filtros */}
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Library size={20} className="text-cyan-300" aria-hidden />
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Catálogo de juegos</h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-white/70">
                {results.length}/{CATALOG.length}
              </span>
            </div>
            <GradientButton iconOnly size="sm" variant="ghost" icon={X} aria-label="Cerrar catálogo" onClick={onClose} />
          </div>

          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              ref={searchInput}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, ID, semana, reglas o materiales (brújula, acecho…)"
              aria-label="Buscar juego"
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/30 pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          </label>

          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrar por área">
            {AREAS.map((a) => {
              const t = AREA_THEME[a];
              const Icon = t.icon;
              const active = areas.has(a);
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleArea(a)}
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all active:scale-[0.97]',
                    'focus-visible:outline-2 focus-visible:outline-cyan-300',
                    active ? t.chip : 'border-white/10 bg-white/[0.04] text-white/60 hover:text-white'
                  )}
                >
                  <Icon size={13} aria-hidden />
                  {a}
                  <span className="tabular-nums opacity-60">{areaCounts[a] ?? 0}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl ariaLabel="Categoría" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
            {(query || areas.size > 0 || category !== 'all') && (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          {results.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-white/55">
              <Search size={28} className="text-white/25" aria-hidden />
              Ningún juego coincide con la búsqueda.
              <button type="button" onClick={clearFilters} className="font-semibold text-cyan-300">Limpiar filtros</button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((match) => (
                <li key={match.game.id}>
                  <GameResultCard
                    match={match}
                    active={match.game.id === currentId}
                    onPick={() => {
                      onSelect(match.game.id);
                      onClose();
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}

function GameResultCard({ match, active, onPick }: { match: CatalogMatch; active: boolean; onPick: () => void }) {
  const { game, snippet } = match;
  const arch = sceneTheme(game);
  const area = AREA_THEME[game.area];
  const ArchIcon = arch.icon;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-current={active || undefined}
      className={cn(
        'group flex h-full w-full flex-col gap-2 rounded-2xl border p-3.5 text-left transition-all',
        'focus-visible:outline-2 focus-visible:outline-cyan-300 active:scale-[0.99]',
        active
          ? 'border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_24px_-8px_rgba(34,211,238,0.7)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-white/50">{game.id}</span>
        <span className={cn('inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold text-white', arch.gradient)}>
          <ArchIcon size={11} aria-hidden /> {arch.label}
        </span>
      </div>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-white">{game.name}</span>
      {snippet && (
        <span className="line-clamp-2 rounded-lg bg-black/25 px-2 py-1 text-[11px] leading-snug text-white/55">
          <span className="font-semibold text-white/70">{snippet.field}: </span>
          {snippet.before}
          <mark className="rounded bg-cyan-400/25 px-0.5 text-cyan-100">{snippet.hit}</mark>
          {snippet.after}
        </span>
      )}
      <span className="mt-auto flex items-center gap-2 text-[11px] text-white/50">
        <span className={cn('h-2 w-2 rounded-full', area.dot)} aria-hidden />
        {game.area}
        <span className="text-white/25">·</span>
        <span className="truncate">{game.week_number ? `Semana ${game.week_number}` : game.week}</span>
      </span>
    </button>
  );
}
