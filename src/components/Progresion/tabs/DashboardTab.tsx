import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  LineChart,
  Line,
  LabelList,
} from 'recharts';
import { Award, CheckCircle2, Download, Target, TrendingUp, Users, Zap, AlertTriangle } from 'lucide-react';
import { CardSkeleton, KpiCard } from '../ProgresionComponents';
import {
  AREA_COLORS,
  AREA_NAMES,
  AREA_ICONS,
  STAGE_COLORS,
  type V4AreaData,
  type V4Scout,
  type V4StageBar,
} from '../useProgresionData';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface DashboardTabProps {
  loading: boolean;
  scouts: V4Scout[];
  globalAreas: V4AreaData[];
  stageBars: V4StageBar[];
  totalScouts: number;
  promedioGlobal: number;
  totalCompletados: number;
  totalObj: number;
}

// ─── Paleta din\u00e1mica para etapas ─────────────────────────────────────────────
const DYNAMIC_PALETTE = ['#4f8ddb', '#27c664', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6'];\n\n// Fallback para compatibilidad con c\u00f3digos legacy de TROPA\nconst STAGE_ORDER = ['PISTA', 'SENDA', 'RUMBO', 'TRAVESIA'];

// ─── Tooltip personalizado ───────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-700">{d.name}</p>
      <p className="text-gray-500 mt-0.5">{d.value} scouts · {d.payload.pct}%</p>
    </div>
  );
};

// ─── Sección header ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; sub?: string; accent?: string }> = ({
  title, sub, accent = '#2563eb',
}) => (
  <div className="mb-5">
    <div className="flex items-center gap-3">
      <div className="h-6 w-1 rounded-full" style={{ background: accent }} />
      <h3 className="text-base font-black tracking-tight text-gray-800">{title}</h3>
    </div>
    {sub && <p className="mt-0.5 pl-4 text-xs text-gray-400">{sub}</p>}
  </div>
);

// ─── Medalla de ranking ──────────────────────────────────────────────────────
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-xs font-bold text-gray-400 w-6 text-center">#{rank}</span>;
};

