// ============================================================================
// PROGRESION SCREEN – Mobile v4
// ============================================================================
// Porta el módulo Progresión V4 de la web al mobile.
// Tres tabs: Resumen · Scouts · Análisis
// Responsivo para Android (360px+), iOS (375px+) y tablets (768px+)
// Touch targets ≥ 44px, sin librerías de charts externas.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useProgresionV4Data, AREA_COLORS, AREA_ICONS, STAGE_COLORS, STAGE_ICONS } from '../ProgresionV4/useProgresionV4Data';
import type { V4Scout, V4AreaData, V4StageBar } from '../ProgresionV4/useProgresionV4Data';
import ProgresionService, { ObjetivoScout, ProgresoArea, ProgresoCompletoScout } from '../../services/progresionService';
import { ProgressRing } from '../ProgresionV2/ui/ProgressRing';

// ─── Constantes ──────────────────────────────────────────────────────────────
const ETAPAS_META: Record<string, { edad: number; nombre: string }> = {
  PISTA:    { edad: 11, nombre: 'Pista' },
  SENDA:    { edad: 12, nombre: 'Senda' },
  RUMBO:    { edad: 13, nombre: 'Rumbo' },
  TRAVESIA: { edad: 14, nombre: 'Travesía' },
};
const ETAPAS_ORDEN = ['PISTA', 'SENDA', 'RUMBO', 'TRAVESIA'] as const;
const AREA_ORDER   = ['CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD'];

type TabId = 'resumen' | 'scouts';

// ─── Componentes pequeños ────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
);

const MobileKpiCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string;
}> = ({ icon, label, value, sub, color }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ background: `${color}20`, color }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-xl font-black tracking-tight text-gray-800">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>}
    </div>
  </div>
);

