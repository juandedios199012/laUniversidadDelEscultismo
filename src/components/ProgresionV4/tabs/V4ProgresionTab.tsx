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

// Grupos de objetivo: PISTA+SENDA comparten objetivos, RUMBO+TRAVESIA también
const GRUPOS_OBJETIVO = [
  {
    codigo: 'PISTA_SENDA',
    nombre: 'Grupo Pista & Senda',
    edades: '11–12 años',
    etapas: ['PISTA', 'SENDA'],
    color: '#4f8ddb',
  },
  {
    codigo: 'RUMBO_TRAVESIA',
    nombre: 'Grupo Rumbo & Travesía',
    edades: '13–14 años',
    etapas: ['RUMBO', 'TRAVESIA'],
    color: '#a855f7',
  },
];

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

      {/* Grupos de Objetivo — Etapas agrupadas */}
      <section>
        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
          Etapas de Progresión
        </h3>
        <p className="mb-5 text-xs text-gray-400">
          Las etapas se agrupan de a dos: cada grupo comparte el mismo conjunto de objetivos educativos.
        </p>
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <CardSkeleton className="h-44" />
              <CardSkeleton className="h-44" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CardSkeleton className="h-44" />
              <CardSkeleton className="h-44" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {GRUPOS_OBJETIVO.map((grupo) => {
              const totalGrupo = grupo.etapas.reduce(
                (sum, cod) => sum + (stageBars.find((b) => b.etapaCodigo === cod)?.totalScouts ?? 0),
                0,
              );
              return (
                <div key={grupo.codigo}>
                  {/* Group divider */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-100" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                        {grupo.nombre}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ background: grupo.color }}
                      >
                        Objetivos compartidos · {grupo.edades}
                      </span>
                      <span className="text-xs text-gray-400">{totalGrupo} scouts</span>
                    </div>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {grupo.etapas.map((codigo) => {
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
                </div>
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
