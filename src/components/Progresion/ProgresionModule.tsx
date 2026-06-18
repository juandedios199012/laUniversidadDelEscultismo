import React, { useMemo, useState } from 'react';
import { BarChart3, LayoutDashboard, Shield, TrendingUp, Users } from 'lucide-react';
import { useProgresionData, AREA_COLORS, AREA_ICONS, AREA_NAMES } from './useProgresionData';
import { usePermissions } from '../../contexts/PermissionsContext';
import ProgresionTab from './tabs/ProgresionTab';
import ScoutsTab from './tabs/ScoutsTab';
import AnalisisTab from './tabs/AnalisisTab';
import DashboardTab from './tabs/DashboardTab';
import { RAMAS } from '../../services/progresionService';

type TabId = 'progresion' | 'scouts' | 'analisis' | 'dashboard';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'progresion', label: 'Progresión',  icon: TrendingUp },
  { id: 'scouts',     label: 'Scouts',      icon: Users },
  { id: 'analisis',   label: 'Análisis',    icon: BarChart3 },
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
];

const AREA_ORDER_LIST = ['CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD'];

const ProgresionModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('progresion');
  const [ramaActiva, setRamaActiva] = useState<string>('');
  const data = useProgresionData();

  // Filtrar scouts por rama seleccionada ('' = todas)
  const scoutsFiltrados = useMemo(
    () => ramaActiva ? data.scouts.filter((s) => s.rama === ramaActiva) : data.scouts,
    [data.scouts, ramaActiva],
  );

  // StageBars derivados de scoutsFiltrados (no del RPC global)
  const filteredStageBars = useMemo(() => {
    const map = new Map<string, { nombre: string; icono: string; color: string; count: number; sumProgreso: number }>();
    scoutsFiltrados.forEach((s) => {
      const prev = map.get(s.etapaCodigo) ?? {
        nombre: s.etapaNombre,
        icono: s.etapaIcono ?? '📍',
        color: s.etapaColor ?? '#888',
        count: 0, sumProgreso: 0,
      };
      prev.count++;
      prev.sumProgreso += s.progreso;
      map.set(s.etapaCodigo, prev);
    });
    return Array.from(map.entries()).map(([codigo, d]) => ({
      etapaCodigo: codigo,
      etapaNombre: d.nombre,
      etapaIcono: d.icono,
      etapaColor: d.color,
      totalScouts: d.count,
      promedioProgreso: d.count > 0 ? Math.round(d.sumProgreso / d.count) : 0,
    })).sort((a, b) => a.etapaCodigo.localeCompare(b.etapaCodigo));
  }, [scoutsFiltrados]);

  // GlobalAreas derivadas de scoutsFiltrados
  const filteredGlobalAreas = useMemo(() => {
    const agg: Record<string, { completados: number; total: number }> = {};
    scoutsFiltrados.forEach((s) => {
      (s.areas ?? []).forEach((a) => {
        if (!agg[a.area_codigo]) agg[a.area_codigo] = { completados: 0, total: 0 };
        agg[a.area_codigo].completados += a.objetivos_completados;
        agg[a.area_codigo].total += a.total_objetivos;
      });
    });
    return AREA_ORDER_LIST.map((codigo) => {
      const d = agg[codigo] ?? { completados: 0, total: 0 };
      return {
        codigo,
        nombre: AREA_NAMES[codigo] ?? codigo,
        color: AREA_COLORS[codigo] ?? '#888',
        icon: AREA_ICONS[codigo] ?? '●',
        completados: d.completados,
        total: d.total,
        porcentaje: d.total > 0 ? parseFloat(((d.completados / d.total) * 100).toFixed(1)) : 0,
      };
    });
  }, [scoutsFiltrados]);

  // KPIs filtrados
  const filteredTotalScouts = scoutsFiltrados.length;
  const filteredTotalCompletados = scoutsFiltrados.reduce((a, s) => a + s.objetivosCompletados, 0);
  const filteredTotalObj = scoutsFiltrados.reduce((a, s) => a + s.totalObjetivos, 0);
  const filteredPromedio = filteredTotalObj > 0
    ? parseFloat(((filteredTotalCompletados / filteredTotalObj) * 100).toFixed(1))
    : 0;

  const visibleTabs = TABS;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-6 py-3">
            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
                <Shield className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black tracking-tight text-gray-800">Progresión Scout</div>
                <div className="text-xs text-gray-400">v4 · Datos reales</div>
              </div>
            </div>

            {/* Selector de Rama */}
            <select
              value={ramaActiva}
              onChange={(e) => setRamaActiva(e.target.value)}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
            >
              <option value="">🌐 Todas las ramas</option>
              {RAMAS.map((r) => (
                <option key={r.codigo} value={r.codigo}>
                  {r.icono} {r.label}
                </option>
              ))}
            </select>

            {/* Tabs */}
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Status indicator */}
            {data.loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                Cargando…
              </div>
            )}
            {data.error && (
              <div className="text-xs text-red-500 shrink-0">⚠ Error al cargar</div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === 'progresion' && (
          <ProgresionTab
            loading={data.loading}
            totalScouts={filteredTotalScouts}
            promedioGlobal={filteredPromedio}
            totalCompletados={filteredTotalCompletados}
            etapasActivas={filteredStageBars.length}
            stageBars={filteredStageBars}
            globalAreas={filteredGlobalAreas}
            onReload={data.reload}
          />
        )}

        {activeTab === 'scouts' && (
          <ScoutsTab
            loading={data.loading}
            scouts={scoutsFiltrados}
            ramaActiva={ramaActiva}
            ramaLabel={RAMAS.find((r) => r.codigo === ramaActiva)?.label}
            onReload={data.reload}
          />
        )}

        {activeTab === 'analisis' && (
          <AnalisisTab
            loading={data.loading}
            stageBars={filteredStageBars}
            globalAreas={filteredGlobalAreas}
            totalScouts={filteredTotalScouts}
            promedioGlobal={filteredPromedio}
            ramaActiva={ramaActiva}
            ramaLabel={RAMAS.find((r) => r.codigo === ramaActiva)?.label}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            loading={data.loading}
            scouts={scoutsFiltrados}
            globalAreas={filteredGlobalAreas}
            stageBars={filteredStageBars}
            totalScouts={filteredTotalScouts}
            promedioGlobal={filteredPromedio}
            totalCompletados={filteredTotalCompletados}
            totalObj={filteredTotalObj}
          />
        )}
      </div>
    </div>
  );
};

export default ProgresionModule;