const MobileStageCard: React.FC<{ bar: V4StageBar }> = ({ bar }) => {
  const meta  = ETAPAS_META[bar.etapaCodigo] ?? { edad: 0, nombre: bar.etapaNombre };
  const color = STAGE_COLORS[bar.etapaCodigo] ?? '#888';
  const icon  = STAGE_ICONS[bar.etapaCodigo]  ?? '●';
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{ borderColor: `${color}40`, background: `${color}09` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
             style={{ background: `${color}20` }}>
          {icon}
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: `${color}20`, color }}>
          {meta.edad} años
        </span>
      </div>
      <h3 className="font-black text-gray-800">{meta.nombre}</h3>
      <div className="mt-1.5 flex items-center gap-1 text-sm text-gray-500 mb-2">
        <Users className="h-3.5 w-3.5" />
        <span className="font-bold" style={{ color }}>{bar.totalScouts}</span>
        <span>scouts</span>
      </div>
      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-1">
        <span>Promedio</span>
        <span style={{ color }}>{bar.promedioProgreso}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${bar.promedioProgreso}%`, background: color }} />
      </div>
    </div>
  );
};

const MobileAreaBar: React.FC<{ area: V4AreaData }> = ({ area }) => {
  const color = AREA_COLORS[area.codigo] ?? '#888';
  const icon  = AREA_ICONS[area.codigo]  ?? '●';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <ProgressRing percentage={area.porcentaje} size={52} strokeWidth={4} color={color}>
        <span className="text-sm">{icon}</span>
      </ProgressRing>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color }}>{area.nombre}</p>
        <p className="text-xs text-gray-400">{area.completados}/{area.total} objetivos</p>
      </div>
      <span className="text-lg font-black" style={{ color }}>{area.porcentaje}%</span>
    </div>
  );
};

const MobileScoutCard: React.FC<{ scout: V4Scout; onClick: () => void }> = ({ scout, onClick }) => {
  const color = STAGE_COLORS[scout.etapaCodigo] ?? '#888';
  const icon  = STAGE_ICONS[scout.etapaCodigo]  ?? '●';
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start gap-3">
        <ProgressRing percentage={scout.progreso} size={56} strokeWidth={5} color={color}>
          <span className="text-[10px] font-black" style={{ color }}>{Math.round(scout.progreso)}%</span>
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-800 text-sm leading-tight">{scout.nombre}</p>
            {scout.codigo && (
              <span className="text-[10px] text-gray-400 font-mono">{scout.codigo}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: `${color}18`, color }}>
              {icon} {scout.etapaNombre}
            </span>
            {scout.patrulla && scout.patrulla !== 'Sin patrulla' && (
              <span className="text-[10px] text-gray-400">{scout.patrulla}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
            <span>{scout.objetivosCompletados}/{scout.totalObjetivos} objetivos</span>
            {scout.rama && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {scout.rama}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── Detalle del Scout ────────────────────────────────────────────────────────
const ScoutDetailMobile: React.FC<{
  scout: V4Scout;
  onBack: () => void;
  onDataChanged: () => void;
}> = ({ scout, onBack, onDataChanged }) => {
  const [progreso, setProgreso]     = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos]   = useState<ObjetivoScout[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [toggling, setToggling]     = useState<string | null>(null);
  const [areaActiva, setAreaActiva] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [p, objs] = await Promise.all([
        ProgresionService.obtenerProgresoScout(scout.id),
        ProgresionService.obtenerObjetivosScout(scout.id),
      ]);
      setProgreso(p);
      setObjetivos(objs);
      setAreaActiva(prev => prev || objs[0]?.area_codigo || p?.areas?.[0]?.area_codigo || '');
    } catch {
      setError('No se pudo cargar el detalle');
    } finally {
      setLoading(false);
    }
  }, [scout.id]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (obj: ObjetivoScout) => {
    setToggling(obj.id); setSaveError(null);
    try {
      if (obj.completado) {
        await ProgresionService.desmarcarObjetivo(scout.id, obj.id);
      } else {
        const ok = await ProgresionService.completarObjetivo(scout.id, obj.id);
        if (!ok) throw new Error('La BD no confirmó el objetivo');
      }
      await load();
      onDataChanged();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setToggling(null);
    }
  };

  const computedAreas: ProgresoArea[] = useMemo(() => {
    if (progreso?.areas?.some(a => a.total_objetivos > 0)) return progreso.areas;
    if (!objetivos.length) return progreso?.areas ?? [];
    const m = new Map<string, ProgresoArea>();
    objetivos.forEach(obj => {
      if (!m.has(obj.area_codigo)) {
        m.set(obj.area_codigo, {
          area_id: obj.area_codigo, area_codigo: obj.area_codigo,
          area_nombre: obj.area_nombre, area_icono: obj.area_icono,
          area_color: obj.area_color, area_orden: 0,
          total_objetivos: 0, objetivos_completados: 0, porcentaje: 0,
        });
      }
      const a = m.get(obj.area_codigo)!;
      a.total_objetivos++;
      if (obj.completado) a.objetivos_completados++;
      a.porcentaje = a.total_objetivos > 0
        ? parseFloat(((a.objetivos_completados / a.total_objetivos) * 100).toFixed(1)) : 0;
    });
    return Array.from(m.values());
  }, [objetivos, progreso?.areas]);

  const computedCompletados = useMemo(() =>
    (progreso?.total_objetivos ?? 0) > 0
      ? progreso!.objetivos_completados
      : objetivos.filter(o => o.completado).length,
    [progreso, objetivos]);

  const computedTotal = useMemo(() =>
    (progreso?.total_objetivos ?? 0) > 0 ? progreso!.total_objetivos : objetivos.length,
    [progreso, objetivos]);

  const computedPct = computedTotal > 0
    ? parseFloat(((computedCompletados / computedTotal) * 100).toFixed(1))
    : (progreso?.progreso_general ?? 0);

  const etapaColor = STAGE_COLORS[progreso?.etapa_actual_codigo ?? scout.etapaCodigo] ?? '#888';
  const objetivosArea = objetivos.filter(o => !areaActiva || o.area_codigo === areaActiva);

  return (
    <div className="flex flex-col h-full">
      {/* Header del detalle */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 truncate">{scout.nombre}</p>
          {progreso && (
            <p className="text-[10px] text-gray-400">
              {progreso.etapa_actual_nombre} · desde {progreso.fecha_inicio_etapa}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-500 active:bg-gray-50 disabled:opacity-40 transition-colors"
          aria-label="Actualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        {saveError && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 flex items-center justify-between gap-2">
            <span>⚠ {saveError}</span>
            <button type="button" onClick={() => setSaveError(null)}
              className="p-1 text-orange-400 font-bold"><X className="h-4 w-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <>
            {/* Resumen del scout */}
            <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <ProgressRing percentage={computedPct} size={88} strokeWidth={7} color={etapaColor}>
                <div className="text-center">
                  <p className="text-base font-black leading-none" style={{ color: etapaColor }}>
                    {computedPct}%
                  </p>
                </div>
              </ProgressRing>
              <div>
                <p className="text-3xl font-black text-gray-800">
                  {computedCompletados}
                  <span className="text-base font-normal text-gray-400"> / {computedTotal}</span>
                </p>
                <p className="text-xs text-gray-500">objetivos completados</p>
                {progreso?.grupo_objetivo_nombre && (
                  <p className="mt-1 text-[10px] text-gray-400">Grupo: {progreso.grupo_objetivo_nombre}</p>
                )}
              </div>
            </div>

            {/* Áreas — chips horizontales en phone, grid en tablet */}
            {computedAreas.length > 0 && (
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Áreas de Crecimiento
                </h3>
                {/* Phone: scroll horizontal */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 md:hidden" role="tablist">
                  {computedAreas.map(area => {
                    const isActive = areaActiva === area.area_codigo;
                    const color = AREA_COLORS[area.area_codigo] ?? area.area_color;
                    const icon  = AREA_ICONS[area.area_codigo]  ?? area.area_icono;
                    return (
                      <button key={area.area_id} type="button" role="tab"
                        aria-selected={isActive}
                        onClick={() => setAreaActiva(area.area_codigo)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2.5 text-xs font-bold transition-all ${
                          isActive ? 'shadow-md' : 'border-gray-200 bg-white'
                        }`}
                        style={isActive ? { borderColor: color, background: `${color}18`, color } : undefined}
                      >
                        <span>{icon}</span>
                        <span>{area.area_nombre}</span>
                        <span className="ml-1 rounded-full px-1 text-[9px] font-black"
                              style={{ background: `${color}20`, color }}>
                          {area.objetivos_completados}/{area.total_objetivos}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Tablet: grid 3 col */}
                <div className="hidden md:grid md:grid-cols-3 gap-3">
                  {computedAreas.map(area => {
                    const isActive = areaActiva === area.area_codigo;
                    const color = AREA_COLORS[area.area_codigo] ?? area.area_color;
                    const icon  = AREA_ICONS[area.area_codigo]  ?? area.area_icono;
                    return (
                      <button key={area.area_id} type="button"
                        onClick={() => setAreaActiva(area.area_codigo)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:shadow-md ${
                          isActive ? 'shadow-md ring-1' : 'border-gray-100 bg-white shadow-sm'
                        }`}
                        style={isActive ? { borderColor: `${color}50` } : undefined}
                      >
                        <ProgressRing percentage={area.porcentaje} size={44} strokeWidth={4} color={color}>
                          <span className="text-xs">{icon}</span>
                        </ProgressRing>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold" style={{ color }}>{area.area_nombre}</p>
                          <p className="text-[10px] text-gray-400">{area.objetivos_completados}/{area.total_objetivos}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Objetivos */}
            {areaActiva && (
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Objetivos ·{' '}
                  {computedAreas.find(a => a.area_codigo === areaActiva)?.area_nombre ?? areaActiva}
                </h3>
                {objetivosArea.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-400">
                    No hay objetivos para esta área
                  </div>
                ) : (
                  <div className="space-y-2">
                    {objetivosArea.map(obj => {
                      const color  = AREA_COLORS[obj.area_codigo] ?? '#888';
                      const isBusy = toggling === obj.id;
                      return (
                        <div key={obj.id}
                          className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                            obj.completado ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-white'
                          }`}
                        >
                          {/* Toggle — 44px tap target */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggle(obj)}
                            className="mt-0.5 shrink-0 flex h-11 w-11 items-center justify-center rounded-xl transition active:scale-95 disabled:opacity-50"
                            aria-label={obj.completado ? 'Desmarcar objetivo' : 'Marcar como completado'}
                          >
                            {isBusy ? (
                              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                            ) : obj.completado ? (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            ) : (
                              <Circle className="h-6 w-6 text-gray-300" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${
                              obj.completado ? 'text-green-700 line-through decoration-green-400' : 'text-gray-800'
                            }`}>
                              {obj.titulo}
                            </p>
                            {obj.fecha_completado && (
                              <p className="mt-0.5 text-[10px] text-gray-400">
                                ✓ {new Date(obj.fecha_completado).toLocaleDateString('es-PE')}
                              </p>
                            )}
                          </div>
                          <span
                            className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold self-start mt-0.5"
                            style={{ background: `${color}18`, color }}
                          >
                            {obj.area_nombre}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────
const ResumenTab: React.FC<{
  loading: boolean;
  totalScouts: number;
  promedioGlobal: number;
  totalCompletados: number;
  etapasActivas: number;
  stageBars: V4StageBar[];
  globalAreas: V4AreaData[];
  onReload: () => void;
}> = ({ loading, totalScouts, promedioGlobal, totalCompletados, etapasActivas, stageBars, globalAreas }) => (
  <div className="p-4 space-y-5">
    {/* KPIs 2×2 phone / 4 col tablet */}
    {loading ? (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[72px]" />)}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MobileKpiCard icon={<Users className="h-5 w-5" />}          label="Scouts"         value={totalScouts}           color="#4f8ddb" />
        <MobileKpiCard icon={<TrendingUp className="h-5 w-5" />}     label="Promedio"       value={`${promedioGlobal}%`}  color="#27c664" />
        <MobileKpiCard icon={<CheckCircle2 className="h-5 w-5" />}   label="Completados"    value={totalCompletados}      color="#f59e0b" />
        <MobileKpiCard icon={<LayoutDashboard className="h-5 w-5" />} label="Etapas activas" value={etapasActivas}        color="#a855f7" />
      </div>
    )}

    {/* Etapas 2×2 phone / 4 col tablet */}
    <section>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
        Etapas de Progresión
      </h3>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ETAPAS_ORDEN.map(codigo => {
            const bar = stageBars.find(b => b.etapaCodigo === codigo) ?? {
              etapaCodigo: codigo, etapaNombre: ETAPAS_META[codigo].nombre,
              totalScouts: 0, promedioProgreso: 0,
            };
            return <MobileStageCard key={codigo} bar={bar} />;
          })}
        </div>
      )}
    </section>

    {/* Áreas globales */}
    <section>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
        Áreas de Crecimiento · Global
      </h3>
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[68px]" />)}
        </div>
      ) : (
        <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
          {AREA_ORDER.map(codigo => {
            const area = globalAreas.find(a => a.codigo === codigo);
            if (!area) return null;
            return <MobileAreaBar key={codigo} area={area} />;
          })}
        </div>
      )}
    </section>
  </div>
);

// ─── Tab: Scouts ─────────────────────────────────────────────────────────────
const ScoutsTab: React.FC<{
  loading: boolean;
  scouts: V4Scout[];
  onReload: () => void;
}> = ({ loading, scouts, onReload }) => {
  const [search, setSearch]           = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [selected, setSelected]       = useState<V4Scout | null>(null);

  if (selected) {
    return (
      <ScoutDetailMobile
        scout={selected}
        onBack={() => setSelected(null)}
        onDataChanged={onReload}
      />
    );
  }

  const etapas = [...new Set(scouts.map(s => s.etapaCodigo).filter(Boolean))].sort();
  const filtrados = scouts.filter(s => {
    const q = search.toLowerCase();
    return (!search || s.nombre.toLowerCase().includes(q) || s.codigo.toLowerCase().includes(q))
        && (!filtroEtapa || s.etapaCodigo === filtroEtapa);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filtros sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 space-y-2 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroEtapa}
            onChange={e => setFiltroEtapa(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 outline-none focus:border-blue-300 bg-white"
          >
            <option value="">Todas las etapas</option>
            {etapas.map(e => {
              const names: Record<string, string> = { PISTA: 'Pista', SENDA: 'Senda', RUMBO: 'Rumbo', TRAVESIA: 'Travesía' };
              return <option key={e} value={e}>{STAGE_ICONS[e]} {names[e] ?? e}</option>;
            })}
          </select>
          {(search || filtroEtapa) && (
            <button type="button"
              onClick={() => { setSearch(''); setFiltroEtapa(''); }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-500 active:bg-gray-50"
              aria-label="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400">{filtrados.length} de {scouts.length} scouts</p>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Target className="h-10 w-10 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500 text-sm">No se encontraron scouts</p>
            <p className="text-xs text-gray-400 mt-1">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {filtrados.map(s => (
              <MobileScoutCard key={s.id} scout={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ProgresionScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const data = useProgresionV4Data();

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'resumen', label: 'Resumen', icon: TrendingUp },
    { id: 'scouts',  label: 'Scouts',  icon: Users      },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header con tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div>
            <h2 className="text-base font-black tracking-tight text-gray-800">Progresión Scout</h2>
            <p className="text-[10px] text-gray-400">v4 · Datos reales</p>
          </div>
          <div className="flex items-center gap-2">
            {data.loading && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                Cargando…
              </div>
            )}
            {data.error && !data.loading && (
              <span className="text-[10px] text-red-500 font-semibold">⚠ Error</span>
            )}
            <button
              type="button"
              onClick={data.reload}
              disabled={data.loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 active:bg-gray-50 disabled:opacity-40 transition-colors"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs pill */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto" role="tablist" aria-label="Secciones de progresión">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error global */}
      {data.error && !data.loading && (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Error al cargar los datos</p>
            <p className="text-xs mt-0.5">{data.error}</p>
          </div>
          <button type="button" onClick={data.reload}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white active:bg-red-700">
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'resumen' && (
          <ResumenTab
            loading={data.loading}
            totalScouts={data.totalScouts}
            promedioGlobal={data.promedioGlobal}
            totalCompletados={data.totalCompletados}
            etapasActivas={data.etapasActivas}
            stageBars={data.stageBars}
            globalAreas={data.globalAreas}
            onReload={data.reload}
          />
        )}
        {activeTab === 'scouts' && (
          <ScoutsTab
            loading={data.loading}
            scouts={data.scouts}
            onReload={data.reload}
          />
        )}

      </div>
    </div>
  );
}
