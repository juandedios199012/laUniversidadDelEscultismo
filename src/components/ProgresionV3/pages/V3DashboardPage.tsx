import React from 'react';
import { Award, BarChart3, Brain, Plus, RefreshCcw, Target, Users } from 'lucide-react';
import { StagePill, StatCard, Surface, SearchField, FilterField, PillButton, ProgressBar } from '../V3Primitives';
import type { V3InsightCard, V3ScoutSummary } from '../types';

interface V3DashboardPageProps {
  scouts: V3ScoutSummary[];
  progressAverage: number;
  totalObjectives: number;
  monthlyAchievements: number;
  insights: V3InsightCard[];
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
}

const ScoutDashboardCard: React.FC<{ scout: V3ScoutSummary }> = ({ scout }) => (
  <Surface className="flex items-center gap-4 p-4">
    {/* Avatar */}
    <div className="relative shrink-0">
      <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-[#eef3ea] text-3xl font-black text-slate-400 ring-2 ring-[#e4dcd2]">
        {scout.photoUrl ? <img src={scout.photoUrl} alt={scout.fullName} className="h-full w-full object-cover" /> : scout.firstName[0]}
      </div>
      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white" style={{ background: scout.stageAccent }} />
    </div>
    {/* Content */}
    <div className="min-w-0 flex-1">
      <span className="mb-1 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-white" style={{ background: scout.stageAccent }}>
        {scout.stageName}
      </span>
      <h3 className="truncate text-sm font-bold leading-tight text-slate-800">{scout.fullName}</h3>
      <p className="mt-0.5 truncate text-xs text-slate-500">{scout.age} años • {scout.patrol}</p>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[0.68rem] font-semibold text-slate-500">
          <span>Progreso General</span>
          <span>{scout.progress}%</span>
        </div>
        <ProgressBar value={scout.progress} className="h-1.5" />
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[0.68rem] text-slate-500">
        <span>{scout.achievements} logros</span>
        <span>{scout.objectivesCompleted} objetivos</span>
      </div>
    </div>
  </Surface>
);

const InsightPanel: React.FC<{ insights: V3InsightCard[] }> = ({ insights }) => (
  <Surface className="p-6 lg:p-8">
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2f6a2d] to-[#58a9ea] text-white">
        <Brain className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-3xl font-black tracking-tight text-slate-700">Insights de IA</h3>
        <p className="text-lg text-slate-500">Recomendaciones inteligentes para tu tropa</p>
      </div>
    </div>
    <div className="mt-8 space-y-5">
      {insights.map((insight) => (
        <div key={insight.id} className={`rounded-[26px] border border-[#d9d1ff] bg-gradient-to-r ${insight.gradient} px-8 py-7`}>
          <h4 className="text-2xl font-black tracking-tight text-slate-700">{insight.title}</h4>
          <p className="mt-3 max-w-lg text-xl leading-9 text-slate-500">{insight.body}</p>
          <div className="mt-5 text-2xl font-semibold text-[#2f6a2d]">{insight.action}</div>
        </div>
      ))}
    </div>
  </Surface>
);

const V3DashboardPage: React.FC<V3DashboardPageProps> = ({
  scouts,
  progressAverage,
  totalObjectives,
  monthlyAchievements,
  insights,
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
}) => {
  const filteredScouts = scouts.filter((scout) => {
    const matchesSearch = !search || scout.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesStage = !stageFilter || scout.stageCode === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-6xl font-black tracking-tight text-slate-700">Panel de Control</h1>
          <p className="mt-3 text-2xl text-slate-500">Gestiona y monitorea el progreso de tu tropa con insights de IA</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PillButton active><Plus className="h-4 w-4" />Agregar Scout</PillButton>
          <PillButton><RefreshCcw className="h-4 w-4" />Actualizar Progreso</PillButton>
          <PillButton><BarChart3 className="h-4 w-4" />Ver Análisis</PillButton>
          <PillButton><Users className="h-4 w-4" />Portal Padres</PillButton>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <StatCard icon={<Users className="h-7 w-7" />} label="Total Scouts" value={String(scouts.length)} detail="Scouts activos" delta="+12%" />
        <StatCard icon={<Award className="h-7 w-7" />} label="Logros Este Mes" value={String(monthlyAchievements)} detail="Progreso reciente" delta="+28%" />
        <StatCard icon={<BarChart3 className="h-7 w-7" />} label="Progreso Promedio" value={`${progressAverage}%`} detail="Seguimiento general" delta="+5%" />
        <StatCard icon={<Target className="h-7 w-7" />} label="Objetivos Activos" value={String(totalObjectives)} detail="Todos los scouts" delta="+15%" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.85fr_0.95fr]">
        <div className="space-y-6">
          <Surface className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-700">Filtros</h2>
                <p className="mt-1 text-lg text-slate-500">{filteredScouts.length} scouts encontrados</p>
              </div>
              <PillButton><RefreshCcw className="h-4 w-4" />Restablecer</PillButton>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-4">
              <SearchField value={search} onChange={onSearchChange} placeholder="Buscar por nombre..." />
              <FilterField
                label=""
                value={stageFilter}
                onChange={onStageFilterChange}
                options={[
                  { value: '', label: 'Todas las etapas' },
                  { value: 'PISTA', label: 'Pista' },
                  { value: 'SENDA', label: 'Senda' },
                  { value: 'RUMBO', label: 'Rumbo' },
                  { value: 'TRAVESIA', label: 'Travesía' },
                ]}
              />
              <FilterField label="" value="todos" onChange={() => undefined} options={[{ value: 'todos', label: 'Todos los niveles' }]} />
              <FilterField label="" value="actividad" onChange={() => undefined} options={[{ value: 'actividad', label: 'Toda la actividad' }]} />
            </div>
          </Surface>

          <Surface className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-4xl font-black tracking-tight text-slate-700">Scouts de la Tropa</h2>
              <span className="text-2xl font-semibold text-slate-500">{filteredScouts.length} de {scouts.length} Scouts</span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredScouts.slice(0, 8).map((scout) => (
                <ScoutDashboardCard key={scout.id} scout={scout} />
              ))}
            </div>
          </Surface>
        </div>

        <InsightPanel insights={insights} />
      </div>
    </div>
  );
};

export default V3DashboardPage;