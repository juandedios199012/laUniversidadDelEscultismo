/**
 * GrowthAreasGrid V2 – Grilla de Áreas de Crecimiento con ProgressRing
 */
import React from 'react';
import { AREAS_LISTA } from '../config/etapasConfig';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';

interface AreaProgressData {
  area_codigo: string;
  completados: number;
  total: number;
  porcentaje: number;
}

interface GrowthAreasGridProps {
  progreso?: AreaProgressData[];
  onAreaClick?: (areaCodigo: string) => void;
  areaActiva?: string;
}

export const GrowthAreasGrid: React.FC<GrowthAreasGridProps> = ({
  progreso = [],
  onAreaClick,
  areaActiva,
}) => {
  const getProgreso = (codigo: string): AreaProgressData =>
    progreso.find((p) => p.area_codigo === codigo) ?? {
      area_codigo: codigo,
      completados: 0,
      total: 0,
      porcentaje: 0,
    };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {AREAS_LISTA.map((area, idx) => {
        const p = getProgreso(area.codigo);
        const isActive = areaActiva === area.codigo;

        return (
          <GlassCard
            key={area.codigo}
            hoverable={!!onAreaClick}
            glowColor={isActive ? area.color : undefined}
            onClick={() => onAreaClick?.(area.codigo)}
            className={`${isActive ? 'ring-1' : ''}`}
            style={{ borderColor: isActive ? `${area.color}60` : undefined } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              {/* Ring */}
              <ProgressRing
                percentage={p.porcentaje}
                size={68}
                strokeWidth={5}
                color={area.color}
              >
                <span className="text-xl">{area.icon}</span>
              </ProgressRing>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-sm mb-1 leading-tight"
                  style={{ color: area.color }}
                >
                  {area.nombre}
                </h3>
                <p className="text-xs text-white/40 mb-2 line-clamp-2 leading-relaxed">
                  {area.descripcion}
                </p>

                {/* Mini progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.porcentaje}%`,
                        background: area.color,
                        boxShadow: `0 0 4px ${area.color}`,
                        transition: 'width 1s ease-out',
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/40 font-mono whitespace-nowrap">
                    {p.completados}/{p.total}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
