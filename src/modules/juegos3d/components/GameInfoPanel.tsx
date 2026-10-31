import { BookOpen, CalendarDays, GraduationCap, HeartHandshake, Layers3, Package, Shield, Sparkles, Users } from 'lucide-react';
import type { CatalogGame } from '../lib/catalog';
import { CATEGORIES, ruleSteps } from '../lib/catalog';
import { sceneTheme } from './theme';
import { Eyebrow, GlassCard } from './ui/GlassCard';
import { StatTile } from './ui/StatTile';
import { cn } from '../lib/cn';

/** Ficha pedagógica en formato bento, con los datos del juego del catálogo. */
export function GameInfoPanel({ game }: { game: CatalogGame }) {
  const arch = sceneTheme(game);
  const ArchIcon = arch.icon;
  const steps = ruleSteps(game);

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <GlassCard glow={arch.glow}>
        <Eyebrow icon={BookOpen}>Ficha pedagógica · {game.id}</Eyebrow>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight tracking-tight text-white">{game.name}</h2>
        {game.source && <p className="mt-1 text-xs italic text-white/45">{game.source}</p>}
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-white/10 bg-black/20 p-2.5 text-xs text-white/65">
          <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', arch.gradient)}>
            <ArchIcon size={14} aria-hidden />
          </span>
          <span>
            <span className="font-semibold text-white/85">Escena 3D: {arch.label}.</span> Representación del tipo de juego ({arch.hint.toLowerCase()}); las reglas exactas están abajo.
          </span>
        </div>
      </GlassCard>

      {game.visible_props.length > 0 && (
        <GlassCard padded={false} className="p-4">
          <Eyebrow icon={Package}>En escena</Eyebrow>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {game.visible_props.map((p) => (
              <li
                key={p.kind}
                title={p.source === 'materials' ? 'Del kit de materiales' : 'Lo nombran las reglas de este juego'}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium',
                  p.source === 'materials' ? 'border-white/20 bg-white/[0.06] text-white/85' : 'border-cyan-300/50 bg-cyan-400/15 text-cyan-50'
                )}
              >
                {p.label}
                {p.qty ? ` ×${p.qty}` : ''}
              </li>
            ))}
          </ul>
          {/* Leyenda con muestras de color (más legible que describir los colores con palabras) */}
          <ul className="mt-3 flex flex-col gap-1.5 text-xs leading-snug text-white/80">
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border border-cyan-300/60 bg-cyan-400/30" />
              Lo usan las reglas de este juego
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-full border border-white/30 bg-white/15" />
              Resto del kit de materiales del día
            </li>
          </ul>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Shield} label="Área" value={game.area} tone="violet" />
        <StatTile icon={Layers3} label="Categoría" value={CATEGORIES[game.category]} tone="cyan" />
        <StatTile icon={CalendarDays} label="Semana / rol" value={game.week || '—'} tone="pink" />
        <StatTile icon={Users} label="Formación" value={game.formation || '—'} tone="lime" />
      </div>

      <GlassCard>
        <Eyebrow icon={GraduationCap}>Objetivos educativos</Eyebrow>
        <dl className="mt-3 flex flex-col gap-3 text-sm">
          {([['11–12 años', game.objectives.ages_11_12], ['13–15 años', game.objectives.ages_13_15]] as const).map(([label, text]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <dt className="mb-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300">{label}</dt>
              <dd className="leading-snug text-white/80">{text || '—'}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      <GlassCard>
        <Eyebrow icon={Sparkles}>Reglas paso a paso</Eyebrow>
        <ol className="mt-3 flex flex-col gap-2.5">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm leading-snug text-white/75">
              <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white', arch.gradient)}>
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {game.materials && (
          <div className="mt-4 flex items-start gap-2 border-t border-white/10 pt-3 text-sm text-white/70">
            <Package size={16} className="mt-0.5 shrink-0 text-amber-300" aria-hidden />
            <span><span className="font-semibold text-white/85">Materiales: </span>{game.materials}</span>
          </div>
        )}
      </GlassCard>

      {game.inclusion && (
        <GlassCard glow="emerald" className="border-emerald-300/20">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <HeartHandshake size={18} aria-hidden />
            </span>
            <div className="text-sm leading-snug text-emerald-50/85">
              <span className="font-semibold text-emerald-200">Inclusión activa: </span>
              {game.inclusion}
            </div>
          </div>
        </GlassCard>
      )}
    </aside>
  );
}
