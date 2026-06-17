import React, { useState } from 'react';
import { BarChart3, LayoutDashboard, Shield, TrendingUp, Users } from 'lucide-react';
import { useProgresionDataV2 } from './useProgresionDataV2';
import { RAMAS, RamaCodigo } from '../../services/progresionService';
import ProgresionTab from './tabs/ProgresionTab';
import ScoutsTab from './tabs/ScoutsTab';
import AnalisisTab from './tabs/AnalisisTab';
import DashboardTab from './tabs/DashboardTab';

type TabId = 'progresion' | 'scouts' | 'analisis' | 'dashboard';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'progresion', label: 'Progresión',  icon: TrendingUp },
  { id: 'scouts',     label: 'Scouts',      icon: Users },
  { id: 'analisis',   label: 'Análisis',    icon: BarChart3 },
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
];

const ProgresionModuleV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('progresion');
  const [ramaActiva, setRamaActiva] = useState<RamaCodigo>('TROPA');

  const data = useProgresionDataV2(ramaActiva);
  const ramaInfo = RAMAS.find((r) => r.codigo === ramaActiva)!;

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
                <div className="text-xs text-gray-400">v5 · Multi-rama</div>
              </div>
            </div>

            {/* Selector de rama */}
            <div className="flex items-center gap-1 shrink-0">
              {RAMAS.map((r) => (
                <button
                  key={r.codigo}
                  type="button"
                  onClick={() => setRamaActiva(r.codigo)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    ramaActiva === r.codigo
                      ? `bg-gradient-to-r ${r.color} text-white shadow`
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <span>{r.icono}</span>
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              ))}
            </div>

            {/* Tabs */}
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => {
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
            ramaLabel={ramaInfo.label}
          />
        )}

        {activeTab === 'analisis' && (
          <AnalisisTab
            loading={data.loading}
            stageBars={data.stageBars}
            globalAreas={data.globalAreas}
            totalScouts={data.totalScouts}
            promedioGlobal={data.promedioGlobal}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            loading={data.loading}
            scouts={data.scouts}
            globalAreas={data.globalAreas}
            stageBars={data.stageBars}
            totalScouts={data.totalScouts}
            promedioGlobal={data.promedioGlobal}
            totalCompletados={data.totalCompletados}
            totalObj={data.totalObj}
          />
        )}
      </div>
    </div>
  );
};

export default ProgresionModuleV2;
