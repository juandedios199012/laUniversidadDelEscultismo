import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  Search,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ProgresionService, {
  type ObjetivoScout,
  type ProgresoCompletoScout,
} from '../../../services/progresionService';
import { obtenerEspecialidadesScout } from '../../../services/especialidadesService';
import { AsistenciaService } from '../../../services/asistenciaService';
import { supabase } from '../../../lib/supabase';
import { ProgressRing } from '../../ProgresionV2/ui/ProgressRing';
import { CardSkeleton } from '../V4Components';
import { STAGE_COLORS, AREA_COLORS, AREA_ICONS, type V4Scout } from '../useProgresionV4Data';
import type { EspecialidadesScoutResponse, ProgresoEspecialidad } from '../../../types/especialidades';

type SubTab = 'resumen' | 'logros' | 'eventos';

interface ProgramaSemanal {
  id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  tema_central: string;
  objetivos?: string[];
  rama?: string;
  responsable_programa?: string;
}

interface AttendanceStats {
  total_programas: number;
  presencias: number;
  ausencias: number;
  tardanzas: number;
  porcentaje_asistencia: number;
}

// ─── Helper hex → rgb tuple ──────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

interface V4PortalPadresTabProps {
  loading: boolean;
  scouts: V4Scout[];
}

const V4PortalPadresTab: React.FC<V4PortalPadresTabProps> = ({ loading, scouts }) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedScoutId, setSelectedScoutId] = useState<string>('');
  const [subTab, setSubTab] = useState<SubTab>('resumen');
  const [detalle, setDetalle] = useState<ProgresoCompletoScout | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoScout[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadesScoutResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
  const [eventos, setEventos] = useState<ProgramaSemanal[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [loadingLogros, setLoadingLogros] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [exportando, setExportando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scout = selectedScoutId
    ? scouts.find((s) => s.id === selectedScoutId)
    : scouts[0];

  useEffect(() => {
    if (!selectedScoutId && scouts.length > 0) {
      setSelectedScoutId(scouts[0].id);
      setSearch(scouts[0].nombre);
    }
  }, [scouts]);

  useEffect(() => {
    if (!scout) return;
    setLoadingDetalle(true);
    setDetalle(null);
    setObjetivos([]);
    Promise.all([
      ProgresionService.obtenerProgresoScout(scout.id),
      ProgresionService.obtenerObjetivosScout(scout.id),
    ]).then(([d, o]) => {
      setDetalle(d);
      setObjetivos(o);
    }).catch(console.error)
      .finally(() => setLoadingDetalle(false));
  }, [scout?.id]);

  // Load specialties + attendance lazily when Logros tab opens
  useEffect(() => {
    if (subTab !== 'logros' || !scout) return;
    if (especialidades !== null || attendance !== null) return;
    setLoadingLogros(true);
    Promise.allSettled([
      obtenerEspecialidadesScout(scout.id),
      AsistenciaService.getEstadisticasScoutDesdeIngreso(scout.id),
    ]).then(([esp, att]) => {
      if (esp.status === 'fulfilled') setEspecialidades(esp.value);
      if (att.status === 'fulfilled' && att.value.data) {
        const d = att.value.data as Record<string, number>;
        // La función SQL devuelve: total_presente, total_tardanza, total_ausente, total_justificado
        setAttendance({
          total_programas: d.total_programas ?? 0,
          presencias: d.total_presente ?? 0,
          ausencias: d.total_ausente ?? 0,
          tardanzas: d.total_tardanza ?? 0,
          porcentaje_asistencia: parseFloat((d.porcentaje_asistencia ?? 0).toFixed(1)),
        });
      }
    }).catch(console.error)
      .finally(() => setLoadingLogros(false));
  }, [subTab, scout?.id]);

  // Load upcoming programs from programa_semanal lazily
  useEffect(() => {
    if (subTab !== 'eventos') return;
    setLoadingEventos(true);
    const today = new Date().toISOString().split('T')[0];
    (async () => {
      try {
        const { data, error } = await supabase
          .from('programa_semanal')
          .select('id, fecha_inicio, fecha_fin, tema_central, objetivos, rama, responsable_programa')
          .gte('fecha_inicio', today)
          .order('fecha_inicio', { ascending: true })
          .limit(8);
        if (!error && data) setEventos(data as ProgramaSemanal[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingEventos(false);
      }
    })();
  }, [subTab]);

  const etapaColor = scout ? (STAGE_COLORS[scout.etapaCodigo] ?? '#888') : '#888';
  const objetivosCompletados = objetivos.filter((o) => o.completado);

  const handleSelectScout = (s: V4Scout) => {
    setSelectedScoutId(s.id);
    setSearch(s.nombre);
    setShowDropdown(false);
    setEspecialidades(null);
    setAttendance(null);
    setEventos([]);
  };

  const filteredScouts = scouts.filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!scout) return;
    setExportando(true);
    try {
      // ── Asegurar datos de asistencia aunque no se haya visitado tab Logros ──
      let attData = attendance;
      if (!attData) {
        const att = await AsistenciaService.getEstadisticasScoutDesdeIngreso(scout.id);
        if (att.data) {
          const d = att.data as Record<string, number>;
          attData = {
            total_programas: d.total_programas ?? 0,
            presencias:      d.total_presente ?? 0,
            ausencias:       d.total_ausente  ?? 0,
            tardanzas:       d.total_tardanza ?? 0,
            porcentaje_asistencia: parseFloat((d.porcentaje_asistencia ?? 0).toFixed(1)),
          };
        }
      }

      // ── Calcular áreas desde objetivos (fuente confiable, sin emoji) ────────
      const areaPdfMap = new Map<string, { nombre: string; completados: number; total: number }>();
      const AREA_PDF_ORDER = ['CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD'];
      objetivos.forEach((obj) => {
        if (!areaPdfMap.has(obj.area_codigo)) {
          areaPdfMap.set(obj.area_codigo, { nombre: obj.area_nombre, completados: 0, total: 0 });
        }
        const a = areaPdfMap.get(obj.area_codigo)!;
        a.total++;
        if (obj.completado) a.completados++;
      });
      const computedAreasPdf = AREA_PDF_ORDER
        .filter((c) => areaPdfMap.has(c))
        .map((c) => {
          const a = areaPdfMap.get(c)!;
          return { codigo: c, nombre: a.nombre, completados: a.completados, total: a.total,
            porcentaje: a.total > 0 ? parseFloat(((a.completados / a.total) * 100).toFixed(1)) : 0 };
        });

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 15;
      const contentW = pageW - margin * 2;
      const stageRgb = hexToRgb(etapaColor);
      const greenRgb: [number, number, number] = [39, 198, 100];

      // Header band
      doc.setFillColor(...stageRgb);
      doc.rect(0, 0, pageW, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('GRUPO SCOUT LIMA 12  ·  INFORME DE PROGRESIÓN PERSONAL', margin, 10);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(scout.nombre.toUpperCase(), margin, 24);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        margin, 32,
      );
      const pillText = `${scout.etapaNombre.toUpperCase()}  ·  ${scout.progreso}%`;
      const pillW = doc.getTextWidth(pillText) + 10;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageW - margin - pillW, 14, pillW, 11, 3, 3, 'F');
      doc.setTextColor(...stageRgb);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(pillText, pageW - margin - pillW / 2, 21.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      let y = 50;

      // KPI strip
      const kpis = [
        { label: 'Objetivos', value: `${scout.objetivosCompletados}/${scout.totalObjetivos}` },
        { label: 'Progreso', value: `${scout.progreso}%` },
        { label: 'Etapa', value: scout.etapaNombre },
        { label: 'Patrulla', value: scout.patrulla || '—' },
        { label: 'Código', value: scout.codigo || '—' },
      ];
      const kpiW = contentW / kpis.length;
      kpis.forEach((kpi, idx) => {
        const x = margin + idx * kpiW;
        doc.setFillColor(248, 249, 252);
        doc.roundedRect(x + 1, y, kpiW - 2, 16, 2, 2, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 140);
        doc.text(kpi.label.toUpperCase(), x + (kpiW - 2) / 2, y + 5.5, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...stageRgb);
        doc.text(kpi.value, x + (kpiW - 2) / 2, y + 13, { align: 'center' });
      });
      y += 22;

      // Progress bar
      doc.setFillColor(230, 232, 236);
      doc.roundedRect(margin, y, contentW, 4, 2, 2, 'F');
      if (scout.progreso > 0) {
        doc.setFillColor(...stageRgb);
        doc.roundedRect(margin, y, Math.max(4, contentW * (scout.progreso / 100)), 4, 2, 2, 'F');
      }
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140, 140, 140);
      doc.text(`Progreso: ${scout.progreso}%`, pageW - margin, y + 3.5, { align: 'right' });
      y += 14;

      // Áreas de Crecimiento — barras visuales horizontales (estilo Dashboard)
      if (computedAreasPdf.length > 0) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...stageRgb);
        doc.text('ÁREAS DE CRECIMIENTO', margin, y);
        y += 1.5; doc.setDrawColor(...stageRgb); doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentW, y); y += 6;

        // Mini stacked-bar chart: todas las áreas en un vistazo (fila compacta)
        const AREA_HEX: Record<string, string> = {
          CORPORALIDAD: '#E31E24', CREATIVIDAD: '#F5C800', CARACTER: '#0054A6',
          AFECTIVIDAD: '#808285', SOCIABILIDAD: '#00A651', ESPIRITUALIDAD: '#9B59B6',
        };
        const chartCompactH = 26;
        const chartCompactBarH = 10;
        const slotCW = contentW / computedAreasPdf.length;
        const barCW = slotCW * 0.65;
        const barOffCX = (slotCW - barCW) / 2;
        const chartCYBot = y + chartCompactH;

        // Grid lines
        [0, 50, 100].forEach((tick) => {
          const gy = y + chartCompactH - (tick / 100) * chartCompactH;
          doc.setDrawColor(241, 245, 249); doc.setLineWidth(0.2);
          doc.line(margin, gy, margin + contentW, gy);
        });

        computedAreasPdf.forEach((area, i) => {
          const rgb = hexToRgb(AREA_HEX[area.codigo] ?? '#888888');
          const bx = margin + i * slotCW + barOffCX;
          const totalBarH = (area.porcentaje / 100) * chartCompactH;
          const pendH = ((100 - area.porcentaje) / 100) * chartCompactH;

          // Barra pendientes
          if (pendH > 0.3) {
            doc.setFillColor(229, 231, 235);
            doc.rect(bx, y, barCW, pendH, 'F');
          }
          // Barra completados (coloreada, desde abajo)
          if (totalBarH > 0.3) {
            doc.setFillColor(...rgb);
            doc.rect(bx, y + pendH, barCW, totalBarH, 'F');
          }
          // % encima
          doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...rgb);
          doc.text(`${area.porcentaje}%`, bx + barCW / 2, y - 1.5, { align: 'center' });
          // Nombre debajo
          doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
          const shortName = area.nombre.slice(0, 7);
          doc.text(shortName, bx + barCW / 2, chartCYBot + 4.5, { align: 'center' });
        });
        y = chartCYBot + 10;

        // Barras horizontales individuales con color por área
        const aBarLabelW = 46;
        const aBarValW = 16;
        const aBarMaxW = contentW - aBarLabelW - aBarValW - 4;
        const aBarH = 7;
        computedAreasPdf.forEach((area) => {
          const rgb = hexToRgb(AREA_HEX[area.codigo] ?? '#888888');
          const fillW = area.porcentaje > 0 ? Math.max(2, (area.porcentaje / 100) * aBarMaxW) : 0;

          // Nombre del área
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
          doc.text(area.nombre, margin, y + aBarH / 2 + 1.5);

          // Barra de fondo (gris)
          doc.setFillColor(229, 231, 235);
          doc.roundedRect(margin + aBarLabelW, y, aBarMaxW, aBarH, 1.5, 1.5, 'F');

          // Barra de progreso (color oficial del área)
          if (fillW > 0) {
            doc.setFillColor(...rgb);
            doc.roundedRect(margin + aBarLabelW, y, fillW, aBarH, 1.5, 1.5, 'F');
          }

          // Porcentaje (derecha)
          doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...rgb);
          doc.text(`${area.porcentaje}%`, margin + contentW, y + aBarH / 2 + 1.5, { align: 'right' });

          // Sub-label: X/Y objetivos
          doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
          doc.text(`${area.completados} / ${area.total} objetivos`, margin + aBarLabelW, y + aBarH + 4.5);

          y += aBarH + 9;
        });
        y += 4;
      }

      // Objetivos completados
      if (objetivosCompletados.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...stageRgb);
        doc.text(`OBJETIVOS COMPLETADOS (${objetivosCompletados.length})`, margin, y);
        y += 1.5; doc.setDrawColor(...stageRgb); doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentW, y); y += 4;
        autoTable(doc, {
          startY: y, margin: { left: margin, right: margin },
          head: [['Objetivo', 'Área', 'Completado']],
          body: objetivosCompletados.map((o) => [
            o.titulo, o.area_nombre,
            o.fecha_completado ? new Date(o.fecha_completado).toLocaleDateString('es-PE') : '—',
          ]),
          headStyles: { fillColor: stageRgb, textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 0: { cellWidth: 105 }, 1: { cellWidth: 45 }, 2: { halign: 'center', cellWidth: 30 } },
          alternateRowStyles: { fillColor: [248, 249, 252] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Especialidades
      const espCompletadas: ProgresoEspecialidad[] =
        especialidades?.especialidades?.filter((e) => e.fase_desafio === 'completada') ?? [];
      if (espCompletadas.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...greenRgb);
        doc.text(`ESPECIALIDADES LOGRADAS (${espCompletadas.length})`, margin, y);
        y += 1.5; doc.setDrawColor(...greenRgb); doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentW, y); y += 4;
        autoTable(doc, {
          startY: y, margin: { left: margin, right: margin },
          head: [['Especialidad', 'Área', 'Fecha Completada']],
          body: espCompletadas.map((e) => [
            e.especialidad.nombre, e.area.nombre,
            e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString('es-PE') : '—',
          ]),
          headStyles: { fillColor: greenRgb, textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [240, 253, 244] },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Asistencia — gráfico de barras visual (basado en programas semanales)
      if (attData) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...stageRgb);
        doc.text('RECORD DE ASISTENCIA', margin, y);
        y += 1.5; doc.setDrawColor(...stageRgb); doc.setLineWidth(0.4);
        doc.line(margin, y, margin + contentW, y); y += 6;

        // KPI mini-row
        const kpiAtt = [
          { label: 'Reuniones', value: attData.total_programas, rgb: [79,141,219] as [number,number,number] },
          { label: 'Presente',  value: attData.presencias,      rgb: [39,198,100] as [number,number,number] },
          { label: 'Tardanza',  value: attData.tardanzas,        rgb: [245,158,11] as [number,number,number] },
          { label: 'Ausente',   value: attData.ausencias,        rgb: [239,68,68]  as [number,number,number] },
        ];
        const kpiAttW = contentW / kpiAtt.length;
        kpiAtt.forEach((k, i) => {
          const kx = margin + i * kpiAttW;
          doc.setFillColor(248, 249, 252);
          doc.roundedRect(kx + 1, y, kpiAttW - 2, 14, 2, 2, 'F');
          doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140);
          doc.text(k.label.toUpperCase(), kx + (kpiAttW - 2) / 2, y + 5, { align: 'center' });
          doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...k.rgb);
          doc.text(String(k.value), kx + (kpiAttW - 2) / 2, y + 12, { align: 'center' });
        });
        y += 19;

        // Gráfico de barras horizontales
        const attBars = [
          { label: 'Presente',  value: attData.presencias,  rgb: [39,198,100]  as [number,number,number] },
          { label: 'Tardanza',  value: attData.tardanzas,   rgb: [245,158,11]  as [number,number,number] },
          { label: 'Ausente',   value: attData.ausencias,   rgb: [239,68,68]   as [number,number,number] },
        ];
        const maxBarVal = Math.max(...attBars.map((b) => b.value), 1);
        const barH = 6;
        const barGap = 3;
        const labelW = 22;
        const valW = 10;
        const barAreaW = contentW - labelW - valW - 4;
        attBars.forEach((bar) => {
          doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
          doc.text(bar.label, margin, y + barH / 2 + 1.5);
          doc.setFillColor(230, 232, 236);
          doc.roundedRect(margin + labelW, y, barAreaW, barH, 1.5, 1.5, 'F');
          const fillW = Math.max(3, (bar.value / maxBarVal) * barAreaW);
          doc.setFillColor(...bar.rgb);
          doc.roundedRect(margin + labelW, y, fillW, barH, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold'); doc.setTextColor(...bar.rgb);
          doc.text(String(bar.value), margin + labelW + barAreaW + 3, y + barH / 2 + 1.5);
          y += barH + barGap;
        });
        y += 4;

        // Barra de porcentaje global
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
        doc.text('% Asistencia:', margin, y + 4);
        doc.setFillColor(230, 232, 236);
        doc.roundedRect(margin + labelW, y, barAreaW, 6, 1.5, 1.5, 'F');
        doc.setFillColor(...stageRgb);
        doc.roundedRect(margin + labelW, y, Math.max(3, barAreaW * (attData.porcentaje_asistencia / 100)), 6, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...stageRgb);
        doc.text(`${attData.porcentaje_asistencia}%`, margin + labelW + barAreaW + 3, y + 4.5);
        y += 14;
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...stageRgb);
        doc.rect(0, 285, pageW, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('Grupo Scout Lima 12  ·  Sistema de Gestión Scout', margin, 292);
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 292, { align: 'right' });
      }

      doc.save(`progresion_${scout.nombre.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
    } catch (e) {
      console.error('Error generando PDF:', e);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800">Portal de Padres</h2>
          <p className="mt-1 text-sm text-gray-500">Seguimiento completo del desarrollo scout de su hijo/a</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportando || !scout || !detalle || loadingDetalle}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className={`h-4 w-4 ${exportando ? 'animate-bounce' : ''}`} />
          {exportando ? 'Generando PDF...' : 'Exportar Informe'}
        </button>
      </div>

      {/* Scout selector — search input */}
      <div className="relative z-10" ref={dropdownRef}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 shrink-0">
            Seleccionar Scout:
          </span>
          <div className="relative min-w-[260px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 shadow-sm outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setShowDropdown(true); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {scout && (
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: etapaColor }}
            >
              {scout.etapaNombre}
            </span>
          )}
          <span className="text-xs text-gray-400">{scouts.length} scouts disponibles</span>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="max-h-60 overflow-y-auto">
                {filteredScouts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">No se encontraron scouts</p>
                ) : (
                  filteredScouts.slice(0, 20).map((s) => {
                    const color = STAGE_COLORS[s.etapaCodigo] ?? '#888';
                    const isActive = s.id === (scout?.id ?? '');
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectScout(s)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 ${isActive ? 'bg-blue-50' : ''}`}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                        <span className="flex-1 font-medium text-gray-800 truncate">{s.nombre}</span>
                        <span className="shrink-0 text-xs text-gray-400">{s.progreso}%</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ background: `${color}18`, color }}
                        >
                          {s.etapaNombre}
                        </span>
                      </button>
                    );
                  })
                )}
                {filteredScouts.length > 20 && (
                  <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
                    +{filteredScouts.length - 20} más · afina la búsqueda
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton className="h-40" />
          <CardSkeleton className="h-40" />
        </div>
      ) : !scout ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-200 mb-2" />
          <p className="text-gray-400">No hay scouts disponibles</p>
        </div>
      ) : (
        <>
          {/* Scout profile card */}
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:flex-nowrap">
            <div className="relative shrink-0">
              <ProgressRing percentage={scout.progreso} size={120} strokeWidth={8} color={etapaColor}>
                <div className="text-center">
                  <span className="block text-xl font-black" style={{ color: etapaColor }}>
                    {scout.progreso}%
                  </span>
                  <span className="text-xs text-gray-400">progreso</span>
                </div>
              </ProgressRing>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-black text-gray-800">{scout.nombre}</h3>
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: etapaColor }}
                >
                  {scout.etapaNombre}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{scout.patrulla} · {scout.rama}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Objetivos', value: `${scout.objetivosCompletados}/${scout.totalObjetivos}` },
                  { label: 'Progreso', value: `${scout.progreso}%` },
                  { label: 'Código', value: scout.codigo || '—' },
                  { label: 'Patrulla', value: scout.patrulla },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="mt-1 font-black text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2 rounded-xl border border-gray-100 bg-white p-1 shadow-sm w-fit">
            {([
              { id: 'resumen', label: 'Resumen', icon: <Users className="h-4 w-4" /> },
              { id: 'logros', label: 'Logros', icon: <Trophy className="h-4 w-4" /> },
              { id: 'eventos', label: 'Próximos Eventos', icon: <Calendar className="h-4 w-4" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  subTab === tab.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Resumen */}
          {subTab === 'resumen' && (
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Progreso general */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h4 className="text-base font-black text-gray-800">Progreso de Etapa</h4>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-600">
                    <span>Progreso General</span>
                    <span style={{ color: etapaColor }}>{scout.progreso}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${scout.progreso}%`, background: etapaColor }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Objetivos Completados</p>
                    <p className="mt-1 text-2xl font-black text-gray-800">
                      {scout.objetivosCompletados}
                      <span className="text-sm font-normal text-gray-400">/{scout.totalObjetivos}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Etapa Actual</p>
                    <p className="mt-1 text-2xl font-black" style={{ color: etapaColor }}>
                      {scout.etapaNombre}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Avanzando correctamente</p>
                    <p className="mt-0.5 text-xs text-green-600">
                      {scout.nombre.split(' ')[0]} está progresando en su etapa {scout.etapaNombre}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Áreas de crecimiento */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h4 className="text-base font-black text-gray-800">Áreas de Crecimiento</h4>
                <div className="mt-4 space-y-3">
                  {loadingDetalle ? (
                    [...Array(6)].map((_, i) => <CardSkeleton key={i} className="h-8" />)
                  ) : detalle && detalle.areas.length > 0 ? (
                    detalle.areas.map((area) => {
                      const color = AREA_COLORS[area.area_codigo] ?? area.area_color;
                      const icon = AREA_ICONS[area.area_codigo] ?? area.area_icono;
                      return (
                        <div key={area.area_id} className="flex items-center gap-3">
                          <span className="text-lg w-6 text-center">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-700">{area.area_nombre}</span>
                              <span style={{ color }}>{area.porcentaje}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full" style={{ width: `${area.porcentaje}%`, background: color }} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">
                            {area.objetivos_completados}/{area.total_objetivos}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                      <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                      <p className="text-sm text-gray-400">
                        Sin datos de áreas — el scout no tiene objetivos asignados en la BD
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Logros ─────────────────────────────────────────────────────── */}
          {subTab === 'logros' && (
            <div className="space-y-6">
              {/* Objetivos completados */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h4 className="text-base font-black text-gray-800">Objetivos Completados</h4>
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {objetivosCompletados.length} logrados
                  </span>
                </div>
                {loadingDetalle ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} className="h-16" />)}</div>
                ) : objetivosCompletados.length === 0 ? (
                  <div className="py-8 text-center">
                    <Trophy className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Aún no hay objetivos completados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {objetivosCompletados.map((obj) => {
                      const areaColor = AREA_COLORS[obj.area_codigo] ?? '#888';
                      const areaIcon = AREA_ICONS[obj.area_codigo] ?? '●';
                      return (
                        <div key={obj.id} className="flex items-start gap-4 rounded-xl border border-green-100 bg-green-50 p-4">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">{obj.titulo}</p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {areaIcon} {obj.area_nombre}
                              {obj.fecha_completado && ` · ${new Date(obj.fecha_completado).toLocaleDateString('es-PE')}`}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                            style={{ background: `${areaColor}18`, color: areaColor }}>
                            {obj.etapa_nombre}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Especialidades */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h4 className="text-base font-black text-gray-800">Especialidades Logradas</h4>
                  {especialidades && (
                    <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
                      {especialidades.completadas} completadas
                    </span>
                  )}
                </div>
                {loadingLogros ? (
                  <div className="space-y-3">{[...Array(2)].map((_, i) => <CardSkeleton key={i} className="h-14" />)}</div>
                ) : !especialidades ? (
                  <p className="text-sm text-gray-400">Cargando especialidades...</p>
                ) : (especialidades.especialidades?.filter((e) => e.fase_desafio === 'completada') ?? []).length === 0 ? (
                  <div className="py-8 text-center">
                    <Star className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Aún no hay especialidades completadas</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {especialidades.especialidades
                      .filter((e) => e.fase_desafio === 'completada')
                      .map((e) => (
                        <div key={e.progreso_id} className="flex items-center gap-3 rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                            style={{ background: `${e.area.color}22` }}>
                            {e.area.icono ?? '⭐'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{e.especialidad.nombre}</p>
                            <p className="text-xs text-gray-500">{e.area.nombre}
                              {e.fecha_fin && ` · ${new Date(e.fecha_fin).toLocaleDateString('es-PE')}`}
                            </p>
                          </div>
                          <Award className="h-4 w-4 shrink-0 text-yellow-500" />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Record de asistencia */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h4 className="text-base font-black text-gray-800 mb-4">Record de Asistencia (Año Actual)</h4>
                {loadingLogros ? (
                  <CardSkeleton className="h-24" />
                ) : !attendance ? (
                  <p className="text-sm text-gray-400">Sin datos de asistencia</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Total Reuniones', value: attendance.total_programas, color: '#4f8ddb' },
                      { label: 'Asistencias', value: attendance.presencias, color: '#27c664' },
                      { label: 'Tardanzas', value: attendance.tardanzas, color: '#f59e0b' },
                      { label: 'Ausencias', value: attendance.ausencias, color: '#ef4444' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                        <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                    <div className="col-span-2 sm:col-span-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500">Porcentaje de Asistencia</p>
                        <p className="text-sm font-black" style={{ color: etapaColor }}>{attendance.porcentaje_asistencia}%</p>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${attendance.porcentaje_asistencia}%`, background: etapaColor }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Eventos ─────────────────────────────────────────────────────── */}
          {subTab === 'eventos' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-base font-black text-gray-800">Próximos Programas</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Actividades programadas en el módulo de Programas</p>
                </div>
              </div>
              {loadingEventos ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} className="h-16" />)}</div>
              ) : eventos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-gray-200 mb-2" />
                  <p className="text-sm font-medium text-gray-400">No hay programas próximos</p>
                  <p className="text-xs text-gray-400 mt-1">Los programas futuros aparecerán aquí una vez creados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventos.map((evento) => {
                    const fecha = new Date(evento.fecha_inicio + 'T00:00:00');
                    const dia = fecha.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
                    return (
                      <div key={evento.id} className="flex items-start gap-4 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50">
                        <div
                          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                          style={{ background: etapaColor }}
                        >
                          <span className="text-lg font-black leading-none">{fecha.getDate()}</span>
                          <span className="text-[9px] uppercase leading-none opacity-90">
                            {fecha.toLocaleDateString('es-PE', { month: 'short' })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{evento.tema_central}</p>
                          <p className="mt-0.5 text-xs capitalize text-gray-500">{dia}</p>
                          {evento.responsable_programa && (
                            <p className="text-xs text-gray-400">Responsable: {evento.responsable_programa}</p>
                          )}
                          {evento.rama && (
                            <span className="mt-1 inline-block rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
                              {evento.rama}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default V4PortalPadresTab;
