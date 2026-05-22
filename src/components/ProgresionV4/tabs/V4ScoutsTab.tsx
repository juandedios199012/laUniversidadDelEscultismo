import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, RefreshCw, Search, X } from 'lucide-react';
import ProgresionService, { ProgresoCompletoScout, ObjetivoScout, ProgresoArea } from '../../../services/progresionService';
import { ProgressRing } from '../../ProgresionV2/ui/ProgressRing';
import { CardSkeleton, ScoutCard } from '../V4Components';
import { AREA_COLORS, AREA_ICONS, STAGE_COLORS, STAGE_ICONS, type V4Scout } from '../useProgresionV4Data';

// ─── Scout Detail ─────────────────────────────────────────────────────────────
const ScoutDetail: React.FC<{ scoutId: string; scoutNombre: string; onBack: () => void; onDataChanged: () => void }> = ({
  scoutId,
  scoutNombre,
  onBack,
  onDataChanged,
}) => {
  const [progreso, setProgreso] = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoScout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [areaActiva, setAreaActiva] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  React.useEffect(() => { load(); }, [scoutId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, objs] = await Promise.all([
        ProgresionService.obtenerProgresoScout(scoutId),
        ProgresionService.obtenerObjetivosScout(scoutId),
      ]);
      setProgreso(p);
      setObjetivos(objs);
      // Use first area from objectives (reliable) or from SQL areas as fallback
      setAreaActiva(prev => prev || (objs[0]?.area_codigo ?? p?.areas?.[0]?.area_codigo ?? ''));
    } catch {
      setError('No se pudo cargar el detalle del scout');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (obj: ObjetivoScout) => {
    setToggling(obj.id);
    setToggleError(null);
    try {
      if (obj.completado) {
        await ProgresionService.desmarcarObjetivo(scoutId, obj.id);
      } else {
        const ok = await ProgresionService.completarObjetivo(scoutId, obj.id);
        if (!ok) throw new Error('La BD no confirmó el marcado del objetivo');
      }
      await load();
      onDataChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el objetivo';
      setToggleError(msg);
    } finally {
      setToggling(null);
    }
  };

  const etapaColor = STAGE_COLORS[progreso?.etapa_actual_codigo ?? 'PISTA'] ?? '#888';
  const objetivosArea = objetivos.filter((o) => !areaActiva || o.area_codigo === areaActiva);

  // Compute areas from loaded objectives (fallback when obtener_progreso_completo_scout returns 0/0)
  const computedAreas = React.useMemo((): ProgresoArea[] => {
    // If SQL returned real area data, use it
    if (progreso?.areas?.some((a) => a.total_objetivos > 0)) return progreso.areas;
    // Otherwise compute from objectives (uses etapa_id path which works)
    if (!objetivos.length) return progreso?.areas ?? [];
    const areaMap = new Map<string, ProgresoArea>();
    objetivos.forEach((obj) => {
      if (!areaMap.has(obj.area_codigo)) {
        areaMap.set(obj.area_codigo, {
          area_id: obj.area_codigo,
          area_codigo: obj.area_codigo,
          area_nombre: obj.area_nombre,
          area_icono: obj.area_icono,
          area_color: obj.area_color,
          area_orden: 0,
          total_objetivos: 0,
          objetivos_completados: 0,
          porcentaje: 0,
        });
      }
      const a = areaMap.get(obj.area_codigo)!;
      a.total_objetivos++;
      if (obj.completado) a.objetivos_completados++;
      a.porcentaje = a.total_objetivos > 0
        ? parseFloat(((a.objetivos_completados / a.total_objetivos) * 100).toFixed(1))
        : 0;
    });
    return Array.from(areaMap.values());
  }, [objetivos, progreso?.areas]);

  // Computed totals (fallback to objectives-based count when SQL returns 0)
  const computedCompletados = React.useMemo(
    () => (progreso?.total_objetivos ?? 0) > 0 ? (progreso!.objetivos_completados) : objetivos.filter((o) => o.completado).length,
    [progreso, objetivos],
  );
  const computedTotal = React.useMemo(
    () => (progreso?.total_objetivos ?? 0) > 0 ? progreso!.total_objetivos : objetivos.length,
    [progreso, objetivos],
  );
  const computedProgreso = computedTotal > 0
    ? parseFloat(((computedCompletados / computedTotal) * 100).toFixed(1))
    : (progreso?.progreso_general ?? 0);

  return (
    <div className="space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <div>
          <h2 className="text-lg font-black text-gray-800">{scoutNombre}</h2>
          {progreso && (
            <p className="text-xs text-gray-400">
              Etapa: {progreso.etapa_actual_nombre} · desde {progreso.fecha_inicio_etapa}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto rounded-xl border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}
      {toggleError && (
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          <span>⚠ No se pudo guardar: {toggleError}</span>
          <button type="button" onClick={() => setToggleError(null)} className="text-orange-400 hover:text-orange-600 font-bold ml-3">✕</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-20" />)}
        </div>
      ) : progreso ? (
        <>
          {/* Resumen general */}
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <ProgressRing percentage={computedProgreso} size={100} strokeWidth={7} color={etapaColor}>
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: etapaColor }}>
                  {computedProgreso}%
                </div>
              </div>
            </ProgressRing>
            <div>
              <p className="text-3xl font-black text-gray-800">
                {computedCompletados}
                <span className="text-lg font-normal text-gray-400"> / {computedTotal}</span>
              </p>
              <p className="text-sm text-gray-500">objetivos completados</p>
              {progreso.grupo_objetivo_nombre && (
                <p className="mt-1 text-xs text-gray-400">Grupo: {progreso.grupo_objetivo_nombre}</p>
              )}
            </div>
          </div>

          {/* Áreas de crecimiento */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              Áreas de Crecimiento
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {computedAreas.map((area) => {
                const isActive = areaActiva === area.area_codigo;
                const color = AREA_COLORS[area.area_codigo] ?? area.area_color;
                const icon = AREA_ICONS[area.area_codigo] ?? area.area_icono;
                return (
                  <button
                    key={area.area_id}
                    type="button"
                    onClick={() => setAreaActiva(area.area_codigo)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:shadow-md ${
                      isActive ? 'shadow-md ring-1' : 'border-gray-100 bg-white shadow-sm'
                    }`}
                    style={isActive ? { borderColor: `${color}50` } : undefined}
                  >
                    <ProgressRing percentage={area.porcentaje} size={48} strokeWidth={4} color={color}>
                      <span className="text-sm">{icon}</span>
                    </ProgressRing>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold" style={{ color }}>{area.area_nombre}</p>
                      <p className="text-xs text-gray-400">{area.objetivos_completados}/{area.total_objetivos}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Objetivos */}
          {areaActiva && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Objetivos · {computedAreas.find((a) => a.area_codigo === areaActiva)?.area_nombre ?? areaActiva}
              </h3>
              <div className="space-y-2">
                {objetivosArea.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-400">
                    No hay objetivos para esta área
                  </div>
                ) : (
                  objetivosArea.map((obj) => {
                    const color = AREA_COLORS[obj.area_codigo] ?? '#888';
                    return (
                      <div
                        key={obj.id}
                        className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                          obj.completado ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={toggling === obj.id}
                          onClick={() => handleToggle(obj)}
                          className="mt-0.5 shrink-0 transition hover:scale-110 disabled:opacity-50"
                        >
                          {obj.completado ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${obj.completado ? 'text-green-700 line-through decoration-green-400' : 'text-gray-800'}`}>
                            {obj.titulo}
                          </p>
                          {obj.fecha_completado && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              Completado: {new Date(obj.fecha_completado).toLocaleDateString('es-PE')}
                            </p>
                          )}
                        </div>
                        {/* Area badge */}
                        <span
                          className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
                          style={{ background: `${color}18`, color }}
                        >
                          {obj.area_nombre}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
};

// ─── Main Tab ─────────────────────────────────────────────────────────────────
interface V4ScoutsTabProps {
  loading: boolean;
  scouts: V4Scout[];
  onReload: () => void;
}

const V4ScoutsTab: React.FC<V4ScoutsTabProps> = ({ loading, scouts, onReload }) => {
  const [search, setSearch] = useState('');
  const [filtroPatrulla, setFiltroPatrulla] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    const scout = scouts.find((s) => s.id === selectedId);
    return (
      <ScoutDetail
        scoutId={selectedId}
        scoutNombre={scout?.nombre ?? ''}
        onBack={() => setSelectedId(null)}
        onDataChanged={onReload}
      />
    );
  }

  const patrullas = [...new Set(scouts.map((s) => s.patrulla).filter(Boolean))].sort();
  const etapas = [...new Set(scouts.map((s) => s.etapaCodigo).filter(Boolean))].sort();

  const filtered = scouts.filter((s) => {
    const q = search.toLowerCase();
    const matchQ = !search || s.nombre.toLowerCase().includes(q) || s.codigo.toLowerCase().includes(q);
    const matchP = !filtroPatrulla || s.patrulla === filtroPatrulla;
    const matchE = !filtroEtapa || s.etapaCodigo === filtroEtapa;
    return matchQ && matchP && matchE;
  });

  const hasFilters = search || filtroPatrulla || filtroEtapa;

  return (
    <div className="space-y-6">
      {/* Header + filters */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800">Scouts de la Tropa</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} de {scouts.length} scouts
          </p>
        </div>
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <select
          value={filtroPatrulla}
          onChange={(e) => setFiltroPatrulla(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
        >
          <option value="">Todas las patrullas</option>
          {patrullas.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
        >
          <option value="">Todas las etapas</option>
          {etapas.map((e) => {
            const names: Record<string, string> = { PISTA: 'Pista', SENDA: 'Senda', RUMBO: 'Rumbo', TRAVESIA: 'Travesía' };
            return <option key={e} value={e}>{STAGE_ICONS[e]} {names[e] ?? e}</option>;
          })}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(''); setFiltroPatrulla(''); setFiltroEtapa(''); }}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Grid of cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-sm font-semibold text-gray-500">No se encontraron scouts</p>
          <p className="mt-1 text-xs text-gray-400">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((scout) => (
            <ScoutCard
              key={scout.id}
              scout={scout}
              onClick={() => setSelectedId(scout.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default V4ScoutsTab;
