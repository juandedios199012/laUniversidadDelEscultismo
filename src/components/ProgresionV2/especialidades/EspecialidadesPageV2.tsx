/**
 * EspecialidadesPageV2 – Sub-módulo de Especialidades en diseño futurista
 * Tres vistas: Dashboard | Catálogo | Por Scout
 */
import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Star,
  Users,
  Award,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import EspecialidadesService from '../../../services/especialidadesService';
import {
  AreaEspecialidad,
  Especialidad,
  DashboardEspecialidades,
} from '../../../types/especialidades';
import { GlassCard } from '../ui/GlassCard';

// ─── Tipos de tab ────────────────────────────────────────────────────────────
type TabId = 'dashboard' | 'catalogo';

// ─── KPI pequeño ─────────────────────────────────────────────────────────────
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
      <p className="text-xs text-white/40 uppercase tracking-wider leading-tight">{label}</p>
      <p className="text-2xl font-black text-white leading-tight">{value}</p>
    </div>
  </GlassCard>
);

// ─── Tarjeta de área ──────────────────────────────────────────────────────────
const AreaCard: React.FC<{
  area: AreaEspecialidad;
  isActive: boolean;
  onClick: () => void;
}> = ({ area, isActive, onClick }) => (
  <GlassCard
    hoverable
    glowColor={isActive ? area.color : undefined}
    onClick={onClick}
    className={`${isActive ? 'ring-1' : ''}`}
    style={{ borderColor: isActive ? `${area.color}60` : undefined } as React.CSSProperties}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${area.color}20` }}
      >
        {area.icono}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: area.color }}>
          {area.nombre}
        </p>
        <p className="text-xs text-white/40">{area.total_especialidades ?? '?'} especialidades</p>
      </div>
    </div>
  </GlassCard>
);

// ─── Tarjeta de especialidad ──────────────────────────────────────────────────
const EspecialidadCard: React.FC<{ esp: Especialidad }> = ({ esp }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassCard hoverable onClick={() => setExpanded((p) => !p)} className="transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5"
            style={{ background: `${esp.area.color}20` }}
          >
            {esp.area.icono}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white text-sm">{esp.nombre}</p>
              <span
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ background: `${esp.area.color}20`, color: esp.area.color }}
              >
                {esp.area.nombre}
              </span>
              <span className="text-xs text-white/30">{esp.tiempo_estimado_dias}d</span>
            </div>
            <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">
              {esp.descripcion}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {[
            { label: '🔍 Exploración', content: esp.exploracion },
            { label: '🔧 Taller', content: esp.taller },
            { label: '🏆 Desafío', content: esp.desafio },
          ].map(({ label, content }) => (
            <div key={label}>
              <p className="text-xs font-bold text-white/60 mb-1">{label}</p>
              <p className="text-xs text-white/40 leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const EspecialidadesPageV2: React.FC = () => {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardEspecialidades | null>(null);
  const [areas, setAreas] = useState<AreaEspecialidad[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [areaFiltro, setAreaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, areasData] = await Promise.all([
        EspecialidadesService.obtenerDashboardEspecialidades(),
        EspecialidadesService.obtenerAreasEspecialidad(),
      ]);
      setDashboard(dash);
      setAreas(areasData);
    } catch {
      setError('No se pudieron cargar las especialidades');
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogo = async () => {
    try {
      const data = await EspecialidadesService.obtenerEspecialidades(
        areaFiltro as any || null,
        busqueda || null,
      );
      setEspecialidades(data);
    } catch {
      setEspecialidades([]);
    }
  };

  useEffect(() => {
    if (tab === 'catalogo') cargarCatalogo();
  }, [tab, areaFiltro, busqueda]);

  const stats = dashboard?.stats;

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'catalogo', label: 'Catálogo', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#060d1a] text-white p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #d500f9, #e040fb)' }}
            >
              Especialidades
            </span>
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Habilidades, técnicas y talentos scouts en 7 áreas
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg ${
              tab === t.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Especialidades"
              value={stats?.total_especialidades ?? '—'}
              icon={<Star className="w-5 h-5" />}
              color="#d500f9"
            />
            <KpiCard
              label="Scouts activos"
              value={stats?.scouts_con_especialidades ?? '—'}
              icon={<Users className="w-5 h-5" />}
              color="#00b0ff"
            />
            <KpiCard
              label="En progreso"
              value={stats?.en_progreso ?? '—'}
              icon={<TrendingUp className="w-5 h-5" />}
              color="#ffd600"
            />
            <KpiCard
              label="Completadas"
              value={stats?.completadas ?? '—'}
              icon={<Award className="w-5 h-5" />}
              color="#00e676"
            />
          </div>

          {/* Áreas */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
              Áreas de Especialidad
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {areas.map((area) => (
                  <AreaCard
                    key={area.id}
                    area={area}
                    isActive={false}
                    onClick={() => {
                      setAreaFiltro(area.codigo);
                      setTab('catalogo');
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Stats por área del dashboard */}
          {dashboard?.areas && dashboard.areas.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">
                Progreso por Área
              </h2>
              <div className="space-y-3">
                {dashboard.areas.map((area) => {
                  const pct = area.total_especialidades > 0
                    ? Math.round((area.completadas / area.asignadas) * 100) || 0
                    : 0;
                  return (
                    <GlassCard key={area.codigo} className="flex items-center gap-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `${area.color}20` }}
                      >
                        {area.icono}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-white">{area.nombre}</p>
                          <span className="text-xs text-white/40">
                            {area.completadas} / {area.asignadas}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: area.color,
                              boxShadow: `0 0 4px ${area.color}`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: area.color }}>
                        {pct}%
                      </span>
                    </GlassCard>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Catálogo tab */}
      {tab === 'catalogo' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Buscar especialidad…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-400/50 w-56"
              />
            </div>
            <select
              value={areaFiltro}
              onChange={(e) => setAreaFiltro(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-400/50 appearance-none"
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.codigo} value={a.codigo}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {/* Lista */}
          <div className="space-y-3">
            {especialidades.length === 0 ? (
              <GlassCard className="text-center py-16">
                <Star className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-white/50 mb-2">Sin resultados</h3>
                <p className="text-white/30 text-sm">Prueba cambiando los filtros</p>
              </GlassCard>
            ) : (
              especialidades.map((esp) => (
                <EspecialidadCard key={esp.id} esp={esp} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EspecialidadesPageV2;
