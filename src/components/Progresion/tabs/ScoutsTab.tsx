import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, RefreshCw, Search, X } from 'lucide-react';
import ProgresionService, { ProgresoCompletoScout, ObjetivoScout, ProgresoArea, GrupoObjetivo } from '../../../services/progresionService';
import { ProgressRing } from '../../shared/ui/ProgressRing';
import { CardSkeleton, ScoutCard } from '../ProgresionComponents';
import { AREA_COLORS, AREA_ICONS, STAGE_COLORS, STAGE_ICONS, type V4Scout } from '../useProgresionData';

// ─── Scout Detail ─────────────────────────────────────────────────────────────
const ScoutDetail: React.FC<{ scoutId: string; scoutNombre: string; scoutRama: string; onBack: () => void; onDataChanged: () => void }> = ({
  scoutId,
  scoutNombre,
  scoutRama,
  onBack,
  onDataChanged,
}) => {
  const [progreso, setProgreso] = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoScout[]>([]);
  const [grupoNombre, setGrupoNombre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [areaActiva, setAreaActiva] = useState('');
  // Edición local: los cambios se aplican en memoria y se persisten al pulsar "Guardar"
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [guardandoCambios, setGuardandoCambios] = useState(false);
  const savedRef = React.useRef<Map<string, boolean>>(new Map());

  React.useEffect(() => { load(); }, [scoutId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, objs, grupos] = await Promise.all([
        ProgresionService.obtenerProgresoScout(scoutId),
        ProgresionService.obtenerObjetivosScout(scoutId),
        scoutRama ? ProgresionService.obtenerGruposObjetivo(scoutRama) : Promise.resolve([] as GrupoObjetivo[]),
      ]);
      setProgreso(p);
      setObjetivos(objs);
      // Snapshot del estado persistido para detectar cambios sin guardar
      savedRef.current = new Map(objs.map((o) => [o.id, o.completado]));
      setDirty(new Set());
      // Resolver grupo dinámico por rama + etapa del scout
      const etapaCodigo = p?.etapa_actual_codigo ?? '';
      const grupoMatch = grupos.find((g) =>
        g.etapas_aplicables?.some((e) => e === etapaCodigo)
      );
      setGrupoNombre(grupoMatch?.nombre ?? p?.grupo_objetivo_nombre ?? null);
      // Use first area from objectives (reliable) or from SQL areas as fallback
      setAreaActiva(prev => prev || (objs[0]?.area_codigo ?? p?.areas?.[0]?.area_codigo ?? ''));
    } catch {
      setError('No se pudo cargar el detalle del scout');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (obj: ObjetivoScout) => {
    if (guardandoCambios) return;
    const nuevoValor = !obj.completado;
    setToggleError(null);
    // Aplicar el cambio en memoria (sin tocar la BD)
    setObjetivos((prev) =>
      prev.map((o) =>
        o.id === obj.id
          ? { ...o, completado: nuevoValor, fecha_completado: nuevoValor ? new Date().toISOString() : null }
          : o,
      ),
    );
    // Marcar/limpiar el objetivo como pendiente respecto al estado persistido
    setDirty((prev) => {
      const next = new Set(prev);
      const original = savedRef.current.get(obj.id) ?? false;
      if (nuevoValor === original) next.delete(obj.id);
      else next.add(obj.id);
      return next;
    });
  };

  const descartarCambios = () => {
    if (guardandoCambios) return;
    setObjetivos((prev) =>
      prev.map((o) => {
        const original = savedRef.current.get(o.id) ?? o.completado;
        return o.completado === original ? o : { ...o, completado: original };
      }),
    );
    setDirty(new Set());
    setToggleError(null);
  };

  const guardarCambios = async () => {
    if (dirty.size === 0 || guardandoCambios) return;
    setGuardandoCambios(true);
    setToggleError(null);
    try {
      for (const id of dirty) {
        const obj = objetivos.find((o) => o.id === id);
        if (!obj) continue;
        if (obj.completado) {
          const ok = await ProgresionService.completarObjetivo(scoutId, id);
          if (!ok) throw new Error('La BD no confirmó el marcado del objetivo');
        } else {
          await ProgresionService.desmarcarObjetivo(scoutId, id);
        }
      }
      await load();
      onDataChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los cambios';
      setToggleError(msg);
    } finally {
      setGuardandoCambios(false);
    }
  };

  const etapaColor = progreso?.etapa_actual_color
    || STAGE_COLORS[progreso?.etapa_actual_codigo ?? 'PISTA']
    || '#888';
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
          onClick={() => {
            if (dirty.size > 0 && !window.confirm('Hay cambios sin guardar. ¿Recargar y descartarlos?')) return;
            load();
          }}
          disabled={loading || guardandoCambios}
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

      {dirty.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-sm">
          <span className="text-sm font-medium text-amber-800">
            Tienes {dirty.size} cambio{dirty.size > 1 ? 's' : ''} sin guardar
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={descartarCambios}
              disabled={guardandoCambios}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={guardarCambios}
              disabled={guardandoCambios}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
            >
              {guardandoCambios ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
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
              {grupoNombre && (
                <p className="mt-1 text-xs text-gray-400">Grupo: {grupoNombre}</p>
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
                    const sinGuardar = dirty.has(obj.id);
                    return (
                      <div
                        key={obj.id}
                        className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                          sinGuardar
                            ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200'
                            : obj.completado
                              ? 'border-green-100 bg-green-50'
                              : 'border-gray-100 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={guardandoCambios}
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
interface ScoutsTabProps {
  loading: boolean;
  scouts: V4Scout[];
  onReload: () => void;
  ramaActiva?: string;
  ramaLabel?: string;
}

const ScoutsTab: React.FC<ScoutsTabProps> = ({ loading, scouts, onReload, ramaActiva, ramaLabel }) => {
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
        scoutRama={scout?.rama ?? ramaActiva ?? ''}
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
          <h2 className="text-2xl font-black tracking-tight text-gray-800">
            {ramaLabel ? `Scouts · ${ramaLabel}` : 'Scouts · Todas las ramas'}
          </h2>
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
            const scoutData = scouts.find((s) => s.etapaCodigo === e);
            const nombre = scoutData?.etapaNombre ?? e;
            const icono = scoutData?.etapaIcono ?? STAGE_ICONS[e] ?? '📍';
            return <option key={e} value={e}>{icono} {nombre}</option>;
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

export default ScoutsTab;
