import React from 'react';
import { Award, RefreshCw, Target, TrendingUp, Users } from 'lucide-react';
import { StageCard, KpiCard, AreaCard, CardSkeleton } from '../ProgresionComponents';
import type { V4AreaData, V4StageBar } from '../useProgresionData';

interface ProgresionTabProps {
  loading: boolean;
  totalScouts: number;
  promedioGlobal: number;
  totalCompletados: number;
  etapasActivas: number;
  stageBars: V4StageBar[];
  globalAreas: V4AreaData[];
  onReload: () => void;
}

const ProgresionTab: React.FC<ProgresionTabProps> = ({
  loading,
  totalScouts,
  promedioGlobal,
  totalCompletados,
  etapasActivas,
  stageBars,
  globalAreas,
  onReload,
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800">Progresión Scout</h2>
          <p className="mt-1 text-sm text-gray-500">
            Seguimiento del crecimiento personal · {stageBars.length > 0 ? `${stageBars.length} etapas` : '6 áreas'}
          </p>
        </div>
        <button
          onClick={onReload}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <CardSkeleton className="h-24" />
            <CardSkeleton className="h-24" />
            <CardSkeleton className="h-24" />
            <CardSkeleton className="h-24" />
          </>
        ) : (
          <>
            <KpiCard
              icon={<Users className="h-5 w-5" />}
              label="Total Scouts"
              value={totalScouts}
              sub="Scouts activos"
              color="#4f8ddb"
            />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Promedio General"
              value={`${promedioGlobal}%`}
              sub="De progresión global"
              color="#27c664"
            />
            <KpiCard
              icon={<Target className="h-5 w-5" />}
              label="Objetivos Logrados"
              value={totalCompletados}
              sub="Completados en total"
              color="#f59e0b"
            />
            <KpiCard
              icon={<Award className="h-5 w-5" />}
              label="Etapas Activas"
              value={etapasActivas}
              sub="Con scouts asignados"
              color="#a855f7"
            />
          </>
        )}
      </div>

      {/* Etapas de Progresión — cards dinámicas desde stageBars */}
      <section>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
          Etapas de Progresión
        </h3>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-44" />)}
          </div>
        ) : stageBars.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stageBars.map((stage) => (
              <StageCard
                key={stage.etapaCodigo}
                etapaCodigo={stage.etapaCodigo}
                etapaNombre={stage.etapaNombre}
                etapaIcono={stage.etapaIcono}
                etapaColor={stage.etapaColor}
                totalScouts={stage.totalScouts}
                promedioProgreso={stage.promedioProgreso}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
            <p className="text-sm font-semibold text-gray-500">Sin datos de etapas</p>
            <p className="mt-1 text-xs text-gray-400">Selecciona una rama para ver sus etapas</p>
          </div>
        )}
      </section>

      {/* Áreas de Crecimiento */}
      <section>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
          Áreas de Crecimiento
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {globalAreas.map((area) => (
                <AreaCard key={area.codigo} area={area} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ProgresionTab;
