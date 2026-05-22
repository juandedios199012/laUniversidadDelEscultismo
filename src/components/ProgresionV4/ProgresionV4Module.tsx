import React, { useState } from 'react';
import { BarChart3, LayoutDashboard, Lock, Shield, TrendingUp, Users, Eye } from 'lucide-react';
import { useProgresionV4Data } from './useProgresionV4Data';
import { usePermissions } from '../../contexts/PermissionsContext';
import V4ProgresionTab from './tabs/V4ProgresionTab';
import V4ScoutsTab from './tabs/V4ScoutsTab';
import V4AnalisisTab from './tabs/V4AnalisisTab';
import V4PortalPadresTab from './tabs/V4PortalPadresTab';
import V4DashboardTab from './tabs/V4DashboardTab';

type TabId = 'progresion' | 'scouts' | 'analisis' | 'dashboard' | 'portal-padres';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'progresion',    label: 'Progresión',    icon: TrendingUp },
  { id: 'scouts',        label: 'Scouts',        icon: Users },
  { id: 'analisis',      label: 'Análisis',      icon: BarChart3 },
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'portal-padres', label: 'Portal Padres', icon: Eye },
];

const ProgresionV4Module: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('progresion');
  const data = useProgresionV4Data();
  const { puedeAcceder } = usePermissions();

  const visibleTabs = TABS.filter(
    (tab) => tab.id !== 'portal-padres' || puedeAcceder('portal_padres'),
  );

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
          <V4ProgresionTab
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
          <V4ScoutsTab
            loading={data.loading}
            scouts={data.scouts}
            onReload={data.reload}
          />
        )}

        {activeTab === 'analisis' && (
          <V4AnalisisTab
            loading={data.loading}
            stageBars={data.stageBars}
            globalAreas={data.globalAreas}
            totalScouts={data.totalScouts}
            promedioGlobal={data.promedioGlobal}
          />
        )}

        {activeTab === 'dashboard' && (
          <V4DashboardTab
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

        {activeTab === 'portal-padres' && (
          puedeAcceder('portal_padres') ? (
            <V4PortalPadresTab
              loading={data.loading}
              scouts={data.scouts}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Lock className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">Acceso Restringido</h3>
              <p className="text-sm text-gray-400">No tienes permiso para ver el Portal de Padres.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ProgresionV4Module;
