import React, { useEffect, useState } from 'react';
import { BarChart, LineChart } from '@tremor/react';
import {
  PieChart as RechartsPieChart, Pie, Cell,
  Tooltip as RechartsTooltip, ResponsiveContainer, Label,
} from 'recharts';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import ProgresionService, { type TendenciaProgresionMensual } from '../../../services/progresionService';
import { CardSkeleton, KpiCard } from '../ProgresionComponents';
import { AREA_COLORS, type V4AreaData, type V4StageBar } from '../useProgresionData';

// ─── Constantes ───────────────────────────────────────────────────────────────
// Colores de paleta para etapas dinámicas (hasta 8)
const DYNAMIC_PALETTE = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a855f7'];
const STAGE_ORDER = ['PISTA', 'SENDA', 'RUMBO', 'TRAVESIA'];
const STAGE_TREMOR_MAP: Record<string, string> = { PISTA: 'blue', SENDA: 'green', RUMBO: 'amber', TRAVESIA: 'violet' };

const AREA_ORDER = ['CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD'];

const PERIODS = [
  { value: 3,  label: '3 meses' },
  { value: 6,  label: '6 meses' },
  { value: 8,  label: '8 meses' },
  { value: 12, label: '1 año' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type SubTab = 'general' | 'tendencias';

interface AnalisisTabProps {
  loading: boolean;
  stageBars: V4StageBar[];
  globalAreas: V4AreaData[];
  totalScouts: number;
  promedioGlobal: number;
  ramaActiva?: string;
  ramaLabel?: string;
}

const AnalisisTab: React.FC<AnalisisTabProps> = ({
  loading,
  stageBars,
  globalAreas,
  totalScouts,
  promedioGlobal,
  ramaLabel,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('general');
  const [period, setPeriod] = useState(8);
  const [trendRows, setTrendRows] = useState<TendenciaProgresionMensual[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Etapas dinámicas desde stageBars (fallback a STAGE_ORDER si vacío)
  const stageList = stageBars.length > 0 ? stageBars : STAGE_ORDER.map((c) => ({ etapaCodigo: c, etapaNombre: c, etapaIcono: undefined, etapaColor: undefined, totalScouts: 0, promedioProgreso: 0 }));
  const [selectedEtapas, setSelectedEtapas] = useState<Set<string>>(new Set(stageList.map((s) => s.etapaCodigo)));

  // Sincronizar selectedEtapas cuando cambian las etapas disponibles (por cambio de rama)
  useEffect(() => {
    const codes = stageBars.length > 0 ? stageBars.map((s) => s.etapaCodigo) : STAGE_ORDER;
    setSelectedEtapas(new Set(codes));
  }, [stageBars]);

  useEffect(() => {
    if (subTab !== 'tendencias') return;
    let mounted = true;
    setLoadingTrends(true);
    ProgresionService.obtenerTendenciasProgresionMensual(period)
      .then((rows) => {
        if (!mounted) return;
        setTrendRows(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setTrendRows([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingTrends(false);
      });

    return () => {
      mounted = false;
    };
  }, [period, subTab]);

  const toggleEtapa = (code: string) => {
    setSelectedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size === 1) return next; // keep at least one active
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // ── Donut data – dynamic from stageBars ─────────────────────────────────
  const donutData = stageList
    .filter((s) => s.totalScouts > 0)
    .map((s, i) => ({
      name: s.etapaNombre,
      value: s.totalScouts,
      color: s.etapaColor ?? DYNAMIC_PALETTE[i % DYNAMIC_PALETTE.length],
    }));

  // ── Bar data – always show all 6 areas ──────────────────────────────────
  const orderedAreas = AREA_ORDER
    .map((c) => globalAreas.find((a) => a.codigo === c))
    .filter(Boolean) as V4AreaData[];
  const barData = orderedAreas.map((area) => ({
    area: area.nombre,
    '% Completado': area.porcentaje,
    completados: area.completados,
    total: area.total,
  }));

  // ── Trend data (RPC real) ────────────────────────────────────────────────
  const stageNameMap = new Map(stageList.map((s) => [s.etapaCodigo, s.etapaNombre]));
  const monthMap = new Map<string, Record<string, string | number>>();
  trendRows.forEach((row) => {
    if (!selectedEtapas.has(row.etapa_codigo)) return;
    const key = row.mes;
    const item = monthMap.get(key) ?? { mes: row.mes_label };
    const label = stageNameMap.get(row.etapa_codigo) ?? row.etapa_nombre;
    item[label] = Math.round(row.promedio_progreso ?? 0);
    monthMap.set(key, item);
  });

  const trendData = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => value);

  const activeSeries = stageList.filter((s) => selectedEtapas.has(s.etapaCodigo)).map((s) => stageNameMap.get(s.etapaCodigo) ?? s.etapaNombre);
  const activeColors = stageList.filter((s) => selectedEtapas.has(s.etapaCodigo)).map((s, i) => STAGE_TREMOR_MAP[s.etapaCodigo] ?? ['blue','green','amber','violet','red','cyan','orange','purple'][i % 8]);

  const pctFmt = (v: number) => `${v}%`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-gray-800">Análisis de Progresión</h2>
        <p className="mt-1 text-sm text-gray-500">
          {ramaLabel ? `Rama: ${ramaLabel} · ` : 'Todas las ramas · '}
          Visualización con gráficos interactivos del desarrollo scout
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 rounded-xl border border-gray-100 bg-white p-1 shadow-sm w-fit">
        {([
          { id: 'general' as const,    label: 'Vista General', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'tendencias' as const, label: 'Tendencias',    icon: <TrendingUp className="h-4 w-4" /> },
        ]).map((tab) => (
          <button key={tab.id} type="button" onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              subTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? [...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-24" />) : (
          <>
            <KpiCard icon={<BarChart3 className="h-5 w-5" />} label="Scouts Analizados" value={totalScouts} color="#3b82f6" />
            <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Promedio Global" value={`${promedioGlobal}%`} color="#22c55e" />
            <KpiCard icon={<PieChart className="h-5 w-5" />} label="Etapas con Scouts" value={stageBars.filter((s) => s.totalScouts > 0).length} color="#f59e0b" />
            <KpiCard icon={<BarChart3 className="h-5 w-5" />} label="Áreas Evaluadas" value={globalAreas.length} color="#8b5cf6" />
          </>
        )}
      </div>

      {/* ── VISTA GENERAL ─────────────────────────────────────────────────── */}
      {subTab === 'general' && (
        <div className="space-y-6">

          {/* Donut — full width, legend on the right */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-black text-gray-800">Distribución por Etapa</h3>
            <p className="mb-4 text-xs text-gray-400">Cantidad de scouts por etapa de progresión</p>
            {loading ? <CardSkeleton className="h-72" /> : (
              <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
                {/* Donut (recharts — tooltip cerca del cursor, sin solapamiento) */}
                <div className="w-full max-w-sm shrink-0">
                  <ResponsiveContainer width="100%" height={288}>
                    <RechartsPieChart>
                      <Pie
                        data={donutData.length > 0 ? donutData : [{ name: 'Sin datos', value: 1 }]}
                        cx="50%" cy="50%"
                        innerRadius={72} outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={700}
                      >
                        {(donutData.length > 0 ? donutData : [{ name: 'Sin datos', value: 1, color: '#d1d5db' }]).map((entry, i) => (
                          <Cell key={entry.name} fill={'color' in entry ? (entry as any).color : '#d1d5db'} />
                        ))}
                        <Label
                          content={({ viewBox }: any) => {
                            const { cx, cy } = viewBox;
                            return (
                              <g>
                                <text x={cx} y={cy - 6} textAnchor="middle" fill="#111827"
                                  fontSize={24} fontWeight={800} fontFamily="sans-serif">
                                  {totalScouts}
                                </text>
                                <text x={cx} y={cy + 16} textAnchor="middle" fill="#9ca3af"
                                  fontSize={11} fontFamily="sans-serif">
                                  scouts
                                </text>
                              </g>
                            );
                          }}
                          position="center"
                        />
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }: any) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0];
                          const entry = donutData.find((e) => e.name === d.name);
                          const hex = entry ? entry.color : '#888';
                          return (
                            <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-lg text-xs min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: hex }} />
                                <span className="font-bold text-gray-700">{d.name}</span>
                              </div>
                              <p className="mt-1 pl-4 text-gray-500">{d.value} scouts</p>
                            </div>
                          );
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom legend with bars */}
                <div className="flex-1 space-y-4 self-center w-full">
                  {stageList.map((stage, i) => {
                    const scouts = stage.totalScouts;
                    const pct = totalScouts > 0 ? Math.round((scouts / totalScouts) * 100) : 0;
                    const hex = stage.etapaColor ?? DYNAMIC_PALETTE[i % DYNAMIC_PALETTE.length];
                    return (
                      <div key={stage.etapaCodigo} className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: hex }} />
                        <span className="w-28 text-sm font-semibold text-gray-700">{stage.etapaNombre}</span>
                        <div className="flex flex-1 items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: hex }} />
                          </div>
                          <span className="w-28 text-right text-xs text-gray-500">
                            {scouts} scouts · {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bar — below donut */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-black text-gray-800">Tasa de Completitud por Área</h3>
            <p className="mb-4 text-xs text-gray-400">Porcentaje de objetivos completados por área de crecimiento</p>
            {loading ? <CardSkeleton className="h-72" /> : (
              <>
                <BarChart
                  data={barData}
                  index="area"
                  categories={['% Completado']}
                  colors={['blue']}
                  valueFormatter={pctFmt}
                  className="h-72"
                  showAnimation
                  showLegend={false}
                  maxValue={100}
                  yAxisWidth={55}
                  customTooltipContent={({ payload, active }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const area = orderedAreas.find((a) => a.nombre === d.area);
                    const color = area ? AREA_COLORS[area.codigo] : '#888';
                    return (
                      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                        <p className="font-bold text-sm" style={{ color }}>{d.area}</p>
                        <p className="text-sm text-gray-600 mt-1">{d['% Completado']}% completado</p>
                        <p className="text-xs text-gray-400">{d.completados} de {d.total} objetivos</p>
                      </div>
                    );
                  }}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  {orderedAreas.map((area) => (
                    <span key={area.codigo} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: AREA_COLORS[area.codigo] }} />
                      {area.icon} {area.nombre}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TENDENCIAS ────────────────────────────────────────────────────── */}
      {subTab === 'tendencias' && (
        <div className="space-y-5">
          {/* Filters panel */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">Filtros de Visualización</h3>
            <div className="flex flex-wrap items-start gap-8">

              {/* Etapa toggles */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Etapas visibles</p>
                <div className="flex flex-wrap gap-2">
                  {stageList.map((stage, i) => {
                    const hex = stage.etapaColor ?? DYNAMIC_PALETTE[i % DYNAMIC_PALETTE.length];
                    const active = selectedEtapas.has(stage.etapaCodigo);
                    return (
                      <button key={stage.etapaCodigo} type="button" onClick={() => toggleEtapa(stage.etapaCodigo)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active ? 'text-white shadow-sm' : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                        }`}
                        style={active ? { background: hex, borderColor: hex } : undefined}>
                        <span className="h-2 w-2 rounded-full"
                          style={{ background: active ? 'rgba(255,255,255,0.8)' : hex }} />
                        {stage.etapaNombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Period selector */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Período</p>
                <div className="flex flex-wrap gap-2">
                  {PERIODS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setPeriod(p.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        period === p.value
                          ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Line chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
              <h3 className="text-base font-black text-gray-800">Tendencia de Progresión Mensual</h3>
            </div>
            <p className="mb-4 text-xs text-gray-400">
              Historial real de progresion por etapa desde la base de datos ·{' '}
              {PERIODS.find((p) => p.value === period)?.label} ·{' '}
              {activeSeries.join(', ')}
            </p>
            {(loading || loadingTrends) ? <CardSkeleton className="h-80" /> : trendData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-sm text-gray-400">
                No hay historial mensual disponible para los filtros seleccionados
              </div>
            ) : (
              <LineChart
                data={trendData}
                index="mes"
                categories={activeSeries}
                colors={activeColors as any}
                valueFormatter={pctFmt}
                className="h-80"
                showAnimation
                showLegend
                showGridLines
                yAxisWidth={40}
                maxValue={100}
                minValue={0}
                curveType="monotone"
                customTooltipContent={({ payload, active, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                      <p className="mb-2 text-xs font-bold uppercase text-gray-500">{label}</p>
                      {payload.map((p: any) => (
                        <div key={p.name} className="flex items-center justify-between gap-4 text-sm">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-gray-700">{p.name}</span>
                          </span>
                          <span className="font-bold text-gray-800">{p.value}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalisisTab;
