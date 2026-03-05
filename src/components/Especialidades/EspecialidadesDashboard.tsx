// ============================================================================
// DASHBOARD DE ESPECIALIDADES SCOUT
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp,
  ChevronRight,
  Search
} from 'lucide-react';
import EspecialidadesService from '../../services/especialidadesService';
import type { 
  DashboardEspecialidades, 
  AreaStats 
} from '../../types/especialidades';
import { AREA_GRADIENTS, AreaId } from '../../types/especialidades';

interface EspecialidadesDashboardProps {
  onNavigate?: (view: string, params?: Record<string, unknown>) => void;
  onNavigateGlobal?: (module: string) => void;
}

export default function EspecialidadesDashboard({ onNavigate, onNavigateGlobal }: EspecialidadesDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardEspecialidades | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      const data = await EspecialidadesService.obtenerDashboardEspecialidades();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando especialidades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={cargarDashboard}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const { stats, areas } = dashboard;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          🏅 Sistema de Especialidades
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gestiona, registra y da seguimiento a las especialidades de cada Scout.
          Basado en el Manual de Especialidades — Scouts del Perú.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Especialidades"
          value={stats.total_especialidades}
          icon={BookOpen}
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          label="Scouts Activos"
          value={stats.scouts_con_especialidades}
          icon={Users}
          gradient="from-green-500 to-emerald-500"
        />
        <MetricCard
          label="Asignaciones"
          value={stats.total_asignaciones}
          icon={Award}
          gradient="from-purple-500 to-pink-500"
        />
        <MetricCard
          label="En Progreso"
          value={stats.en_progreso}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
        />
        <MetricCard
          label="Completadas"
          value={stats.completadas}
          icon={CheckCircle}
          gradient="from-emerald-500 to-green-600"
        />
      </div>

      {/* Acciones Rápidas */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onNavigate?.('catalogo')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Search className="w-5 h-5" />
          Ver Catálogo
        </button>
        <button
          onClick={() => onNavigate?.('seguimiento')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <TrendingUp className="w-5 h-5" />
          Seguimiento
        </button>
        <button
          onClick={() => onNavigateGlobal?.('reportes')}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all group"
        >
          <span className="group-hover:scale-110 transition-transform">📊</span>
          Ir a Reportes
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Áreas de Especialidad */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Áreas de Especialidades
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <AreaCard
              key={area.codigo}
              area={area}
              onClick={() => onNavigate?.('catalogo', { area: area.codigo })}
            />
          ))}
        </div>
      </section>

      {/* Actividad Reciente */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📈 Resumen de Progreso
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-600">
              {stats.total_asignaciones > 0 
                ? Math.round((stats.completadas / stats.total_asignaciones) * 100) 
                : 0}%
            </div>
            <p className="text-sm text-blue-700 mt-1">Tasa de Completado</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">
              {stats.completadas}
            </div>
            <p className="text-sm text-green-700 mt-1">Insignias Otorgadas</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <div className="text-3xl font-bold text-amber-600">
              {stats.en_progreso}
            </div>
            <p className="text-sm text-amber-700 mt-1">En Desarrollo</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

function MetricCard({ label, value, icon: Icon, gradient }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

interface AreaCardProps {
  area: AreaStats;
  onClick: () => void;
}

function AreaCard({ area, onClick }: AreaCardProps) {
  const gradient = AREA_GRADIENTS[area.codigo as AreaId] || 'from-gray-500 to-gray-600';
  const porcentaje = area.asignadas > 0 
    ? Math.round((area.completadas / area.asignadas) * 100) 
    : 0;

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-xl p-5 text-left text-white transition-all hover:scale-[1.02] hover:shadow-xl w-full`}
    >
      <div className="flex justify-between items-start">
        <div className="text-3xl mb-2">{area.icono}</div>
        <ChevronRight className="w-5 h-5 opacity-70" />
      </div>
      <h3 className="font-bold text-lg mb-1">{area.nombre}</h3>
      <p className="text-sm opacity-90 mb-3">
        {area.total_especialidades} especialidades
      </p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="opacity-80">Progreso</span>
          <span className="font-medium">{porcentaje}%</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-80">
          <span>{area.asignadas} asignadas</span>
          <span>{area.completadas} completadas</span>
        </div>
      </div>
    </button>
  );
}
