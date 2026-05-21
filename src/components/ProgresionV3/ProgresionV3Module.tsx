import React, { useState } from 'react';
import { BarChart3, BookOpen, Eye, LayoutDashboard, Menu, Shield, Users } from 'lucide-react';
import V3AnalisisPage from './pages/V3AnalisisPage';
import V3BitacoraPage from './pages/V3BitacoraPage';
import V3DashboardPage from './pages/V3DashboardPage';
import V3PortalPadresPage from './pages/V3PortalPadresPage';
import V3ScoutsPage from './pages/V3ScoutsPage';
import { useProgresionV3Data } from './useProgresionV3Data';

type V3TabId = 'dashboard' | 'scouts' | 'bitacora' | 'analisis' | 'portal-padres';

interface V3Tab {
  id: V3TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: V3Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scouts', label: 'Scouts', icon: Users },
  { id: 'bitacora', label: 'Bitácora', icon: BookOpen },
  { id: 'analisis', label: 'Análisis', icon: BarChart3 },
  { id: 'portal-padres', label: 'Portal Padres', icon: Eye },
];

const ProgresionV3Module: React.FC = () => {
  const [activeTab, setActiveTab] = useState<V3TabId>('dashboard');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardStageFilter, setDashboardStageFilter] = useState('');
  const data = useProgresionV3Data();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <V3DashboardPage
            scouts={data.scouts}
            progressAverage={data.progressAverage}
            totalObjectives={data.totalObjectives}
            monthlyAchievements={data.monthlyAchievements}
            insights={data.insights}
            search={dashboardSearch}
            onSearchChange={setDashboardSearch}
            stageFilter={dashboardStageFilter}
            onStageFilterChange={setDashboardStageFilter}
          />
        );
      case 'scouts':
        return <V3ScoutsPage scouts={data.scouts} />;
      case 'bitacora':
        return <V3BitacoraPage scouts={data.scouts} entries={data.bitacoraEntries} insights={data.insights} />;
      case 'analisis':
        return (
          <V3AnalisisPage
            stageDistribution={data.stageDistribution}
            completionBars={data.completionBars}
            trendLabels={data.trendLabels}
            trendSeries={data.trendSeries}
            scouts={data.scouts}
            progressAverage={data.progressAverage}
            totalObjectives={data.totalObjectives}
          />
        );
      case 'portal-padres':
        return <V3PortalPadresPage scout={data.scouts[0]} events={data.events} announcements={data.announcements} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f5ef] text-slate-700">
      <div className="sticky top-0 z-20 border-b border-[#eadfd5] bg-[#fffdfa]/95 shadow-[0_6px_20px_rgba(100,70,30,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#daccbf] bg-white text-[#2f6a2d] shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-700">ScoutTracker</div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Progresión V3</div>
            </div>
          </div>

          <nav className="ml-4 hidden flex-1 items-center justify-center gap-2 lg:flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-[#2f6a2d] bg-[#2f6a2d] text-white shadow-[0_10px_24px_rgba(47,106,45,0.22)]'
                      : 'border-transparent bg-white text-slate-500 hover:border-[#e5d6c6] hover:bg-[#fff8f0] hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <div className="hidden rounded-full border border-[#e8dccf] bg-white px-5 py-2 text-sm font-semibold text-sky-500 md:block">
              Scout Leader
            </div>
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#eadfd5] bg-white text-slate-600 shadow-[0_8px_18px_rgba(70,45,20,0.10)] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto px-6 pb-4 lg:hidden">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-[#2f6a2d] bg-[#2f6a2d] text-white'
                      : 'border-[#eadfd5] bg-white text-slate-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {data.error ? (
          <div className="rounded-[28px] border border-[#eadfd5] bg-white px-8 py-10 text-xl text-red-500 shadow-[0_10px_30px_rgba(55,35,15,0.08)]">
            {data.error}
          </div>
        ) : data.loading ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-[28px] border border-[#eadfd5] bg-white" />
            ))}
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default ProgresionV3Module;