// ─── Componente principal ─────────────────────────────────────────────────────
const DashboardTab: React.FC<DashboardTabProps> = ({
  loading,
  scouts,
  globalAreas,
  stageBars,
  totalScouts,
  promedioGlobal,
  totalCompletados,
  totalObj,
}) => {
  const [exportandoPdf, setExportandoPdf] = useState(false);

  // ── Datos para el gráfico de barras apiladas por área ─────────────────────
  const areasChartData = useMemo(() => {
    return globalAreas.map((a) => ({
      name: a.nombre.slice(0, 8),        // abreviado para el eje
      fullName: a.nombre,
      Completados: a.completados,
      Pendientes: a.total - a.completados,
      total: a.total,
      pct: a.porcentaje,
      color: a.color,
    }));
  }, [globalAreas]);

  // ── Datos para el donut de distribución por etapa ─────────────────────────
  const etapaDonutData = useMemo(() => {
    return stageBars
      .filter((b) => b.totalScouts > 0)
      .map((b, i) => ({
        name: b.etapaNombre,
        value: b.totalScouts,
        pct: totalScouts > 0 ? Math.round((b.totalScouts / totalScouts) * 100) : 0,
        color: b.etapaColor ?? STAGE_COLORS[b.etapaCodigo] ?? DYNAMIC_PALETTE[i % DYNAMIC_PALETTE.length],
      }));
  }, [stageBars, totalScouts]);

  // ── Radial de porcentaje por área ─────────────────────────────────────────
  const radialData = useMemo(() => {
    return globalAreas
      .filter((a) => a.total > 0)
      .map((a) => ({
        name: a.nombre,
        value: a.porcentaje,
        fill: a.color,
      }))
      .sort((a, b) => b.value - a.value);
  }, [globalAreas]);

  // ── Top 10 scouts por progreso ────────────────────────────────────────────
  const topScouts = useMemo(() => {
    return [...scouts]
      .filter((s) => s.totalObjetivos > 0)
      .sort((a, b) => b.progreso - a.progreso)
      .slice(0, 10);
  }, [scouts]);

  // ── Áreas con mayor / menor avance ───────────────────────────────────────
  const sortedAreas = useMemo(() => {
    return [...globalAreas].sort((a, b) => b.porcentaje - a.porcentaje);
  }, [globalAreas]);

  const bestArea  = sortedAreas[0];
  const worstArea = sortedAreas[sortedAreas.length - 1];

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    if (loading) return;
    setExportandoPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; const M = 15; const CW = W - M * 2;
      const BLUE: [number, number, number] = [37, 99, 235];
      let y = 0;

      // ── HEADER ──────────────────────────────────────────────────────────
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, W, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text('GRUPO SCOUT LIMA 12  \u00b7  DASHBOARD EJECUTIVO DE PROGRESIÓN', M, 10);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('Dashboard de Progresión Scout', M, 22);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }), M, 30);
      const pillText = `${promedioGlobal}%  Progreso Global`;
      const pillW = doc.getTextWidth(pillText) + 10;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(W - M - pillW, 14, pillW, 12, 3, 3, 'F');
      doc.setTextColor(...BLUE); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(pillText, W - M - pillW / 2, 22, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y = 48;

      // ── KPI STRIP ───────────────────────────────────────────────────────
      const kpis = [
        { label: 'Scouts Activos',   value: String(totalScouts) },
        { label: 'Completados',      value: String(totalCompletados) },
        { label: 'Total Objetivos',  value: String(totalObj) },
        { label: 'Promedio Global',  value: `${promedioGlobal}%` },
      ];
      const kpiW = CW / 4;
      kpis.forEach((kpi, i) => {
        const x = M + i * kpiW;
        doc.setFillColor(245, 248, 255);
        doc.roundedRect(x + 1, y, kpiW - 2, 14, 2, 2, 'F');
        doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
        doc.text(kpi.label.toUpperCase(), x + (kpiW - 2) / 2, y + 5, { align: 'center' });
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE);
        doc.text(kpi.value, x + (kpiW - 2) / 2, y + 12, { align: 'center' });
      });
      doc.setTextColor(0, 0, 0);
      y += 22;

      // ── SECCIÓN 1: CUMPLIMIENTO POR ÁREA (Barras verticales apiladas) ──────
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE);
      doc.text('CUMPLIMIENTO POR ÁREA DE CRECIMIENTO', M, y);
      y += 2; doc.setDrawColor(...BLUE); doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y); y += 5;

      const chartH1 = 65;
      const axisLblW = 12; // espacio para etiquetas del eje Y
      const chartBarZone = CW - axisLblW;
      const numAreas = 6;
      const slotW = chartBarZone / numAreas;
      const barW1 = slotW * 0.58;
      const barOffX = (slotW - barW1) / 2;
      const maxTotal = Math.max(...globalAreas.map((a) => a.total), 1);
      const cYTop = y;
      const cYBot = y + chartH1;

      // Líneas de grid + etiquetas eje Y
      const ySteps = 4;
      for (let i = 0; i <= ySteps; i++) {
        const val = Math.round((maxTotal / ySteps) * i);
        const gy = cYBot - (val / maxTotal) * chartH1;
        doc.setDrawColor(241, 245, 249); doc.setLineWidth(0.25);
        doc.line(M + axisLblW, gy, M + axisLblW + chartBarZone, gy);
        doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175);
        doc.text(String(val), M + axisLblW - 2, gy + 1.5, { align: 'right' });
      }
      // Eje X
      doc.setDrawColor(209, 213, 219); doc.setLineWidth(0.4);
      doc.line(M + axisLblW, cYBot, M + axisLblW + chartBarZone, cYBot);

      const AREA_PDF_CODES = ['CORPORALIDAD','CREATIVIDAD','CARACTER','AFECTIVIDAD','SOCIABILIDAD','ESPIRITUALIDAD'];
      const AREA_ABBREV: Record<string, string> = {
        CORPORALIDAD: 'Corporal.', CREATIVIDAD: 'Creativid.', CARACTER: 'Carácter',
        AFECTIVIDAD: 'Afectivid.', SOCIABILIDAD: 'Sociabil.', ESPIRITUALIDAD: 'Espirit.',
      };

      AREA_PDF_CODES.forEach((code, i) => {
        const area = globalAreas.find((a) => a.codigo === code);
        if (!area || area.total === 0) return;
        const rgb = hexToRgb(area.color);
        const bx = M + axisLblW + i * slotW + barOffX;
        const completadosH = (area.completados / maxTotal) * chartH1;
        const pendientesH  = ((area.total - area.completados) / maxTotal) * chartH1;
        const totalBarH    = completadosH + pendientesH;

        // Barra pendientes (gris, parte superior)
        if (pendientesH > 0.5) {
          doc.setFillColor(229, 231, 235);
          doc.rect(bx, cYBot - totalBarH, barW1, pendientesH, 'F');
        }
        // Barra completados (coloreada, parte inferior)
        if (completadosH > 0.5) {
          doc.setFillColor(...rgb);
          doc.rect(bx, cYBot - completadosH, barW1, completadosH, 'F');
        }
        // % encima de la barra
        if (totalBarH > 2) {
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...rgb);
          doc.text(`${area.porcentaje}%`, bx + barW1 / 2, cYBot - totalBarH - 2, { align: 'center' });
        }
        // Nombre debajo del eje X
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
        doc.text(AREA_ABBREV[code] ?? code.slice(0, 8), bx + barW1 / 2, cYBot + 6, { align: 'center' });
      });

      y = cYBot + 12;
      // Leyenda: Completados + Pendientes
      let legX = M + axisLblW;
      ([
        { label: 'Completados', color: BLUE },
        { label: 'Pendientes',  color: [229, 231, 235] as [number, number, number] },
      ] as { label: string; color: [number, number, number] }[]).forEach((li) => {
        doc.setFillColor(...li.color);
        doc.rect(legX, y - 3.5, 4, 4, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
        doc.text(li.label, legX + 6, y);
        legX += doc.getTextWidth(li.label) + 18;
      });
      y += 10;

      // ── SECCIÓN 2: DISTRIBUCIÓN POR ETAPA (Tarjetas coloreadas) ─────────
      if (y > 240) { doc.addPage(); y = 20; }
      const VIOLET: [number, number, number] = [124, 58, 237];
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VIOLET);
      doc.text('DISTRIBUCIÓN POR ETAPA', M, y);
      y += 2; doc.setDrawColor(...VIOLET); doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y); y += 5;

      if (etapaDonutData.length > 0) {
        const nStages = etapaDonutData.length;
        const cardW2 = (CW - (nStages - 1) * 3) / nStages;
        const cardH2 = 28; const bandH = 6;
        etapaDonutData.forEach((stage, i) => {
          const cx = M + i * (cardW2 + 3);
          const rgb = hexToRgb(stage.color);
          // Fondo con tinte suave del color
          doc.setFillColor(
            Math.min(255, rgb[0] + Math.round((255 - rgb[0]) * 0.88)),
            Math.min(255, rgb[1] + Math.round((255 - rgb[1]) * 0.88)),
            Math.min(255, rgb[2] + Math.round((255 - rgb[2]) * 0.88)),
          );
          doc.roundedRect(cx, y, cardW2, cardH2, 2, 2, 'F');
          // Banda de color en la parte superior
          doc.setFillColor(...rgb);
          doc.roundedRect(cx, y, cardW2, bandH + 2, 2, 2, 'F');
          doc.rect(cx, y + bandH - 1, cardW2, 3, 'F'); // cuadrar esquinas inferiores de la banda
          // Nombre de etapa en la banda
          doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
          doc.text(stage.name, cx + cardW2 / 2, y + 4.5, { align: 'center' });
          // Número grande de scouts
          doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...rgb);
          doc.text(String(stage.value), cx + cardW2 / 2, y + 19, { align: 'center' });
          // Porcentaje
          doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
          doc.text(`${stage.pct}% del total`, cx + cardW2 / 2, y + 25.5, { align: 'center' });
        });
        y += cardH2 + 8;
      }

      // ══ PÁGINA 2 ══════════════════════════════════════════════════════════
      doc.addPage(); y = 20;

      // ── SECCIÓN 3: % AVANCE POR ÁREA (ORDENADO) ──────────────────────────
      const AMBER: [number, number, number] = [217, 119, 6];
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...AMBER);
      doc.text('% DE AVANCE POR ÁREA (MAYOR A MENOR)', M, y);
      y += 2; doc.setDrawColor(...AMBER); doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y); y += 7;

      const progBarMaxW = CW - 42 - 18;
      sortedAreas.forEach((area) => {
        const rgb = hexToRgb(area.color);
        const pctW = area.porcentaje > 0 ? (area.porcentaje / 100) * progBarMaxW : 0;
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
        doc.text(area.nombre, M, y + 5);
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(M + 42, y, progBarMaxW, 7, 1, 1, 'F');
        if (pctW > 0) { doc.setFillColor(...rgb); doc.roundedRect(M + 42, y, Math.max(2, pctW), 7, 1, 1, 'F'); }
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...rgb);
        doc.text(`${area.porcentaje}%`, M + CW, y + 5.5, { align: 'right' });
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
        doc.text(`${area.completados} / ${area.total} objetivos`, M + 42, y + 12);
        y += 15;
      });
      y += 5;

      // ── SECCIÓN 4: DISTRIBUCIÓN DE SCOUTS POR PROGRESO ───────────────────
      if (y > 210) { doc.addPage(); y = 20; }
      const GREEN: [number, number, number] = [22, 163, 74];
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      doc.text('DISTRIBUCIÓN DE SCOUTS POR NIVEL DE PROGRESO', M, y);
      y += 2; doc.setDrawColor(...GREEN); doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y); y += 6;

      if (progressBuckets.length > 0) {
        const chartTop = y; const chartH = 45;
        const bW = CW / progressBuckets.length - 4;
        const maxSc = Math.max(...progressBuckets.map((b) => b.scouts), 1);
        progressBuckets.forEach((b, i) => {
          const bh = Math.max(1, (b.scouts / maxSc) * chartH);
          const bx = M + i * (bW + 4);
          const by = chartTop + chartH - bh;
          const rgb = hexToRgb(b.color);
          doc.setFillColor(...rgb);
          doc.roundedRect(bx, by, bW, bh, 2, 2, 'F');
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
          doc.text(String(b.scouts), bx + bW / 2, by - 1.5, { align: 'center' });
          doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
          doc.text(b.label, bx + bW / 2, chartTop + chartH + 6, { align: 'center' });
        });
        y = chartTop + chartH + 14;
      }
      y += 6;

      // ── SECCIÓN 5: RANKING TOP 10 ─────────────────────────────────────────
      if (y > 205) { doc.addPage(); y = 20; }
      const RED: [number, number, number] = [220, 38, 38];
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED);
      doc.text('RANKING DE SCOUTS — TOP 10', M, y);
      y += 2; doc.setDrawColor(...RED); doc.setLineWidth(0.4);
      doc.line(M, y, M + CW, y); y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['#', 'Scout', 'Patrulla / Etapa', 'Completados', 'Progreso']],
        body: topScouts.map((s, idx) => [
          String(idx + 1),
          s.nombre,
          `${s.patrulla || '\u2014'} \u00b7 ${s.etapaNombre}`,
          `${s.objetivosCompletados}/${s.totalObjetivos}`,
          `${s.progreso}%`,
        ]),
        headStyles: { fillColor: BLUE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 55 },
          2: { cellWidth: 50 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [248, 249, 252] as [number, number, number] },
      });

      // ── FOOTER en todas las páginas ──────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 287, W, 10, 'F');
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175);
        doc.text('Grupo Scout Lima 12  \u00b7  Sistema de Gestión Scout  \u00b7  Módulo Progresión v4', M, 293.5);
        doc.text(`Pág. ${p} / ${totalPages}`, W - M, 293.5, { align: 'right' });
      }

      doc.save(`dashboard-progresion-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('Error exportando PDF:', e);
    } finally {
      setExportandoPdf(false);
    }
  };


  const progressBuckets = useMemo(() => {
    const buckets = [
      { label: '0%',     min: 0,  max: 1,  scouts: 0, color: '#ef4444' },
      { label: '1-25%',  min: 1,  max: 25, scouts: 0, color: '#f97316' },
      { label: '26-50%', min: 26, max: 50, scouts: 0, color: '#f59e0b' },
      { label: '51-75%', min: 51, max: 75, scouts: 0, color: '#22c55e' },
      { label: '76-100%',min: 76, max: 101,scouts: 0, color: '#2563eb' },
    ];
    scouts.forEach((s) => {
      const b = buckets.find((b) => s.progreso >= b.min && s.progreso < b.max);
      if (b) b.scouts++;
    });
    return buckets.filter((b) => b.scouts > 0);
  }, [scouts]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════════════════════
          ENCABEZADO EJECUTIVO
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        {/* Banda de color */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">
                GRUPO SCOUT LIMA 12 · REPORTE EJECUTIVO
              </p>
              <h2 className="text-white text-3xl font-black mt-1 tracking-tight">
                Dashboard de Progresión
              </h2>
              <p className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white">{promedioGlobal}%</p>
              <p className="text-blue-200 text-xs uppercase tracking-wider mt-1">Progreso Global</p>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportandoPdf}
                className="mt-3 ml-auto flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-60 px-4 py-2 text-white text-sm font-semibold transition"
              >
                <Download className="h-4 w-4" />
                {exportandoPdf ? 'Generando PDF...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </div>
        {/* KPIs */}
        <div className="bg-white grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0 divide-gray-100">
          {[
            { label: 'Scouts Activos',       value: totalScouts,      icon: Users,       color: '#2563eb' },
            { label: 'Objetivos Completados', value: totalCompletados, icon: CheckCircle2, color: '#16a34a' },
            { label: 'Objetivos Totales',     value: totalObj,         icon: Target,      color: '#7c3aed' },
            { label: 'Mejor Área',            value: bestArea?.nombre ?? '—', icon: Award, color: '#d97706' },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="flex items-center gap-4 px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={{ background: `${kpi.color}18` }}>
                  <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-800">{kpi.value}</p>
                  <p className="text-xs text-gray-400">{kpi.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FILA 1: Barras por Área + Donut Etapas
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Objetivos por Área — barras apiladas */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Cumplimiento por Área de Crecimiento"
            sub="Objetivos completados vs pendientes por área"
            accent="#2563eb"
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={areasChartData} barSize={28} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="Completados" stackId="a" radius={[0, 0, 0, 0]}>
                {areasChartData.map((entry) => (
                  <Cell key={entry.fullName} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="Pendientes" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="pct"
                  position="top"
                  formatter={(v: number) => `${v}%`}
                  style={{ fontSize: 9, fill: '#6b7280', fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Leyenda de colores */}
          <div className="mt-3 flex flex-wrap gap-3 justify-center">
            {globalAreas.map((a) => (
              <div key={a.codigo} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: a.color }} />
                {a.nombre}
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Etapa — donut */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader title="Scouts por Etapa" sub="Distribución actual" accent="#7c3aed" />
          {etapaDonutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={etapaDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {etapaDonutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {etapaDonutData.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                      <span className="text-gray-600">{e.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{e.value}</span>
                      <span className="text-gray-400">{e.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-gray-400 py-12">Sin datos de etapas</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FILA 2: Radial % por Área + Distribución de progreso
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Porcentaje de avance por área — radial bars */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="% de Avance por Área"
            sub="Porcentaje de objetivos completados"
            accent="#d97706"
          />
          <div className="space-y-3">
            {sortedAreas.map((area) => (
              <div key={area.codigo} className="flex items-center gap-3">
                <div className="w-5 text-center text-base shrink-0">{AREA_ICONS[area.codigo] ?? '●'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate">{area.nombre}</span>
                    <span className="text-xs font-black ml-2 shrink-0" style={{ color: area.color }}>
                      {area.porcentaje}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${area.porcentaje}%`,
                        background: area.color,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {area.completados} / {area.total} objetivos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de scouts por nivel de progreso */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Distribución de Scouts por Progreso"
            sub="¿En qué rango está cada scout?"
            accent="#16a34a"
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={progressBuckets} barSize={36} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="scouts" name="Scouts" radius={[6, 6, 0, 0]}>
                {progressBuckets.map((b) => (
                  <Cell key={b.label} fill={b.color} />
                ))}
                <LabelList
                  dataKey="scouts"
                  position="top"
                  style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Alertas ejecutivas */}
          <div className="mt-4 space-y-2">
            {bestArea && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                <span className="text-green-700">
                  <strong>Mejor área:</strong> {bestArea.nombre} ({bestArea.porcentaje}%)
                </span>
              </div>
            )}
            {worstArea && worstArea.total > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-amber-700">
                  <strong>Área con menor avance:</strong> {worstArea.nombre} ({worstArea.porcentaje}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FILA 3: Ranking de Scouts
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <SectionHeader
          title="Ranking de Scouts — Top 10 por Progreso"
          sub="Scouts ordenados de mayor a menor avance en sus objetivos"
          accent="#dc2626"
        />
        <div className="space-y-2">
          {topScouts.map((scout, idx) => {
            const stageColor = scout.etapaColor ?? STAGE_COLORS[scout.etapaCodigo] ?? '#2563eb';
            return (
              <div
                key={scout.id}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
                  idx < 3 ? 'bg-gradient-to-r from-amber-50 to-white border border-amber-100' : 'bg-gray-50'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <RankBadge rank={idx + 1} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{scout.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {scout.patrulla} ·{' '}
                    <span className="font-semibold" style={{ color: stageColor }}>
                      {scout.etapaNombre}
                    </span>
                  </p>
                </div>
                <div className="shrink-0 w-32">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {scout.objetivosCompletados}/{scout.totalObjetivos}
                    </span>
                    <span className="text-xs font-black" style={{ color: stageColor }}>
                      {scout.progreso}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${scout.progreso}%`, background: stageColor }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {topScouts.length === 0 && (
            <div className="py-12 text-center">
              <TrendingUp className="mx-auto h-10 w-10 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No hay datos de progreso disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PIE DE PÁGINA EJECUTIVO
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-gray-800 px-8 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-white text-sm font-black">Grupo Scout Lima 12</p>
          <p className="text-gray-400 text-xs">Sistema de Gestión Scout · Módulo Progresión v4</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-white">{totalScouts}</p>
            <p className="text-gray-400 text-xs">Scouts</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{promedioGlobal}%</p>
            <p className="text-gray-400 text-xs">Progreso</p>
          </div>
          <div>
            <p className="text-2xl font-black text-green-400">{totalCompletados}</p>
            <p className="text-gray-400 text-xs">Completados</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardTab;
