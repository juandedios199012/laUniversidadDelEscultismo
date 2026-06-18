import React from 'react';
import { Target, Users } from 'lucide-react';
import { ProgressRing } from '../shared/ui/ProgressRing';
import {
  AREA_COLORS,
  AREA_ICONS,
  STAGE_COLORS,
  STAGE_ICONS,
  type V4AreaData,
  type V4Scout,
  type V4StageBar,
} from './useProgresionData';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, color }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
      style={{ background: `${color}18`, color }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-2xl font-black tracking-tight text-gray-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

// ─── Stage Card (Las 4 Etapas) ────────────────────────────────────────────────
interface StageCardProps {
  etapaCodigo: string;
  etapaNombre: string;
  etapaIcono?: string;
  etapaColor?: string;
  edad?: number;
  totalScouts: number;
  promedioProgreso: number;
}

export const StageCard: React.FC<StageCardProps> = ({
  etapaCodigo,
  etapaNombre,
  etapaIcono,
  etapaColor,
  edad,
  totalScouts,
  promedioProgreso,
}) => {
  const color = etapaColor ?? STAGE_COLORS[etapaCodigo] ?? '#4f8ddb';
  const icon  = etapaIcono ?? STAGE_ICONS[etapaCodigo] ?? '📍';

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${color}40`, background: `${color}09` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
          style={{ background: `${color}20` }}
        >
          {icon}
        </div>
        {edad !== undefined && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: `${color}20`, color }}
          >
            {edad} años
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-gray-800">{etapaNombre}</h3>
      <div className="mt-3">
        <div className="mb-1.5 flex items-end gap-1">
          <span className="text-3xl font-black leading-none text-gray-800">{promedioProgreso}</span>
          <span className="mb-0.5 text-sm font-bold" style={{ color }}>%</span>
          <span className="mb-0.5 ml-auto text-xs text-gray-400">promedio</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(promedioProgreso, 3)}%`, background: color }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-sm">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="font-bold text-gray-800">{totalScouts}</span>
        <span className="text-gray-400">scouts</span>
      </div>
    </div>
  );
};

// ─── Area Card (Áreas de Crecimiento) ────────────────────────────────────────
interface AreaCardProps {
  area: V4AreaData;
}

export const AreaCard: React.FC<AreaCardProps> = ({ area }) => (
  <div
    className="flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md"
    style={{ borderColor: `${area.color}35`, background: `${area.color}0a` }}
  >
    <ProgressRing
      percentage={area.porcentaje}
      size={72}
      strokeWidth={7}
      color={area.color}
    >
      <span className="text-xl">{area.icon}</span>
    </ProgressRing>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-black" style={{ color: area.color }}>{area.nombre}</p>
      <p className="text-2xl font-black tracking-tight text-gray-800">{area.porcentaje}<span className="text-sm font-normal text-gray-400">%</span></p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${area.porcentaje}%`, background: area.color }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">{area.completados} / {area.total} objetivos</p>
    </div>
  </div>
);

// ─── Scout Card (tema claro V4) ──────────────────────────────────────────────
const MAX_AREAS_CARD = 3;

interface ScoutCardProps {
  scout: V4Scout;
  selected?: boolean;
  onClick?: () => void;
}

export const ScoutCard: React.FC<ScoutCardProps> = ({ scout, selected, onClick }) => {
  const color = scout.etapaColor ?? STAGE_COLORS[scout.etapaCodigo] ?? '#2563eb';
  const etapaIcon = scout.etapaIcono ?? STAGE_ICONS[scout.etapaCodigo] ?? '📍';

  const areasVisibles = (scout.areas ?? [])
    .filter((a) => a.total_objetivos > 0)
    .sort((a, b) => b.objetivos_completados - a.objetivos_completados)
    .slice(0, MAX_AREAS_CARD);

  const areasLoading = !scout.areas;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`group cursor-pointer rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        selected ? 'ring-2 shadow-md -translate-y-0.5' : 'border-gray-100'
      }`}
      style={selected ? { borderColor: color, ringColor: color } : undefined}
    >
      {/* Banda de color superior (etapa) — degradado del mismo tono: bajo → fuerte */}
      <div
        className="h-1.5 w-full rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}40, ${color})` }}
      />

      <div className="flex gap-4 p-4">
        {/* Anillo de progreso */}
        <div className="flex-shrink-0 self-center">
          <ProgressRing
            percentage={scout.progreso}
            size={80}
            strokeWidth={6}
            color={color}
          >
            <span className="text-sm font-black" style={{ color }}>
              {scout.progreso}%
            </span>
          </ProgressRing>
        </div>

        {/* Columna derecha */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Nombre + badges */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-black leading-tight text-gray-800">
              {scout.nombre}
            </h3>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
              style={{ background: `${color}18`, color }}
            >
              {etapaIcon} {scout.etapaNombre}
            </span>
          </div>

          {/* Patrulla + código */}
          {(scout.patrulla || scout.codigo) && (
            <p className="text-xs text-gray-400">
              {scout.patrulla && <span>{scout.patrulla}</span>}
              {scout.patrulla && scout.codigo && <span className="mx-1">·</span>}
              {scout.codigo && <span className="font-mono">{scout.codigo}</span>}
            </p>
          )}

          {/* Barras de áreas */}
          {areasLoading ? (
            <div className="space-y-1.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-5 animate-pulse rounded bg-gray-100" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-3 w-8 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : areasVisibles.length > 0 ? (
            <div className="space-y-1.5">
              {areasVisibles.map((area) => {
                const areaColor = AREA_COLORS[area.area_codigo] ?? area.area_color;
                const areaIcon = AREA_ICONS[area.area_codigo] ?? area.area_icono;
                const pct =
                  area.total_objetivos > 0
                    ? (area.objetivos_completados / area.total_objetivos) * 100
                    : 0;
                return (
                  <div key={area.area_id} className="flex items-center gap-2">
                    <span className="w-5 flex-shrink-0 text-center text-sm">{areaIcon}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: areaColor,
                        }}
                        />
                      </div>
                      <span className="w-8 flex-shrink-0 text-right font-mono text-xs text-gray-400">
                        {area.objetivos_completados}/{area.total_objetivos}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sin datos de áreas</p>
            )}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400">
              {scout.objetivosCompletados}/{scout.totalObjetivos} objetivos
            </span>
            <span
              className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color }}
            >
              Ver detalle →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
);
