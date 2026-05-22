/**
 * ProgresionPageV2 – Página principal del sub-módulo Progresión
 * Diseño glassmorphism / futurista
 * Conecta con los mismos servicios que la v1 — sin cambios en BD
 */
import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, TrendingUp, Users, Award, Target } from 'lucide-react';
import ProgresionService, {
  EstadisticaEtapa,
  ResumenProgresoScout,
  ProgresoArea,
} from '../../../services/progresionService';
import { StageTimeline } from './StageTimeline';
import { GrowthAreasGrid } from './GrowthAreasGrid';
import { ScoutCard, ScoutCardData } from './ScoutCard';
import { GlassCard } from '../ui/GlassCard';
import { ScoutDetailPanelV2 } from './ScoutDetailPanel';

// ─── KPI card ────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <GlassCard className="flex items-center gap-4">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}20`, color }}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-white leading-tight">{value}</p>
    </div>
  </GlassCard>
);

// ─── Main ────────────────────────────────────────────────────────────────────
const ProgresionPageV2: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticaEtapa[]>([]);
  const [scouts, setScouts] = useState<ResumenProgresoScout[]>([]);
  const [areasMap, setAreasMap] = useState<Record<string, ProgresoArea[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [filtroRama, setFiltroRama] = useState('');
  const [etapaActiva, setEtapaActiva] = useState('');
  const [scoutSeleccionado, setScoutSeleccionado] = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [est, sc] = await Promise.all([
        ProgresionService.obtenerEstadisticasEtapas(),
        ProgresionService.obtenerResumenProgresion(),
      ]);
      setEstadisticas(est);
      setScouts(sc);

      // Carga de áreas en paralelo (sin bloquear la UI)
      cargarAreas(sc.map((s) => s.scout_id));
    } catch {
      setError('No se pudieron cargar los datos de progresión');
    } finally {
      setLoading(false);
    }
  };

  const cargarAreas = async (scoutIds: string[]) => {
    const resultados = await Promise.allSettled(
      scoutIds.map((id) => ProgresionService.obtenerProgresoScout(id)),
    );
    const mapa: Record<string, ProgresoArea[]> = {};
    resultados.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        mapa[scoutIds[idx]] = r.value.areas ?? [];
      }
    });
    setAreasMap(mapa);
  };

  // ── filtrado ────────────────────────────────────────────────────────────
  const scoutsFiltrados: ScoutCardData[] = scouts
    .filter((s) => {
      const matchQ =
        !busqueda ||
        s.scout_nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchEtapa = !filtroEtapa || s.etapa_actual_codigo === filtroEtapa;
      const matchRama = !filtroRama || s.rama === filtroRama;
      return matchQ && matchEtapa && matchRama;
    })
    .map((s) => ({
      scout_id: s.scout_id,
      scout_nombre: s.scout_nombre,
      rama: s.rama,
      etapa_actual_codigo: s.etapa_actual_codigo ?? 'PISTA',
      porcentaje_completado: s.progreso_general ?? 0,
      objetivos_completados: s.objetivos_completados ?? 0,
      total_objetivos: s.total_objetivos ?? 0,
      areas: areasMap[s.scout_id],
    }));

  const ramasUnicas = [...new Set(scouts.map((s) => s.rama).filter(Boolean))];
  const totalCompletados = scouts.reduce((a, s) => a + (s.objetivos_completados ?? 0), 0);
  const totalObj = scouts.reduce((a, s) => a + (s.total_objetivos ?? 0), 0);
  const promedioGlobal = totalObj > 0 ? Math.round((totalCompletados / totalObj) * 100) : 0;

  // ── render ───────────────────────────────────────────────────────────────
  if (scoutSeleccionado) {
    return (
      <ScoutDetailPanelV2
        scoutId={scoutSeleccionado}
        onBack={() => setScoutSeleccionado(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060d1a] text-white p-6 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #00e5ff, #00e676)' }}
            >
              Progresión Scout
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Seguimiento del crecimiento personal en 4 etapas y 6 áreas
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Scouts activos" value={scouts.length} icon={<Users className="w-5 h-5" />} color="#00e5ff" />
        <KpiCard label="Objetivos logrados" value={totalCompletados} icon={<Target className="w-5 h-5" />} color="#00e676" />
        <KpiCard label="Promedio global" value={`${promedioGlobal}%`} icon={<TrendingUp className="w-5 h-5" />} color="#ffd600" />
        <KpiCard label="Etapas activas" value={estadisticas.length} icon={<Award className="w-5 h-5" />} color="#e040fb" />
      </div>

      {/* ── Etapas + Áreas ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-bold text-white/70 mb-4 uppercase tracking-widest text-xs">
            Las Cuatro Etapas
          </h2>
          <StageTimeline
            estadisticas={estadisticas.map((e) => ({
              etapa_codigo: e.etapa_codigo ?? '',
              total_scouts: e.total_scouts ?? 0,
              promedio_progreso: e.promedio_progreso ?? 0,
            }))}
            etapaActiva={etapaActiva}
            onEtapaClick={(c) => {
              setEtapaActiva(etapaActiva === c ? '' : c);
              setFiltroEtapa(filtroEtapa === c ? '' : c);
            }}
          />
        </section>

        <section>
          <h2 className="text-lg font-bold text-white/70 mb-4 uppercase tracking-widest text-xs">
            Áreas de Crecimiento
          </h2>
          <GrowthAreasGrid />
        </section>
      </div>

      {/* ── Lista de Scouts ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-bold text-white/70 uppercase tracking-widest text-xs">
            Scouts ({scoutsFiltrados.length})
          </h2>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Buscar…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 w-44"
              />
            </div>

            {/* Etapa */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={filtroEtapa}
                onChange={(e) => setFiltroEtapa(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50 appearance-none"
              >
                <option value="">Todas las etapas</option>
                {estadisticas.map((e) => (
                  <option key={e.etapa_codigo} value={e.etapa_codigo ?? ''}>
                    {e.etapa_nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Rama */}
            <select
              value={filtroRama}
              onChange={(e) => setFiltroRama(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50 appearance-none"
            >
              <option value="">Todas las ramas</option>
              {ramasUnicas.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : scoutsFiltrados.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
            <h3 className="text-lg font-bold text-white/50 mb-2">Sin scouts</h3>
            <p className="text-white/30 text-sm">Prueba cambiando los filtros</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scoutsFiltrados.map((scout) => (
              <ScoutCard
                key={scout.scout_id}
                scout={scout}
                onClick={setScoutSeleccionado}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProgresionPageV2;
