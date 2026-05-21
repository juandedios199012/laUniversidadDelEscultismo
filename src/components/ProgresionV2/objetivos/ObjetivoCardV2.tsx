/**
 * ObjetivoCardV2 – Tarjeta expandible de objetivo educativo
 * Con color por área, indicadores como chips y badge de grupo
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { Objetivo } from '../../../services/progresionService';
import { GlassCard } from '../ui/GlassCard';
import { AREAS_CONFIG } from '../config/etapasConfig';

interface ObjetivoCardProps {
  objetivo: Objetivo;
}

export const ObjetivoCardV2: React.FC<ObjetivoCardProps> = ({ objetivo }) => {
  const [expanded, setExpanded] = useState(false);
  const areaConfig = AREAS_CONFIG[objetivo.area_codigo];
  const areaColor = areaConfig?.color ?? objetivo.area_color;

  return (
    <GlassCard
      hoverable
      onClick={() => setExpanded((p) => !p)}
      className="transition-all"
      glowColor={expanded ? areaColor : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Área icono */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5"
          style={{ background: `${areaColor}20` }}
        >
          {areaConfig?.icon ?? objetivo.area_icono}
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: `${areaColor}20`, color: areaColor }}
            >
              {objetivo.area_nombre}
            </span>
            {objetivo.grupo_codigo && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                {objetivo.grupo_nombre ?? objetivo.grupo_codigo}
              </span>
            )}
          </div>

          {/* Título */}
          <p className="text-sm font-medium text-white leading-snug">
            {objetivo.titulo}
          </p>

          {/* Código */}
          <div className="flex items-center gap-1 mt-1">
            <Hash className="w-3 h-3 text-white/30" />
            <span className="text-xs font-mono text-white/30">{objetivo.codigo}</span>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </div>

      {/* Indicadores expandidos */}
      {expanded && objetivo.indicadores && objetivo.indicadores.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
            Indicadores de logro
          </p>
          <div className="flex flex-wrap gap-2">
            {objetivo.indicadores.map((ind, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-lg text-xs leading-snug"
                style={{
                  background: `${areaColor}10`,
                  border: `1px solid ${areaColor}30`,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
