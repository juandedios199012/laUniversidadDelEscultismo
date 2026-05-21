/**
 * ObjetivosPageV2 – Sub-módulo de Objetivos Educativos en diseño futurista
 * Modo solo-lectura (propuesta visual); las acciones de CRUD usan el mismo hook admin
 */
import React from 'react';
import { RefreshCw, Search, Filter, Target, BookOpen, Users2 } from 'lucide-react';
import { useObjetivosAdmin } from '../../../hooks/useObjetivosAdmin';
import { GlassCard } from '../ui/GlassCard';
import { ObjetivoCardV2 } from './ObjetivoCardV2';
import { AREAS_CONFIG, AREAS_LISTA } from '../config/etapasConfig';

// ─── KPI ─────────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <GlassCard className="flex items-center gap-4">
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
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

// ─── Main ─────────────────────────────────────────────────────────────────────
const ObjetivosPageV2: React.FC = () => {
  const {
    objetivosFiltrados,
    grupos,
    areas,
    estado,
    filtros,
    estadisticas,
    cargarDatos,
    setFiltros,
    limpiarFiltros,
  } = useObjetivosAdmin();

  const totalPorArea = Object.entries(estadisticas.porArea);

  return (
    <div className="min-h-screen bg-[#060d1a] text-white p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #651fff, #d500f9)' }}
            >
              Objetivos Educativos
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Catálogo de objetivos por etapa y área de crecimiento
          </p>
        </div>
        <button
          onClick={cargarDatos}
          disabled={estado.loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${estado.loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {estado.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
          {estado.error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Total objetivos"
          value={estadisticas.total}
          icon={<Target className="w-5 h-5" />}
          color="#651fff"
        />
        <KpiCard
          label="Grupos"
          value={grupos.length}
          icon={<BookOpen className="w-5 h-5" />}
          color="#d500f9"
        />
        <KpiCard
          label="Áreas"
          value={areas.length}
          icon={<Users2 className="w-5 h-5" />}
          color="#00b0ff"
        />
      </div>

      {/* Distribución por área */}
      {totalPorArea.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
            Distribución por Área
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AREAS_LISTA.map((areaConf) => {
              const count = estadisticas.porArea[areaConf.codigo] ?? 0;
              const maxCount = Math.max(...Object.values(estadisticas.porArea), 1);
              const pct = Math.round((count / maxCount) * 100);
              return (
                <GlassCard
                  key={areaConf.codigo}
                  hoverable
                  onClick={() => setFiltros((f) => ({ ...f, area: areaConf.codigo === filtros.area ? '' : areaConf.codigo }))}
                  glowColor={filtros.area === areaConf.codigo ? areaConf.color : undefined}
                  className={filtros.area === areaConf.codigo ? 'ring-1' : ''}
                  style={{ borderColor: filtros.area === areaConf.codigo ? `${areaConf.color}60` : undefined } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{areaConf.icon}</span>
                    <span
                      className="text-sm font-bold truncate"
                      style={{ color: areaConf.color }}
                    >
                      {areaConf.nombre}
                    </span>
                    <span className="ml-auto text-xs font-mono text-white/50">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: areaConf.color,
                        boxShadow: `0 0 4px ${areaConf.color}`,
                      }}
                    />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar objetivo…"
            value={filtros.busqueda}
            onChange={(e) => setFiltros((f) => ({ ...f, busqueda: e.target.value }))}
            className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-400/50 w-52"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <select
            value={filtros.grupo}
            onChange={(e) => setFiltros((f) => ({ ...f, grupo: e.target.value }))}
            className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-400/50 appearance-none"
          >
            <option value="">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g.codigo} value={g.codigo}>{g.nombre}</option>
            ))}
          </select>
        </div>

        <select
          value={filtros.area}
          onChange={(e) => setFiltros((f) => ({ ...f, area: e.target.value }))}
          className="px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-400/50 appearance-none"
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.codigo} value={a.codigo}>{a.nombre}</option>
          ))}
        </select>

        {(filtros.busqueda || filtros.grupo || filtros.area) && (
          <button
            onClick={limpiarFiltros}
            className="px-3 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all"
          >
            Limpiar
          </button>
        )}

        <span className="text-white/30 text-sm ml-auto">
          {objetivosFiltrados.length} objetivo{objetivosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de objetivos */}
      {estado.loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : objetivosFiltrados.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Target className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-bold text-white/50 mb-2">Sin objetivos</h3>
          <p className="text-white/30 text-sm">Prueba cambiando los filtros</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {objetivosFiltrados.map((obj) => (
            <ObjetivoCardV2 key={obj.id} objetivo={obj} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObjetivosPageV2;
