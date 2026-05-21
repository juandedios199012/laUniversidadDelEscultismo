/**
 * StageTimeline V2 – Línea de tiempo de etapas scout
 * Diseño futurista con glow, animaciones y datos reales
 */
import React from 'react';
import { ETAPAS_LISTA } from '../config/etapasConfig';
import { GlassCard } from '../ui/GlassCard';

interface StageTimelineProps {
  estadisticas?: Array<{
    etapa_codigo: string;
    total_scouts: number;
    promedio_progreso: number;
  }>;
  onEtapaClick?: (codigo: string) => void;
  etapaActiva?: string;
}

export const StageTimeline: React.FC<StageTimelineProps> = ({
  estadisticas = [],
  onEtapaClick,
  etapaActiva,
}) => {
  const getStats = (codigo: string) =>
    estadisticas.find((e) => e.etapa_codigo === codigo);

  return (
    <div className="relative">
      {/* Línea vertical conectora */}
      <div
        className="absolute left-[31px] top-6 bottom-6 w-0.5"
        style={{
          background: 'linear-gradient(to bottom, #00e5ff, #00e676, #ffd600, #e040fb)',
          opacity: 0.4,
        }}
      />

      <div className="space-y-4">
        {ETAPAS_LISTA.map((etapa, idx) => {
          const stats = getStats(etapa.codigo);
          const isActive = etapaActiva === etapa.codigo;

          return (
            <GlassCard
              key={etapa.codigo}
              hoverable={!!onEtapaClick}
              glowColor={isActive ? etapa.color : undefined}
              className={`pl-16 relative transition-all ${isActive ? 'ring-1' : ''}`}
              style={{ borderColor: isActive ? `${etapa.color}60` : undefined } as React.CSSProperties}
              onClick={() => onEtapaClick?.(etapa.codigo)}
            >
              {/* Indicador circular */}
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg z-10"
                style={{
                  background: etapa.color,
                  boxShadow: `0 0 20px ${etapa.color}60`,
                }}
              >
                {etapa.icon}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3
                      className="font-bold text-lg leading-tight"
                      style={{ color: etapa.color }}
                    >
                      {etapa.nombre}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: `${etapa.color}20`, color: etapa.color }}
                    >
                      {etapa.edadMin}–{etapa.edadMax} años
                    </span>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
                    {etapa.descripcion}
                  </p>
                </div>

                {/* Mini stats */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="text-2xl font-black"
                    style={{ color: etapa.color }}
                  >
                    {stats?.total_scouts ?? '—'}
                  </div>
                  <div className="text-xs text-white/40">scouts</div>
                  {stats && (
                    <div className="text-xs mt-1" style={{ color: etapa.color }}>
                      {Math.round(stats.promedio_progreso)}% prom.
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              {stats && (
                <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${stats.promedio_progreso}%`,
                      background: etapa.color,
                      boxShadow: `0 0 6px ${etapa.color}`,
                    }}
                  />
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
