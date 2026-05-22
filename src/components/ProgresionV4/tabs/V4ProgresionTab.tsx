import React from 'react';
import { Award, RefreshCw, Target, TrendingUp, Users } from 'lucide-react';
import { StageCard, KpiCard, AreaCard, CardSkeleton } from '../V4Components';
import { STAGE_COLORS } from '../useProgresionV4Data';
import type { V4AreaData, V4StageBar } from '../useProgresionV4Data';

// Etapas: 1 edad por etapa (no rango)
const ETAPAS_META: Record<string, { edad: number; nombre: string }> = {
  PISTA:    { edad: 11, nombre: 'Pista' },
  SENDA:    { edad: 12, nombre: 'Senda' },
  RUMBO:    { edad: 13, nombre: 'Rumbo' },
  TRAVESIA: { edad: 14, nombre: 'Travesía' },
};

// Etapas en orden canónico para layout plano
const ETAPAS_ORDEN = ['PISTA', 'SENDA', 'RUMBO', 'TRAVESIA'] as const;

interface V4ProgresionTabProps {
  loading: boolean;
  totalScouts: number;
  promedioGlobal: number;
  totalCompletados: number;
  etapasActivas: number;
  stageBars: V4StageBar[];
  globalAreas: V4AreaData[];
  onReload: () => void;
}

const V4ProgresionTab: React.FC<V4ProgresionTabProps> = ({
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
            Seguimiento del crecimiento personal en 4 etapas y 6 áreas
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

      {/* Etapas de Progresión — 4 cards horizontales */}
      <section>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
          Etapas de Progresión
        </h3>
        <p className="mb-5 text-xs text-gray-400">
          Cada etapa corresponde a una edad. PISTA &amp; SENDA comparten objetivos; RUMBO &amp; TRAVESÍA también.
        </p>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-44" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {ETAPAS_ORDEN.map((codigo) => {
              const meta = ETAPAS_META[codigo];
              const stats = stageBars.find((b) => b.etapaCodigo === codigo);
              return (
                <StageCard
                  key={codigo}
                  etapaCodigo={codigo}
                  etapaNombre={meta.nombre}
                  edad={meta.edad}
                  totalScouts={stats?.totalScouts ?? 0}
                  promedioProgreso={stats?.promedioProgreso ?? 0}
                />
              );
            })}
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

export default V4ProgresionTab;
