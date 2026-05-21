import React, { useState } from 'react';
import { BarChart3, Medal, RefreshCcw, RotateCcw, Target, Users } from 'lucide-react';
import { CompletionBarsChart, MonthlyTrendChart, StageDistributionChart } from '../V3Charts';
import { FilterField, PillButton, ResetButton, StatCard, Surface } from '../V3Primitives';
import type { V3BarMetric, V3ScoutSummary, V3StageDistributionItem, V3TrendSeries } from '../types';

interface V3AnalisisPageProps {
  stageDistribution: V3StageDistributionItem[];
  completionBars: V3BarMetric[];
  trendLabels: string[];
  trendSeries: V3TrendSeries[];
  scouts: V3ScoutSummary[];
  progressAverage: number;
  totalObjectives: number;
}

const V3AnalisisPage: React.FC<V3AnalisisPageProps> = ({
  stageDistribution,
  completionBars,
  trendLabels,
  trendSeries,
  scouts,
  progressAverage,
  totalObjectives,
}) => {
  const [subTab, setSubTab] = useState<'vista-general' | 'tendencias' | 'habilidades' | 'insights'>('vista-general');

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-6xl font-black tracking-tight text-slate-700">Análisis de Progresión</h1>
          <p className="mt-3 text-2xl text-slate-500">Visualización completa del desarrollo scout con insights impulsados por IA</p>
        </div>
        <div className="flex gap-3">
          <PillButton><RefreshCcw className="h-4 w-4" /></PillButton>
          <PillButton><RotateCcw className="h-4 w-4" /></PillButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <PillButton active={subTab === 'vista-general'} onClick={() => setSubTab('vista-general')}><BarChart3 className="h-4 w-4" />Vista General</PillButton>
        <PillButton active={subTab === 'tendencias'} onClick={() => setSubTab('tendencias')}><RefreshCcw className="h-4 w-4" />Tendencias</PillButton>
        <PillButton active={subTab === 'habilidades'} onClick={() => setSubTab('habilidades')}><Target className="h-4 w-4" />Habilidades</PillButton>
        <PillButton active={subTab === 'insights'} onClick={() => setSubTab('insights')}><Medal className="h-4 w-4" />Insights IA</PillButton>
      </div>

      <Surface className="p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-4xl font-black tracking-tight text-slate-700">Filtros de Análisis</h2>
          <ResetButton onClick={() => undefined} />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <FilterField label="Rango de Fechas" value="3m" onChange={() => undefined} options={[{ value: '3m', label: 'Últimos 3 meses' }, { value: '6m', label: 'Últimos 6 meses' }, { value: '12m', label: 'Último año' }]} />
          <FilterField label="Grupo Scout" value="todos" onChange={() => undefined} options={[{ value: 'todos', label: 'Todos los grupos' }]} />
          <FilterField label="Etapa" value="todas" onChange={() => undefined} options={[{ value: 'todas', label: 'Todas las etapas' }, ...stageDistribution.map((item) => ({ value: item.code, label: item.label }))]} />
          <FilterField label="Edad" value="todas" onChange={() => undefined} options={[{ value: 'todas', label: 'Todas las edades' }, { value: '11', label: '11 años' }, { value: '12', label: '12 años' }, { value: '13', label: '13 años' }, { value: '14', label: '14 años' }]} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <PillButton active><Target className="h-4 w-4" />Aplicar Filtros</PillButton>
          <PillButton><BarChart3 className="h-4 w-4" />Exportar Datos</PillButton>
        </div>
      </Surface>

      <div className="grid gap-5 lg:grid-cols-4">
        <StatCard icon={<Target className="h-7 w-7" />} label="Tasa de Completitud Promedio" value={`${progressAverage}%`} detail="Todos los objetivos" delta="+5.2%" />
        <StatCard icon={<RefreshCcw className="h-7 w-7" />} label="Tiempo Promedio de Progresión" value="8.3 meses" detail="Por etapa" delta="-0.8 meses" deltaTone="red" />
        <StatCard icon={<Users className="h-7 w-7" />} label="Scouts Activos" value={String(scouts.length)} detail="En todas las etapas" delta="+12" />
        <StatCard icon={<Medal className="h-7 w-7" />} label="Logros Totales" value={String(totalObjectives)} detail="Este trimestre" delta="+234" />
      </div>

      {(subTab === 'vista-general' || subTab === 'habilidades' || subTab === 'insights') ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <StageDistributionChart data={stageDistribution} />
          <CompletionBarsChart data={completionBars} />
        </div>
      ) : null}

      {(subTab === 'tendencias' || subTab === 'vista-general') ? (
        <MonthlyTrendChart labels={trendLabels} series={trendSeries} />
      ) : null}
    </div>
  );
};

export default V3AnalisisPage;