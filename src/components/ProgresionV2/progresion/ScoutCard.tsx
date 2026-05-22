/**
 * ScoutCard V2 – Tarjeta de scout con progreso visual
 * Diseño: anillo + nombre/etapa + barras por área + footer objetivos
 */
import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { ProgressRing } from '../ui/ProgressRing';
import { StageBadge } from '../ui/StageBadge';
import { ETAPAS_CONFIG, AREAS_CONFIG } from '../config/etapasConfig';
import type { ProgresoArea } from '../../../services/progresionService';

export interface ScoutCardData {
  scout_id: string;
  scout_nombre: string;
  rama: string;
  etapa_actual_codigo: string;
  porcentaje_completado: number;
  objetivos_completados: number;
  total_objetivos: number;
  /** Áreas de crecimiento con progreso (opcional, se carga en paralelo) */
  areas?: ProgresoArea[];
}

interface ScoutCardProps {
  scout: ScoutCardData;
  onClick?: (scoutId: string) => void;
}

// Cuántas áreas mostrar como máximo en la tarjeta
const MAX_AREAS = 3;

export const ScoutCard: React.FC<ScoutCardProps> = ({ scout, onClick }) => {
  const etapa = ETAPAS_CONFIG[scout.etapa_actual_codigo] ?? ETAPAS_CONFIG['PISTA'];

  // Tomar las primeras MAX_AREAS áreas con objetivos > 0
  const areasVisibles = (scout.areas ?? [])
    .filter((a) => a.total_objetivos > 0)
    .slice(0, MAX_AREAS);

  return (
    <GlassCard
      hoverable
      glowColor={etapa.color}
      onClick={() => onClick?.(scout.scout_id)}
      className="relative overflow-hidden"
    >
      {/* Brillo de fondo decorativo */}
      <div
        className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ background: etapa.color }}
      />

      <div className="flex gap-4 relative z-10">

        {/* ── Anillo de progreso ─────────────────────────────────── */}
        <div className="flex-shrink-0 self-center">
          <ProgressRing
            percentage={scout.porcentaje_completado}
            size={88}
            strokeWidth={6}
            color={etapa.color}
          >
            <span className="text-base font-black" style={{ color: etapa.color }}>
              {Math.round(scout.porcentaje_completado)}%
            </span>
          </ProgressRing>
        </div>

        {/* ── Columna derecha ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* Nombre */}
          <div>
            <h3 className="font-bold text-white text-base leading-tight truncate">
              {scout.scout_nombre}
            </h3>
            <div className="mt-1">
              <StageBadge etapaCodigo={scout.etapa_actual_codigo} size="sm" />
            </div>
          </div>

          {/* Barras de áreas */}
          {areasVisibles.length > 0 ? (
            <div className="space-y-1.5">
              {areasVisibles.map((area) => {
                const cfg = AREAS_CONFIG[area.area_codigo];
                const color = cfg?.color ?? area.area_color;
                const icon = cfg?.icon ?? area.area_icono;
                const pct = area.total_objetivos > 0
                  ? (area.objetivos_completados / area.total_objetivos) * 100
                  : 0;
                return (
                  <div key={area.area_id} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center flex-shrink-0">{icon}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: color,
                          boxShadow: `0 0 5px ${color}80`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/40 w-8 text-right flex-shrink-0">
                      {area.objetivos_completados}/{area.total_objetivos}
                    </span>
                  </div>
                );
              })}

              {/* Skeleton si aún no cargaron áreas */}
            </div>
          ) : (
            /* Barras skeleton mientras carga */
            <div className="space-y-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-4 rounded bg-white/10 animate-pulse" />
                  <div className="flex-1 h-2 rounded-full bg-white/10 animate-pulse" />
                  <div className="w-8 h-3 rounded bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Footer: objetivos + ver detalles */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-xs text-white/40">
              {scout.objetivos_completados} de {scout.total_objetivos} objetivos
            </span>
            <span
              className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
              style={{ color: etapa.color }}
            >
              Ver detalles →
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
