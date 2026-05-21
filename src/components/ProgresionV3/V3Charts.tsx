import React from 'react';
import { Surface } from './V3Primitives';
import type { V3BarMetric, V3StageDistributionItem, V3TrendSeries } from './types';

export const StageDistributionChart: React.FC<{
  data: V3StageDistributionItem[];
}> = ({ data }) => {
  let cumulative = 0;
  const gradients = data
    .map((item) => {
      const start = cumulative;
      cumulative += item.percentage;
      return `${item.color} ${start}% ${cumulative}%`;
    })
    .join(', ');

  const labelPositions = [
    { top: '16%', left: '72%' },
    { top: '31%', left: '10%' },
    { top: '79%', left: '25%' },
    { top: '64%', left: '78%' },
  ];

  return (
    <Surface className="p-6 lg:p-8">
      <h3 className="text-2xl font-black tracking-tight text-slate-700">Distribución por Etapa</h3>
      <div className="relative mx-auto mt-10 flex min-h-[420px] items-center justify-center">
        <div
          className="h-[250px] w-[250px] rounded-full border-2 border-white shadow-[0_12px_26px_rgba(61,35,16,0.10)] lg:h-[320px] lg:w-[320px]"
          style={{ background: `conic-gradient(${gradients})` }}
        />
        {data.map((item, index) => (
          <div
            key={item.code}
            className="absolute text-2xl font-semibold"
            style={{ ...labelPositions[index], color: item.color }}
          >
            {item.label} {item.percentage}%
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xl font-semibold">
        {data.map((item) => (
          <div key={item.code} className="flex items-center gap-2" style={{ color: item.color }}>
            <span className="h-5 w-5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </Surface>
  );
};

export const CompletionBarsChart: React.FC<{
  data: V3BarMetric[];
}> = ({ data }) => {
  const max = Math.max(...data.map((item) => item.value), 100);

  return (
    <Surface className="p-6 lg:p-8">
      <h3 className="text-2xl font-black tracking-tight text-slate-700">Tasa de Completitud por Objetivo</h3>
      <div className="mt-8 h-[360px]">
        <div className="flex h-[280px] items-end gap-5 border-b-2 border-l-2 border-[#99a5b5] px-4 pb-0 pt-6">
          {data.map((item) => (
            <div key={item.label} className="flex flex-1 flex-col items-center justify-end gap-3">
              <div
                className="w-full max-w-[110px] rounded-t-2xl"
                style={{
                  height: `${(item.value / max) * 230}px`,
                  background: item.color,
                }}
              />
              <div className="min-h-[64px] rotate-[-42deg] text-center text-base font-medium text-slate-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-6 text-xl font-semibold text-slate-500">
        <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#2fb565]" />Excelente (≥80%)</span>
        <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#4f8ddb]" />Bueno (60-79%)</span>
        <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#f7a311]" />Regular (40-59%)</span>
        <span className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#ef4c3c]" />Necesita Apoyo (&lt;40%)</span>
      </div>
    </Surface>
  );
};

export const MonthlyTrendChart: React.FC<{
  labels: string[];
  series: V3TrendSeries[];
}> = ({ labels, series }) => {
  const width = 900;
  const height = 280;
  const paddingX = 50;
  const paddingY = 30;
  const maxValue = Math.max(...series.flatMap((item) => item.values), 50);

  const buildPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const x = paddingX + (index * (width - paddingX * 2)) / (labels.length - 1 || 1);
        const y = height - paddingY - ((value / maxValue) * (height - paddingY * 2));
        return { x, y, value };
      });

  return (
    <Surface className="p-6 lg:p-8">
      <h3 className="text-2xl font-black tracking-tight text-slate-700">Tendencia de Progresión Mensual</h3>
      <div className="mt-8 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height + 40}`} className="min-w-[900px]">
          {[0, 1, 2, 3].map((line) => {
            const y = paddingY + ((height - paddingY * 2) * line) / 3;
            return (
              <line
                key={line}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#eadfd5"
                strokeDasharray="4 6"
              />
            );
          })}

          {labels.map((label, index) => {
            const x = paddingX + (index * (width - paddingX * 2)) / (labels.length - 1 || 1);
            return (
              <g key={label}>
                <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="#f1e7dd" strokeDasharray="4 6" />
                <text x={x} y={height + 20} textAnchor="middle" className="fill-slate-500 text-[16px] font-medium">
                  {label}
                </text>
              </g>
            );
          })}

          {series.map((item) => {
            const points = buildPoints(item.values);
            const path = points
              .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
              .join(' ');
            return (
              <g key={item.label}>
                <path d={path} fill="none" stroke={item.color} strokeWidth="3" />
                {points.map((point) => (
                  <circle key={`${item.label}-${point.x}`} cx={point.x} cy={point.y} r="5" fill="#fffdfa" stroke={item.color} strokeWidth="3" />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xl font-semibold">
        {series.map((item) => (
          <div key={item.label} className="flex items-center gap-2" style={{ color: item.color }}>
            <span className="h-1.5 w-8 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </Surface>
  );
};