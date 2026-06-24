/**
 * Componente principal para gestión de reportes
 */

import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Calendar, Download, FileSpreadsheet, Award, CreditCard, List } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import {
  ReportType,
  ExportFormat,
  ReportFilters,
  ReportGenerationResult,
} from '../types/reportTypes';
import { ReportExportButton } from './ReportExportButton';
import { generateAndDownloadPDF, generatePDF, generateReportMetadata } from '../services/pdfService';
import { generateAndDownloadDOCX, createScoutReportDOCX, createAttendanceReportDOCX, createProgressReportDOCX } from '../services/docxService';
import { ScoutsExcelReport } from './ScoutsExcelReport';
import { EspecialidadesExcelReport } from './EspecialidadesExcelReport';
import { EspecialidadesDetalleExcelReport } from './EspecialidadesDetalleExcelReport';
import {
  getScoutData,
  getAttendanceData,
  getProgressData,
} from '../services/reportDataService';
import ScoutReportTemplate from '../templates/pdf/ScoutReportTemplate';
import AttendanceReportTemplate from '../templates/pdf/AttendanceReportTemplate';
import ProgressReportTemplate from '../templates/pdf/ProgressReportTemplate';
import EspecialidadesReportTemplate from '../templates/pdf/EspecialidadesReportTemplate';
import InscripcionesReportTemplate from '../templates/pdf/InscripcionesReportTemplate';
import ContactosEmergenciaReportTemplate from '../templates/pdf/ContactosEmergenciaReportTemplate';
import DocumentacionPendienteReportTemplate from '../templates/pdf/DocumentacionPendienteReportTemplate';
import RankingPatrullasReportTemplate from '../templates/pdf/RankingPatrullasReportTemplate';
import GenericSummaryReportTemplate from '../templates/pdf/GenericSummaryReportTemplate';
import { getEspecialidadesReportData } from '../services/especialidadesDataService';
import { supabase } from '../../../lib/supabase';
import DirigenteService from '../../../services/dirigenteService';
import ComitePadresService from '../../../services/comitePadresService';
import ReportsService from '../../../services/reportsService';
import FinanzasService from '../../../services/finanzasService';
import InventarioService from '../../../services/inventarioService';
import {
  getInscripcionesAnuales,
  getRankingPatrullas,
  getContactosEmergencia,
  getDocumentacionPendiente,
} from '../services/reportDataService';
// Imports para reportes masivos
import DniCollectionTemplate from '../templates/pdf/DniCollectionTemplate';
import DniScoutApoderadoTemplate from '../templates/pdf/DniScoutApoderadoTemplate';
import { createDNGI03WordDocument } from '../templates/word/DNGI03WordTemplate';
import {
  getAllScoutsForMasiveDNGI03,
  getAllScoutsWithDni,
  getAllFamiliaresWithDni,
  getScoutsWithApoderadoDni,
  generateMasiveReportMetadata,
  getAvailableRamas,
  splitPersonasForPdf,
} from '../services/masiveReportService';

interface Scout {
  id: string;
  codigo_asociado?: string;
  rama_actual: string;
  persona: {
    nombres: string;
    apellidos: string;
  };
}

interface ReportManagerProps {
  className?: string;
}

export const ReportManager: React.FC<ReportManagerProps> = ({ className = '' }) => {
  const { error: showError, info } = useToast();
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    scoutIds: [],
  });
  const [scoutId, setScoutId] = useState<string>('');
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [especialidadesRama, setEspecialidadesRama] = useState<string>('');
  const [loadingScouts, setLoadingScouts] = useState(false);
  
  // Estado para filtro de rama en reportes masivos
  const [ramaFilter, setRamaFilter] = useState<string>('TODAS');
  const [availableRamas, setAvailableRamas] = useState<string[]>([]);
  const [selectedMassiveScoutId, setSelectedMassiveScoutId] = useState<string>('');

  // Estado para el reporte "Persona" (DNGI-03): tipo de persona y selección
  const [personaEntityType, setPersonaEntityType] = useState<'SCOUT' | 'DIRIGENTE' | 'COMITE'>('SCOUT');
  const [dirigentesList, setDirigentesList] = useState<any[]>([]);
  const [comiteList, setComiteList] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');

  // Cargar lista de scouts y ramas al montar el componente
  useEffect(() => {
    loadScouts();
    loadRamas();
    loadDirigentesYComite();
  }, []);
  
  const loadRamas = async () => {
    const ramas = await getAvailableRamas();
    setAvailableRamas(ramas);
  };

  const loadDirigentesYComite = async () => {
    try {
      const [dirigentes, comite] = await Promise.all([
        DirigenteService.obtenerDirigentes({ estado: 'ACTIVO' }),
        ComitePadresService.getMiembrosComite({ activos_solo: true }),
      ]);
      setDirigentesList(dirigentes || []);
      setComiteList(comite || []);
    } catch (error) {
      console.error('Error cargando dirigentes/comité:', error);
    }
  };

  const loadScouts = async () => {
    setLoadingScouts(true);
    try {
      const { data, error } = await supabase.rpc('api_listar_scouts_para_reportes', {
        p_estado: 'ACTIVO'
      });

      if (error) throw error;
      setScouts((data || []).map((s: any) => ({
        ...s,
        codigo_asociado: s.persona?.codigo_asociado || ''
      })));
    } catch (error) {
      console.error('Error cargando scouts:', error);
    } finally {
      setLoadingScouts(false);
    }
  };

  const filteredScoutsForMassive = scouts.filter((s) =>
    ramaFilter === 'TODAS' ? true : s.rama_actual === ramaFilter
  );

  useEffect(() => {
    if (!selectedMassiveScoutId) return;
    const exists = filteredScoutsForMassive.some((s) => s.id === selectedMassiveScoutId);
    if (!exists) {
      setSelectedMassiveScoutId('');
    }
  }, [ramaFilter, selectedMassiveScoutId, scouts]);

  const sanitizeFilePart = (value: string): string => {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const getFirstSurname = (apellidos: string): string => {
    return (apellidos || '').trim().split(/\s+/)[0] || '';
  };

  const compressDataUrlImage = async (
    dataUrl: string,
    maxWidth: number,
    quality: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const compressPairForPdf = async (scout: any, apoderado: any, quality: number, maxWidth = 980) => {
    const [sAnv, sRev, aAnv, aRev] = await Promise.all([
      scout.dniAnversoUrl ? compressDataUrlImage(scout.dniAnversoUrl, maxWidth, quality) : undefined,
      scout.dniReversoUrl ? compressDataUrlImage(scout.dniReversoUrl, maxWidth, quality) : undefined,
      apoderado.dniAnversoUrl ? compressDataUrlImage(apoderado.dniAnversoUrl, maxWidth, quality) : undefined,
      apoderado.dniReversoUrl ? compressDataUrlImage(apoderado.dniReversoUrl, maxWidth, quality) : undefined,
    ]);

    return {
      scout: {
        ...scout,
        dniAnversoUrl: sAnv,
        dniReversoUrl: sRev,
      },
      apoderado: {
        ...apoderado,
        dniAnversoUrl: aAnv,
        dniReversoUrl: aRev,
      },
    };
  };

  // Definir tipos de reportes disponibles (agrupados por categoría)
  interface ReportCardItem {
    type: ReportType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    badge?: string;
    disabled?: boolean;
  }

  interface ReportCategoryItem {
    name: string;
    reports: ReportCardItem[];
  }

  const reportCategories: ReportCategoryItem[] = [
    {
      name: 'Reportes Operativos',
      reports: [
        {
          type: ReportType.SCOUT_PROFILE,
          title: 'Perfil de Scout',
          description: 'Información completa individual (DNGI-03)',
          icon: <Users className="w-6 h-6" />,
          color: 'blue',
        },
        {
          type: ReportType.ATTENDANCE,
          title: 'Asistencia',
          description: 'Registro de asistencias por periodo',
          icon: <Calendar className="w-6 h-6" />,
          color: 'green',
        },
        {
          type: ReportType.PROGRESS,
          title: 'Progresión Scout',
          description: 'Avance en especialidades y etapas',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'purple',
        },
        {
          type: ReportType.ESPECIALIDADES,
          title: 'Especialidades Scout',
          description: 'Progreso y estadísticas de especialidades por rama',
          icon: <Award className="w-6 h-6" />,
          color: 'amber',
        },
        {
          type: ReportType.ESPECIALIDADES_DETALLE,
          title: 'Especialidades Detallado',
          description: 'Lista detallada de cada especialidad por scout con fases',
          icon: <List className="w-6 h-6" />,
          color: 'indigo',
          badge: '¡Nuevo!'
        },
      ]
    },
    {
      name: 'Reportes Administrativos',
      reports: [
        {
          type: ReportType.SCOUTS_EXCEL_COMPLETO,
          title: 'Scouts Excel Completo',
          description: 'Todos los campos + familiares en Excel',
          icon: <FileSpreadsheet className="w-6 h-6" />,
          color: 'emerald',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.INSCRIPCIONES_ANUALES,
          title: 'Inscripciones Anuales',
          description: 'Estado de pagos y documentación',
          icon: <FileText className="w-6 h-6" />,
          color: 'yellow',
          badge: 'Nuevo'
        },
        {
          type: ReportType.CONTACTOS_EMERGENCIA,
          title: 'Contactos de Emergencia',
          description: 'Datos médicos y contactos familiares',
          icon: <Users className="w-6 h-6" />,
          color: 'red',
          badge: 'Nuevo'
        },
        {
          type: ReportType.DOCUMENTACION_PENDIENTE,
          title: 'Documentación Pendiente',
          description: 'Scouts con docs o pagos incompletos',
          icon: <FileText className="w-6 h-6" />,
          color: 'orange',
          badge: 'Nuevo'
        },
        {
          type: ReportType.RANKING_PATRULLAS,
          title: 'Ranking de Patrullas',
          description: 'Puntajes y posiciones por rama',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'indigo',
          badge: 'Nuevo'
        },
      ]
    },
    {
      name: 'Reportes Estratégicos',
      reports: [
        {
          type: ReportType.DASHBOARD_EJECUTIVO,
          title: 'Dashboard Ejecutivo',
          description: 'KPIs, tendencias y alertas del grupo',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'emerald',
          badge: 'Nuevo'
        },
        {
          type: ReportType.REPORTE_FINANCIERO_INSCRIPCION,
          title: 'Finanzas de Inscripción (Grupo)',
          description: 'Ingresos por Inscripción Anual del grupo scout',
          icon: <FileText className="w-6 h-6" />,
          color: 'teal',
          badge: 'Nuevo'
        },
        {
          type: ReportType.REPORTE_FINANCIERO_RAMA,
          title: 'Finanzas Operativas (Rama)',
          description: 'Ingresos/egresos del módulo Finanzas por período',
          icon: <FileText className="w-6 h-6" />,
          color: 'cyan',
          badge: 'Nuevo'
        },
        {
          type: ReportType.REPORTE_ACTIVIDADES,
          title: 'Reporte de Actividades',
          description: 'Programas ejecutados y participación',
          icon: <Calendar className="w-6 h-6" />,
          color: 'cyan',
          badge: 'Nuevo'
        },
        {
          type: ReportType.REPORTE_INVENTARIO,
          title: 'Reporte de Inventario',
          description: 'Stock, préstamos y movimientos',
          icon: <FileText className="w-6 h-6" />,
          color: 'violet',
          badge: 'Nuevo'
        },
      ]
    },
    {
      name: 'Impresiones Masivas',
      reports: [
        {
          type: ReportType.DNI_SCOUTS,
          title: 'DNI de Scouts',
          description: 'Documentos de identidad de scouts (PDF único)',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'sky',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.DNI_SCOUTS_SPLIT,
          title: 'DNI Scouts (múltiples PDF)',
          description: 'DNI dividido en archivos de máx. 600KB',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'cyan',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.DNI_FAMILIARES,
          title: 'DNI de Familiares',
          description: 'Documentos de identidad de familiares',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'fuchsia',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.DNI_FAMILIARES_SPLIT,
          title: 'DNI Familiares (múltiples PDF)',
          description: 'DNI dividido en archivos de máx. 600KB',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'purple',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.DNGI03_WORD_POR_SCOUT,
          title: 'Persona',
          description: 'Ficha DNGI-03 en Word de un scout, dirigente o miembro del comité',
          icon: <FileText className="w-6 h-6" />,
          color: 'blue',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.DNI_SCOUT_APODERADO_POR_SCOUT,
          title: 'DNI Scout + Apoderado (por scout)',
          description: '1 PDF por scout con scout primero y apoderado',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'emerald',
          badge: '¡Nuevo!'
        },
      ]
    }
  ];

  // Handler para exportar reportes
  const handleExportReport = async (
    format: ExportFormat
  ): Promise<ReportGenerationResult> => {
    if (!selectedReportType) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'Selecciona un tipo de reporte',
      };
    }

    const metadata = generateReportMetadata();

    try {
      switch (selectedReportType) {
        case ReportType.SCOUT_PROFILE:
          return await exportScoutReport(format, metadata);

        case ReportType.ATTENDANCE:
          return await exportAttendanceReport(format, metadata);

        case ReportType.PROGRESS:
          return await exportProgressReport(format, metadata);

        case ReportType.ESPECIALIDADES:
          return await exportEspecialidadesReport(format, metadata);

        case ReportType.ESPECIALIDADES_DETALLE:
          return await exportEspecialidadesDetalleReport(format, metadata);

        case ReportType.INSCRIPCIONES_ANUALES:
          return await exportInscripcionesAnualesReport(format, metadata);

        case ReportType.CONTACTOS_EMERGENCIA:
          return await exportContactosEmergenciaReport(format, metadata);

        case ReportType.DOCUMENTACION_PENDIENTE:
          return await exportDocumentacionPendienteReport(format, metadata);

        case ReportType.RANKING_PATRULLAS:
          return await exportRankingPatrullasReport(format, metadata);

        case ReportType.DASHBOARD_EJECUTIVO:
          return await exportDashboardEjecutivoReport(format, metadata);

        case ReportType.REPORTE_FINANCIERO_INSCRIPCION:
          return await exportFinancieroInscripcionReport(format, metadata);

        case ReportType.REPORTE_FINANCIERO_RAMA:
          return await exportFinancieroRamaReport(format, metadata);

        case ReportType.REPORTE_FINANCIERO:
          return await exportFinancieroRamaReport(format, metadata);

        case ReportType.REPORTE_ACTIVIDADES:
          return await exportActividadesReport(format, metadata);

        case ReportType.REPORTE_INVENTARIO:
          return await exportInventarioReport(format, metadata);

        case ReportType.DNI_SCOUTS:
          return await exportDniScouts(format);
          
        case ReportType.DNI_SCOUTS_SPLIT:
          return await exportDniScoutsSplit(format);

        case ReportType.DNI_FAMILIARES:
          return await exportDniFamiliares(format);
          
        case ReportType.DNI_FAMILIARES_SPLIT:
          return await exportDniFamiliaresSplit(format);

        case ReportType.DNGI03_WORD_POR_SCOUT:
          return await exportDngi03WordPorScout(format);

        case ReportType.DNI_SCOUT_APODERADO_POR_SCOUT:
          return await exportDniScoutApoderadoPorScout(format);

        default:
          return {
            status: 'error' as any,
            fileName: 'error',
            error: 'Tipo de reporte no soportado',
          };
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  // Exportar reporte de Scout
  const exportScoutReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    if (!scoutId) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'Ingresa el ID del scout',
      };
    }

    const scoutData = await getScoutData(scoutId);
    if (!scoutData) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'No se encontró información del scout',
      };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <ScoutReportTemplate scout={scoutData} metadata={metadata} />,
        `reporte_scout_${scoutData.numeroRegistro}`
      );
    } else {
      const doc = createScoutReportDOCX(scoutData, metadata);
      return await generateAndDownloadDOCX(
        doc,
        `reporte_scout_${scoutData.numeroRegistro}`
      );
    }
  };

  // Exportar reporte de asistencia
  const exportAttendanceReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const attendanceData = await getAttendanceData(filters);
    
    if (attendanceData.length === 0) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'No se encontraron datos de asistencia',
      };
    }

    const dateRange = {
      from: filters.dateFrom || '2024-01-01',
      to: filters.dateTo || new Date().toISOString().split('T')[0],
    };

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <AttendanceReportTemplate
          data={attendanceData}
          metadata={metadata}
          dateRange={dateRange}
        />,
        'reporte_asistencia'
      );
    } else {
      const doc = createAttendanceReportDOCX(attendanceData, metadata, dateRange);
      return await generateAndDownloadDOCX(doc, 'reporte_asistencia');
    }
  };

  // Exportar reporte de progreso
  const exportProgressReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const progressData = await getProgressData(filters);
    
    if (progressData.length === 0) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'No se encontraron datos de progreso',
      };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <ProgressReportTemplate data={progressData} metadata={metadata} />,
        'reporte_progreso'
      );
    } else {
      const doc = createProgressReportDOCX(progressData, metadata);
      return await generateAndDownloadDOCX(doc, 'reporte_progreso');
    }
  };

  // Exportar reporte de especialidades (Dashboard para dirigentes y padres)
  const exportEspecialidadesReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    try {
      const especialidadesData = await getEspecialidadesReportData(especialidadesRama || undefined);
      
      if (especialidadesData.scouts.length === 0) {
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'No se encontraron datos de especialidades',
        };
      }

      const ramaSlug = especialidadesRama ? `_${especialidadesRama.toLowerCase()}` : '';
      const fileName = `reporte_especialidades${ramaSlug}`;

      if (format === ExportFormat.PDF) {
        return await generateAndDownloadPDF(
          <EspecialidadesReportTemplate data={especialidadesData} metadata={metadata} />,
          fileName
        );
      } else {
        // Para DOCX, crear un documento estructurado
        const { Document, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle, Packer } = await import('docx');
        
        const { dashboard } = especialidadesData;
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              // Título principal
              new Paragraph({
                children: [
                  new TextRun({
                    text: '📚 Reporte de Especialidades Scout',
                    bold: true,
                    size: 48,
                    color: '1E3A5F',
                  }),
                ],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${especialidadesRama || 'Todas las Ramas'} • ${metadata.organizacion}`,
                    size: 24,
                    color: '64748B',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Sección de KPIs
              new Paragraph({
                children: [new TextRun({ text: '📊 Resumen General', bold: true, size: 32, color: '1E3A5F' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              // Tabla de KPIs
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({ children: [new TextRun({ text: String(dashboard.totalScouts), bold: true, size: 36 })] }),
                          new Paragraph({ children: [new TextRun({ text: 'Scouts con Especialidades', size: 20, color: '64748B' })] }),
                        ],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({ children: [new TextRun({ text: String(dashboard.especialidadesCompletadas), bold: true, size: 36, color: '10B981' })] }),
                          new Paragraph({ children: [new TextRun({ text: 'Completadas', size: 20, color: '64748B' })] }),
                        ],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({ children: [new TextRun({ text: String(dashboard.especialidadesEnProgreso), bold: true, size: 36, color: 'F59E0B' })] }),
                          new Paragraph({ children: [new TextRun({ text: 'En Progreso', size: 20, color: '64748B' })] }),
                        ],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({ children: [new TextRun({ text: `${dashboard.tasaCompletado.toFixed(1)}%`, bold: true, size: 36, color: '8B5CF6' })] }),
                          new Paragraph({ children: [new TextRun({ text: 'Tasa de Éxito', size: 20, color: '64748B' })] }),
                        ],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                      }),
                    ],
                  }),
                ],
              }),

              // Avance por rama
              new Paragraph({
                children: [new TextRun({ text: '🏕️ Avance por Rama', bold: true, size: 32, color: '1E3A5F' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              ...dashboard.porRama.map(rama => 
                new Paragraph({
                  children: [
                    new TextRun({ text: `${rama.rama}: `, bold: true }),
                    new TextRun({ text: `${rama.scouts} scouts, ${rama.especialidades} asignadas, ${rama.completadas} completadas (${rama.porcentaje.toFixed(0)}%)` }),
                  ],
                  spacing: { after: 100 },
                })
              ),

              // Scouts destacados
              new Paragraph({
                children: [new TextRun({ text: '🌟 Scouts Destacados', bold: true, size: 32, color: '1E3A5F' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),

              ...dashboard.scoutsDestacados.slice(0, 5).map((scout, i) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${i + 1}. ${scout.nombre}`, bold: true }),
                    new TextRun({ text: ` (${scout.rama}) - ${scout.especialidadesCompletadas} especialidades completadas` }),
                  ],
                  spacing: { after: 100 },
                })
              ),

              // Mensaje para padres
              new Paragraph({
                children: [new TextRun({ text: '💬 Mensaje para Padres de Familia', bold: true, size: 32, color: '1E3A5F' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 600, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Las especialidades son áreas de conocimiento que los scouts desarrollan según sus intereses. ',
                  }),
                  new TextRun({
                    text: 'Cada una tiene tres fases: Exploración (investigación), Taller (práctica) y Desafío (aplicación real). ',
                  }),
                  new TextRun({
                    text: '¡Motiven a sus hijos a elegir especialidades según sus intereses genuinos!',
                  }),
                ],
                spacing: { after: 200 },
              }),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.docx`;
        a.click();
        URL.revokeObjectURL(url);

        return {
          status: 'success' as any,
          fileName: `${fileName}.docx`,
        };
      }
    } catch (error) {
      console.error('Error exportando especialidades:', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  const exportEspecialidadesDetalleReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const { data, error } = await supabase.rpc('api_reporte_especialidades_detalle', {
      p_rama: especialidadesRama || null,
    });

    if (error) throw error;
    if (!data?.success) {
      return { status: 'error' as any, fileName: 'error', error: data?.error || 'No se pudo obtener el detalle' };
    }

    const detalle = data.detalle || [];
    const resumen = data.resumen || [];
    if (detalle.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron datos de especialidades detalladas' };
    }

    const fileName = `reporte_especialidades_detalle${especialidadesRama ? `_${especialidadesRama.toLowerCase()}` : ''}`;

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Reporte Detallado de Especialidades"
          subtitle={especialidadesRama ? `Rama: ${especialidadesRama}` : 'Todas las ramas'}
          metadata={metadata}
          summary={[
            { label: 'Asignaciones', value: detalle.length },
            { label: 'Scouts con especialidades', value: resumen.length },
            { label: 'Completadas', value: detalle.filter((d: any) => d.esta_completada).length },
          ]}
          rows={detalle.slice(0, 25).map((d: any) => ({
            label: `${d.nombre_scout} - ${d.especialidad_nombre}`,
            value: d.esta_completada ? 'Completada' : 'En progreso',
          }))}
        />,
        fileName
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Reporte Detallado de Especialidades', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Rama: ${especialidadesRama || 'Todas'}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Total asignaciones: ${detalle.length}` })] }),
          new Paragraph({ children: [] }),
          ...detalle.slice(0, 100).map((d: any) => new Paragraph({
            children: [new TextRun({ text: `${d.nombre_scout} | ${d.especialidad_nombre} | ${d.esta_completada ? 'Completada' : 'En progreso'}` })],
          })),
        ],
      }],
    });
    return await generateAndDownloadDOCX(doc, fileName);
  };

  const exportInscripcionesAnualesReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const ano = filters.year || new Date().getFullYear();
    const data = await getInscripcionesAnuales(ano, filters.rama || undefined);
    if (data.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron inscripciones para el filtro seleccionado' };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <InscripcionesReportTemplate data={data} metadata={metadata} ano={ano} />,
        `reporte_inscripciones_${ano}`
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: `Reporte de Inscripciones ${ano}`, bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        ...data.slice(0, 120).map((i: any) => new Paragraph({
          children: [new TextRun({ text: `${i.codigoScout} | ${i.nombreCompleto} | ${i.rama} | ${i.estadoPago}` })],
        })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, `reporte_inscripciones_${ano}`);
  };

  const exportContactosEmergenciaReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const data = await getContactosEmergencia(filters.rama || undefined);
    if (data.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron contactos de emergencia' };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <ContactosEmergenciaReportTemplate data={data} metadata={metadata} rama={filters.rama} />,
        'reporte_contactos_emergencia'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Reporte de Contactos de Emergencia', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        ...data.slice(0, 100).map((s: any) => new Paragraph({
          children: [new TextRun({ text: `${s.codigoScout} | ${s.nombreScout} ${s.apellidoScout}` })],
        })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, 'reporte_contactos_emergencia');
  };

  const exportDocumentacionPendienteReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const ano = filters.year || new Date().getFullYear();
    const data = await getDocumentacionPendiente(ano);
    if (data.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron pendientes para el período seleccionado' };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <DocumentacionPendienteReportTemplate data={data} metadata={metadata} ano={ano} />,
        `reporte_documentacion_pendiente_${ano}`
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: `Documentación Pendiente ${ano}`, bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        ...data.slice(0, 120).map((d: any) => new Paragraph({
          children: [new TextRun({ text: `${d.codigoScout} | ${d.nombreCompleto} | ${d.documentosFaltantes?.join(', ') || 'Sin detalle'}` })],
        })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, `reporte_documentacion_pendiente_${ano}`);
  };

  const exportRankingPatrullasReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const data = await getRankingPatrullas(filters.rama || undefined, filters.dateFrom, filters.dateTo);
    if (data.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No hay datos de ranking para los filtros seleccionados' };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <RankingPatrullasReportTemplate
          data={data}
          metadata={metadata}
          dateRange={filters.dateFrom && filters.dateTo ? { from: filters.dateFrom, to: filters.dateTo } : undefined}
        />,
        'reporte_ranking_patrullas'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Ranking de Patrullas', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        ...data.slice(0, 50).map((r: any) => new Paragraph({
          children: [new TextRun({ text: `#${r.posicion} ${r.patrullaNombre} (${r.rama}) - ${r.totalPuntos} pts` })],
        })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, 'reporte_ranking_patrullas');
  };

  const exportDashboardEjecutivoReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const dashboard = await ReportsService.getDashboardEjecutivo();
    const kpis: any = dashboard?.kpis_principales || {};
    const tendencias: any = dashboard?.tendencias || {};
    const comparativo = dashboard?.comparativo_periodo_anterior || {};
    const alertas = dashboard?.alertas || [];

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Dashboard Ejecutivo"
          subtitle="KPIs Gerenciales para Toma de Decisiones"
          metadata={metadata}
          summary={[
            { label: 'Scouts Activos', value: kpis.scouts_activos ?? 0 },
            { label: 'Dirigentes Activos', value: kpis.dirigentes_activos ?? 0 },
            { label: 'Asistencia Promedio', value: `${kpis.asistencia_promedio ?? 0}%` },
            { label: 'Balance Financiero', value: `S/ ${(kpis.balance_financiero ?? 0).toFixed(2)}` },
            { label: 'Tasa de Retencion', value: `${kpis.tasa_retencion ?? 0}%` },
            { label: 'Satisfaccion Actividades', value: `${kpis.satisfaccion_actividades ?? 0}/5` },
            { label: '', value: '' },
            { label: 'TENDENCIAS', value: '' },
            { label: 'Crecimiento Scouts', value: `${tendencias.crecimiento_scouts ?? 0} (${comparativo.scouts?.variacion ?? 0}%)` },
            { label: 'Actividades del Mes', value: tendencias.actividades_mes ?? 0 },
            { label: 'Variacion Asistencia', value: `${comparativo.asistencia?.variacion ?? 0}%` },
            { label: 'Variacion Ingresos', value: `${comparativo.ingresos?.variacion ?? 0}%` },
            { label: '', value: '' },
            { label: 'ALERTAS ACTIVAS', value: alertas.length },
            ...alertas.slice(0, 5).map((a: any) => ({
              label: `${a.tipo.toUpperCase()}`,
              value: a.mensaje
            }))
          ]}
        />,
        'dashboard_ejecutivo'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Dashboard Ejecutivo - KPIs Gerenciales', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'KPIs PRINCIPALES', bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Scouts Activos: ${kpis.scouts_activos ?? 0}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Dirigentes Activos: ${kpis.dirigentes_activos ?? 0}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Asistencia Promedio: ${kpis.asistencia_promedio ?? 0}%` })] }),
        new Paragraph({ children: [new TextRun({ text: `Balance Financiero: S/ ${(kpis.balance_financiero ?? 0).toFixed(2)}` })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'TENDENCIAS', bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Crecimiento Scouts: ${tendencias.crecimiento_scouts ?? 0} (${comparativo.scouts?.variacion ?? 0}%)` })] }),
        new Paragraph({ children: [new TextRun({ text: `Actividades Mes: ${tendencias.actividades_mes ?? 0}` })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: `ALERTAS (${alertas.length})`, bold: true, size: 24 })] }),
        ...alertas.map((a: any) => new Paragraph({ children: [new TextRun({ text: `[${a.tipo.toUpperCase()}] ${a.mensaje}` })] })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, 'dashboard_ejecutivo');
  };

  const exportFinancieroInscripcionReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const ano = filters.year || new Date().getFullYear();
    const data = await getInscripcionesAnuales(ano, filters.rama || undefined);

    const totalInscritos = data.length;
    const pagados = data.filter((d: any) => d.estadoPago === 'PAGADO');
    const pendientes = data.filter((d: any) => d.estadoPago !== 'PAGADO');
    const totalPagado = pagados.reduce((sum: number, d: any) => sum + Number(d.montoInscripcion || 0), 0);
    const totalPendiente = pendientes.reduce((sum: number, d: any) => sum + Number(d.montoInscripcion || 0), 0);

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Finanzas de Inscripción (Grupo)"
          subtitle={`Año ${ano}${filters.rama ? ` • Rama: ${filters.rama}` : ''}`}
          metadata={metadata}
          summary={[
            { label: 'Inscritos', value: totalInscritos },
            { label: 'Pagados', value: pagados.length },
            { label: 'Pendientes', value: pendientes.length },
            { label: 'Ingresos cobrados', value: `S/ ${totalPagado.toFixed(2)}` },
            { label: 'Por cobrar', value: `S/ ${totalPendiente.toFixed(2)}` },
          ]}
          rows={data.slice(0, 40).map((d: any) => ({
            label: `${d.codigoScout} | ${d.nombreCompleto}`,
            value: `${d.estadoPago} • S/ ${Number(d.montoInscripcion || 0).toFixed(2)}`,
          }))}
        />,
        `reporte_financiero_inscripcion_${ano}`
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Finanzas de Inscripción (Grupo)', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Año: ${ano}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Inscritos: ${totalInscritos} | Pagados: ${pagados.length} | Pendientes: ${pendientes.length}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Cobrado: S/ ${totalPagado.toFixed(2)} | Por cobrar: S/ ${totalPendiente.toFixed(2)}` })] }),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, `reporte_financiero_inscripcion_${ano}`);
  };

  const exportFinancieroRamaReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const year = filters.year || new Date().getFullYear();
    const monthFrom = Number(filters.monthFrom || 1);
    const monthTo = Number(filters.monthTo || 12);
    const fechaInicio = `${year}-${String(monthFrom).padStart(2, '0')}-01`;
    const fechaFin = new Date(year, monthTo, 0).toISOString().split('T')[0];
    const { transacciones, total } = await FinanzasService.listarTransacciones({ fechaInicio, fechaFin, limite: 500, offset: 0 });

    const ingresos = transacciones.filter(t => t.tipo === 'INGRESO');
    const egresos = transacciones.filter(t => t.tipo === 'EGRESO');
    const totalIngresos = ingresos.reduce((sum, t) => sum + Number(t.monto || 0), 0);
    const totalEgresos = egresos.reduce((sum, t) => sum + Number(t.monto || 0), 0);

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Reporte Financiero"
          subtitle={`Periodo: ${fechaInicio} a ${fechaFin}`}
          metadata={metadata}
          summary={[
            { label: 'Transacciones', value: total },
            { label: 'Ingresos', value: `S/ ${totalIngresos.toFixed(2)}` },
            { label: 'Egresos', value: `S/ ${totalEgresos.toFixed(2)}` },
            { label: 'Balance', value: `S/ ${(totalIngresos - totalEgresos).toFixed(2)}` },
          ]}
          rows={transacciones.slice(0, 40).map(t => ({
            label: `${t.fecha_transaccion} | ${t.descripcion || t.categoria}`,
            value: `${t.tipo} S/ ${Number(t.monto || 0).toFixed(2)}`,
          }))}
        />,
        'reporte_financiero'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Reporte Financiero', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Periodo: ${fechaInicio} - ${fechaFin}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Ingresos: S/ ${totalIngresos.toFixed(2)} | Egresos: S/ ${totalEgresos.toFixed(2)} | Balance: S/ ${(totalIngresos - totalEgresos).toFixed(2)}` })] }),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, 'reporte_financiero');
  };

  const exportActividadesReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const anio = filters.year || new Date().getFullYear();
    const rama = filters.rama || undefined;
    
    const reporte = await ReportsService.getReporteActividadesGerencial({
      ano: anio,
      rama: rama
    });

    const operacionales = reporte?.kpis_operacionales || {};
    const financieros = reporte?.kpis_financieros || {};
    const impacto = reporte?.kpis_impacto || {};
    const topActividades = impacto?.top_actividades || [];

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Reporte de Actividades - Metricas Gerenciales"
          subtitle={`Año ${anio}${rama ? ` - Rama: ${rama}` : ''}`}
          metadata={metadata}
          summary={[
            { label: 'Total Actividades', value: operacionales.total_actividades ?? 0 },
            { label: 'Participacion Promedio', value: `${operacionales.participacion_promedio ?? 0} scouts` },
            { label: 'Tasa de Asistencia', value: `${operacionales.tasa_asistencia ?? 0}%` },
            { label: '', value: '' },
            { label: 'FINANCIERO', value: '' },
            { label: 'Presupuesto Planificado', value: `S/ ${(financieros.presupuesto_planificado ?? 0).toFixed(2)}` },
            { label: 'Presupuesto Ejecutado', value: `S/ ${(financieros.presupuesto_ejecutado ?? 0).toFixed(2)}` },
            { label: 'Eficiencia Presupuestal', value: `${financieros.eficiencia_presupuestal ?? 0}%` },
            { label: 'Costo Promedio/Scout', value: `S/ ${(financieros.costo_promedio_scout ?? 0).toFixed(2)}` },
            { label: '', value: '' },
            { label: 'IMPACTO', value: '' },
            { label: 'Objetivos Cumplidos', value: `${impacto.objetivos_cumplidos ?? 0}/${impacto.objetivos_total ?? 0}` },
            { label: 'Tasa Cumplimiento', value: `${impacto.tasa_cumplimiento ?? 0}%` },
            { label: 'Satisfaccion Promedio', value: `${impacto.satisfaccion_promedio ?? 0}/5` },
            { label: '', value: '' },
            { label: 'TOP 5 ACTIVIDADES MAS EXITOSAS', value: '' },
            ...topActividades.map((a: any) => ({
              label: a.nombre,
              value: `${a.tasa_asistencia}% asistencia - Calif: ${a.calificacion}/5`
            }))
          ]}
        />,
        'reporte_actividades_gerencial'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Reporte de Actividades - Metricas Gerenciales', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Año ${anio}${rama ? ` - Rama: ${rama}` : ''}`, size: 24 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'KPIs OPERACIONALES', bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Total Actividades: ${operacionales.total_actividades ?? 0}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Participacion Promedio: ${operacionales.participacion_promedio ?? 0} scouts` })] }),
        new Paragraph({ children: [new TextRun({ text: `Tasa de Asistencia: ${operacionales.tasa_asistencia ?? 0}%` })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'KPIs FINANCIEROS', bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Presupuesto Planificado: S/ ${(financieros.presupuesto_planificado ?? 0).toFixed(2)}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Presupuesto Ejecutado: S/ ${(financieros.presupuesto_ejecutado ?? 0).toFixed(2)}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Eficiencia Presupuestal: ${financieros.eficiencia_presupuestal ?? 0}%` })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'KPIs DE IMPACTO', bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `Objetivos Cumplidos: ${impacto.objetivos_cumplidos ?? 0}/${impacto.objetivos_total ?? 0} (${impacto.tasa_cumplimiento ?? 0}%)` })] }),
        new Paragraph({ children: [new TextRun({ text: `Satisfaccion Promedio: ${impacto.satisfaccion_promedio ?? 0}/5` })] }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: 'TOP 5 ACTIVIDADES MAS EXITOSAS', bold: true, size: 24 })] }),
        ...topActividades.map((a: any) => new Paragraph({
          children: [new TextRun({ text: `${a.nombre} - ${a.tasa_asistencia}% asist. - Calif: ${a.calificacion}/5` })]
        })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, 'reporte_actividades_gerencial');
  };

  const exportInventarioReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const items = await InventarioService.getAllItems();
    const total = items.length;
    const disponibles = items.filter((i: any) => i.estado === 'DISPONIBLE').length;
    const prestados = items.filter((i: any) => i.estado === 'PRESTADO').length;

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Reporte de Inventario"
          metadata={metadata}
          summary={[
            { label: 'Items totales', value: total },
            { label: 'Disponibles', value: disponibles },
            { label: 'Prestados', value: prestados },
          ]}
          rows={items.slice(0, 40).map((i: any) => ({
            label: `${i.codigo || ''} ${i.nombre || 'Item'}`,
            value: `${i.categoria || ''} | ${i.estado || ''}`,
          }))}
        />,
        'reporte_inventario'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Reporte de Inventario', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        ...items.slice(0, 120).map((i: any) => new Paragraph({ children: [new TextRun({ text: `${i.codigo || ''} | ${i.nombre || 'Item'} | ${i.categoria || '-'} | ${i.estado || '-'}` })] })),
      ]}],
    });
    return await generateAndDownloadDOCX(doc, 'reporte_inventario');
  };

  // =====================================================
  // FUNCIONES DE EXPORTACIÓN - REPORTES MASIVOS
  // =====================================================

  const exportDniScouts = async (format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      const { personas, showAlert, alertMessage } = await getAllScoutsWithDni(ramaFilter);
      
      if (personas.length === 0) {
        showError("No hay scouts con documentos de identidad cargados");
        return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
      }

      // Mostrar alerta en UI antes de generar
      if (showAlert) {
        info(alertMessage || "El archivo supera el límite recomendado de 600KB. Se generará de todas formas.");
      }

      const ramaSuffix = ramaFilter !== 'TODAS' ? `_${ramaFilter}` : '';
      const fileName = `DNI_Scouts${ramaSuffix}_${new Date().toISOString().split('T')[0]}`;
      const metadata = generateMasiveReportMetadata();
      
      if (format === 'pdf') {
        const result = await generateAndDownloadPDF(
          <DniCollectionTemplate personas={personas} tipo="scouts" metadata={metadata} />,
          fileName
        );
        return { status: result.status, fileName: result.fileName };
      } else {
        // Para Word, crear documento con información
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'DNI de Scouts', bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ children: [new TextRun({ text: `Generado: ${new Date().toLocaleDateString('es-PE')}`, size: 20 })] }),
              new Paragraph({ children: [] }),
              ...personas.flatMap(persona => [
                new Paragraph({
                  children: [new TextRun({ text: `${persona.nombres} ${persona.apellidos}`, bold: true, size: 24 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `DNI Anverso: ${persona.dniAnversoUrl ? 'Cargado' : 'No disponible'}` })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `DNI Reverso: ${persona.dniReversoUrl ? 'Cargado' : 'No disponible'}` })],
                }),
                new Paragraph({ children: [] }),
              ]),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.docx`;
        a.click();
        URL.revokeObjectURL(url);

        return { status: 'success' as any, fileName: `${fileName}.docx` };
      }
    } catch (error) {
      console.error('Error exportando DNI de scouts:', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  // Exportar DNI de Scouts dividido en múltiples PDFs (máx 600KB cada uno)
  const exportDniScoutsSplit = async (_format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      const { personas } = await getAllScoutsWithDni(ramaFilter);
      
      if (personas.length === 0) {
        showError("No hay scouts con documentos de identidad cargados");
        return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
      }

      const grupos = splitPersonasForPdf(personas);
      const metadata = generateMasiveReportMetadata();
      const ramaSuffix = ramaFilter !== 'TODAS' ? `_${ramaFilter}` : '';
      const fechaStr = new Date().toISOString().split('T')[0];
      
      info(`Se generarán ${grupos.length} archivo(s) PDF para ${personas.length} scouts.`);

      // Generar cada PDF secuencialmente
      for (let i = 0; i < grupos.length; i++) {
        const grupo = grupos[i];
        if (grupo.length === 0) continue;
        
        const fileName = `DNI_Scouts${ramaSuffix}_Parte${i + 1}de${grupos.length}_${fechaStr}`;
        await generateAndDownloadPDF(
          <DniCollectionTemplate personas={grupo} tipo="scouts" metadata={metadata} />,
          fileName
        );
        
        // Pequeña pausa entre descargas para evitar problemas
        if (i < grupos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return { status: 'success' as any, fileName: `DNI_Scouts${ramaSuffix}_${grupos.length}archivos.zip` };
    } catch (error) {
      console.error('Error exportando DNI de scouts (split):', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  const exportDniFamiliares = async (format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      const { personas, showAlert, alertMessage } = await getAllFamiliaresWithDni(ramaFilter);
      
      if (personas.length === 0) {
        showError("No hay familiares con documentos de identidad cargados");
        return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
      }

      // Mostrar alerta en UI antes de generar
      if (showAlert) {
        info(alertMessage || "El archivo supera el límite recomendado de 600KB. Se generará de todas formas.");
      }

      const ramaSuffix = ramaFilter !== 'TODAS' ? `_${ramaFilter}` : '';
      const fileName = `DNI_Familiares${ramaSuffix}_${new Date().toISOString().split('T')[0]}`;
      const metadata = generateMasiveReportMetadata();
      
      if (format === 'pdf') {
        const result = await generateAndDownloadPDF(
          <DniCollectionTemplate personas={personas} tipo="familiares" metadata={metadata} />,
          fileName
        );
        return { status: result.status, fileName: result.fileName };
      } else {
        // Para Word, crear documento con información
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'DNI de Familiares', bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ children: [new TextRun({ text: `Generado: ${new Date().toLocaleDateString('es-PE')}`, size: 20 })] }),
              new Paragraph({ children: [] }),
              ...personas.flatMap(persona => [
                new Paragraph({
                  children: [new TextRun({ text: `${persona.nombres} ${persona.apellidos} - ${persona.parentesco || 'Sin parentesco'}`, bold: true, size: 24 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Scout relacionado: ${persona.scoutAsociado || 'No especificado'}` })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `DNI Anverso: ${persona.dniAnversoUrl ? 'Cargado' : 'No disponible'}` })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: `DNI Reverso: ${persona.dniReversoUrl ? 'Cargado' : 'No disponible'}` })],
                }),
                new Paragraph({ children: [] }),
              ]),
            ],
          }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.docx`;
        a.click();
        URL.revokeObjectURL(url);

        return { status: 'success' as any, fileName: `${fileName}.docx` };
      }
    } catch (error) {
      console.error('Error exportando DNI de familiares:', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  // Exportar DNI de Familiares dividido en múltiples PDFs (máx 600KB cada uno)
  const exportDniFamiliaresSplit = async (_format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      const { personas } = await getAllFamiliaresWithDni(ramaFilter);
      
      if (personas.length === 0) {
        showError("No hay familiares con documentos de identidad cargados");
        return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
      }

      const grupos = splitPersonasForPdf(personas);
      const metadata = generateMasiveReportMetadata();
      const ramaSuffix = ramaFilter !== 'TODAS' ? `_${ramaFilter}` : '';
      const fechaStr = new Date().toISOString().split('T')[0];
      
      info(`Se generarán ${grupos.length} archivo(s) PDF para ${personas.length} familiares.`);

      // Generar cada PDF secuencialmente
      for (let i = 0; i < grupos.length; i++) {
        const grupo = grupos[i];
        if (grupo.length === 0) continue;
        
        const fileName = `DNI_Familiares${ramaSuffix}_Parte${i + 1}de${grupos.length}_${fechaStr}`;
        await generateAndDownloadPDF(
          <DniCollectionTemplate personas={grupo} tipo="familiares" metadata={metadata} />,
          fileName
        );
        
        // Pequeña pausa entre descargas para evitar problemas
        if (i < grupos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return { status: 'success' as any, fileName: `DNI_Familiares${ramaSuffix}_${grupos.length}archivos.zip` };
    } catch (error) {
      console.error('Error exportando DNI de familiares (split):', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  // Construye los datos (formato ScoutReportData) para la ficha DNGI-03
  // a partir de un dirigente o un miembro del comité de padres.
  const buildPersonaReportData = async (
    tipo: 'DIRIGENTE' | 'COMITE',
    id: string
  ): Promise<any | null> => {
    if (tipo === 'DIRIGENTE') {
      const dirigente: any = await DirigenteService.obtenerDirigentePorId(id);
      if (!dirigente?.persona) return null;
      const p = dirigente.persona;
      return {
        id: dirigente.id,
        nombre: p.nombres || '',
        apellido: p.apellidos || '',
        fechaNacimiento: p.fecha_nacimiento || '',
        edad: 0,
        sexo: p.sexo || '',
        tipoDocumento: p.tipo_documento || '',
        numeroDocumento: p.numero_documento || '',
        rama: dirigente.cargo || 'DIRIGENTE',
        numeroRegistro: dirigente.codigo_credencial || '',
        fechaIngreso: '',
        direccion: p.direccion || '',
        departamento: p.departamento || '',
        provincia: p.provincia || '',
        distrito: p.distrito || '',
        codigoPostal: p.codigo_postal || '',
        centroEstudio: dirigente.centro_estudios || '',
        anioEstudios: dirigente.ciclo_anio_estudios || '',
        telefono: p.telefono || '',
        celular: p.celular || '',
        email: p.correo || '',
        correoInstitucional: p.correo_institucional || '',
        religion: p.religion || '',
        grupoSanguineo: p.grupo_sanguineo || '',
        factorSanguineo: p.factor_sanguineo || '',
        seguroMedico: p.seguro_medico || '',
        tipoDiscapacidad: p.tipo_discapacidad || '',
        carnetConadis: p.carnet_conadis || '',
        descripcionDiscapacidad: p.descripcion_discapacidad || '',
        familiares: [],
      };
    }

    // COMITE: los datos vienen completos en la lista cargada
    const m: any = comiteList.find((c) => c.id === id);
    if (!m) return null;
    return {
      id: m.id,
      nombre: m.nombres || '',
      apellido: m.apellidos || '',
      fechaNacimiento: m.fecha_nacimiento && m.fecha_nacimiento !== '1900-01-01' ? m.fecha_nacimiento : '',
      edad: 0,
      sexo: m.sexo || '',
      tipoDocumento: m.tipo_documento || '',
      numeroDocumento: m.numero_documento || '',
      rama: m.cargo || 'COMITÉ',
      numeroRegistro: m.codigo_asociado || '',
      fechaIngreso: '',
      direccion: m.direccion || '',
      departamento: m.departamento || '',
      provincia: m.provincia || '',
      distrito: m.distrito || '',
      codigoPostal: '',
      centroEstudio: m.centro_estudio || '',
      anioEstudios: m.anio_estudios || '',
      telefono: m.telefono || m.celular || '',
      celular: m.celular || '',
      email: m.email || m.correo || '',
      correoInstitucional: '',
      religion: m.religion || '',
      grupoSanguineo: m.grupo_sanguineo || '',
      factorSanguineo: m.factor_sanguineo || '',
      seguroMedico: m.seguro_medico || '',
      tipoDiscapacidad: m.tipo_discapacidad || '',
      carnetConadis: m.carnet_conadis || '',
      descripcionDiscapacidad: m.descripcion_discapacidad || '',
      familiares: [],
    };
  };

  const exportDngi03WordPorScout = async (format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      if (format !== ExportFormat.DOCX) {
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'Este reporte se exporta solo en formato Word',
        };
      }

      // Rama "Persona": dirigente o miembro de comité
      if (personaEntityType !== 'SCOUT') {
        if (!selectedPersonaId) {
          return {
            status: 'error' as any,
            fileName: 'error',
            error: 'Selecciona una persona para exportar',
          };
        }

        const personaData = await buildPersonaReportData(personaEntityType, selectedPersonaId);
        if (!personaData) {
          showError('No se pudo obtener los datos de la persona seleccionada');
          return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
        }

        const doc = createDNGI03WordDocument(personaData as any);
        const blob = await Packer.toBlob(doc);
        const nombre = sanitizeFilePart(personaData.nombre || 'Persona') || 'Persona';
        const apellido = sanitizeFilePart(getFirstSurname(personaData.apellido || '')) || 'Apellido';
        const prefijo = personaEntityType === 'DIRIGENTE' ? 'Ficha_Dirigente' : 'Ficha_Comite';
        saveAs(blob, `${prefijo}_${nombre}${apellido}.docx`);

        return {
          status: 'success' as any,
          fileName: `${prefijo}_${nombre}${apellido}.docx`,
        };
      }

      if (!selectedMassiveScoutId) {
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'Selecciona un scout para exportar uno por uno',
        };
      }

      const { scouts } = await getAllScoutsForMasiveDNGI03(ramaFilter, selectedMassiveScoutId);
      if (scouts.length === 0) {
        showError('No hay scout para exportar con los filtros seleccionados');
        return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
      }

      info(`Se generará ${scouts.length} archivo Word para el scout seleccionado.`);

      for (let i = 0; i < scouts.length; i++) {
        const scout = scouts[i];
        const doc = createDNGI03WordDocument(scout);
        const blob = await Packer.toBlob(doc);

        const nombre = sanitizeFilePart(scout.nombre || 'Scout') || 'Scout';
        const apellido = sanitizeFilePart(getFirstSurname(scout.apellido || '')) || 'Apellido';
        const fileName = `Ficha_Tropa_${nombre}${apellido}.docx`;
        saveAs(blob, fileName);

        if (i < scouts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 450));
        }
      }

      return {
        status: 'success' as any,
        fileName: `Ficha_Tropa_${scouts.length}_archivos.docx`,
      };
    } catch (error) {
      console.error('Error exportando DNGI-03 Word por scout:', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  const exportDniScoutApoderadoPorScout = async (format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      if (format !== ExportFormat.PDF) {
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'Este reporte se exporta solo en formato PDF',
        };
      }

      if (!selectedMassiveScoutId) {
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'Selecciona un scout para exportar uno por uno',
        };
      }

      const { pares, scoutsSinApoderado } = await getScoutsWithApoderadoDni(ramaFilter, selectedMassiveScoutId);
      if (pares.length === 0) {
        showError('No hay scout con apoderado para exportar con los filtros seleccionados');
        return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
      }

      if (scoutsSinApoderado > 0) {
        info(`${scoutsSinApoderado} scout(s) fueron omitidos por no tener familiar marcado como apoderado.`);
      }

      const metadata = generateMasiveReportMetadata();
      const maxBytes = 600 * 1024;
      let excedidos = 0;

      for (let i = 0; i < pares.length; i++) {
        const par = pares[i];
        const nombre = sanitizeFilePart(par.scout.nombres || 'Scout') || 'Scout';
        const apellido = sanitizeFilePart(getFirstSurname(par.scout.apellidos || '')) || 'Apellido';
        const fileName = `DNI_Tropa_${nombre}${apellido}`;

        let bestResult: ReportGenerationResult | null = null;
        const qualities = [0.72, 0.58, 0.45, 0.33];

        for (const quality of qualities) {
          const compressed = await compressPairForPdf(par.scout, par.apoderado, quality);
          const result = await generatePDF(
            <DniScoutApoderadoTemplate
              scout={compressed.scout}
              apoderado={compressed.apoderado}
              metadata={metadata}
            />,
            fileName
          );

          if (!result.blob) {
            bestResult = result;
            break;
          }

          bestResult = result;
          if (result.blob.size <= maxBytes) {
            break;
          }
        }

        if (!bestResult || !bestResult.blob) {
          return {
            status: 'error' as any,
            fileName: 'error',
            error: bestResult?.error || 'No se pudo generar uno de los PDFs',
          };
        }

        if (bestResult.blob.size > maxBytes) {
          excedidos++;
        }

        saveAs(bestResult.blob, `${fileName}.pdf`);

        if (i < pares.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 450));
        }
      }

      if (excedidos > 0) {
        info(`${excedidos} archivo(s) no pudieron bajar de 600KB incluso con compresión máxima.`);
      }

      return {
        status: 'success' as any,
        fileName: `DNI_Tropa_${pares.length}_archivos.pdf`,
      };
    } catch (error) {
      console.error('Error exportando DNI scout + apoderado por scout:', error);
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  const getExportFormatsForReport = (reportType: ReportType | null): ExportFormat[] => {
    if (reportType === ReportType.DNGI03_WORD_POR_SCOUT) {
      return [ExportFormat.DOCX];
    }

    if (reportType === ReportType.DNI_SCOUT_APODERADO_POR_SCOUT) {
      return [ExportFormat.PDF];
    }

    return [ExportFormat.PDF, ExportFormat.DOCX];
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Generador de Reportes</h2>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selecciona el tipo de reporte
        </label>
        
        {reportCategories.map((category) => (
          <div key={category.name} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.reports.map((report) => (
                <button
                  key={report.type}
                  onClick={() => !report.disabled && setSelectedReportType(report.type)}
                  disabled={report.disabled}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left relative
                    ${report.disabled 
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                      : selectedReportType === report.type
                        ? `border-${report.color}-600 bg-${report.color}-50 shadow-md`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  {report.badge && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold bg-green-500 text-white rounded">
                      {report.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${report.disabled 
                          ? 'bg-gray-200' 
                          : selectedReportType === report.type 
                            ? `bg-${report.color}-100` 
                            : 'bg-gray-100'
                        }
                      `}
                    >
                      {report.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{report.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros específicos por tipo de reporte */}
      {selectedReportType && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Configuración del Reporte</h3>

          {selectedReportType === ReportType.SCOUT_PROFILE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un Scout
              </label>
              {loadingScouts ? (
                <div className="text-gray-500 text-sm">Cargando scouts...</div>
              ) : (
                <select
                  value={scoutId}
                  onChange={(e) => setScoutId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Selecciona un scout --</option>
                  {scouts.map((scout) => (
                    <option key={scout.id} value={scout.id}>
                      {scout.codigo_asociado ? `${scout.codigo_asociado} - ` : ''}{scout.persona?.nombres} {scout.persona?.apellidos} ({scout.rama_actual})
                    </option>
                  ))}
                </select>
              )}
              {scoutId && (
                <p className="text-xs text-gray-500 mt-1">
                  ID seleccionado: {scoutId}
                </p>
              )}
            </div>
          )}

          {/* Reporte Excel Completo - Tiene su propio componente */}
          {selectedReportType === ReportType.SCOUTS_EXCEL_COMPLETO && (
            <ScoutsExcelReport />
          )}

          {/* Reporte de Especialidades - Dashboard con filtro y exportación */}
          {selectedReportType === ReportType.ESPECIALIDADES && (
            <div className="space-y-4">
              {/* Selector de rama para PDF/DOCX */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  Filtrar por Rama (para PDF/Word)
                </label>
                <select
                  value={especialidadesRama}
                  onChange={(e) => setEspecialidadesRama(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Todas las ramas</option>
                  <option value="Manada">Manada</option>
                  <option value="Tropa">Tropa</option>
                  <option value="Comunidad">Comunidad</option>
                  <option value="Clan">Clan</option>
                </select>
                <p className="text-xs text-amber-600 mt-2">
                  Este filtro aplica a los reportes PDF y Word. El Excel tiene su propio filtro.
                </p>
              </div>
              {/* Componente de Excel con su propio filtro */}
              <EspecialidadesExcelReport filterRama={especialidadesRama} />
            </div>
          )}

          {/* Reporte de Especialidades DETALLADO - Cada especialidad por scout */}
          {selectedReportType === ReportType.ESPECIALIDADES_DETALLE && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">
                  📊 Reporte Detallado de Especialidades
                </h3>
                <p className="text-xs text-indigo-600">
                  Este reporte muestra <strong>cada especialidad asignada</strong> a cada scout, 
                  incluyendo: estado de fases (Exploración, Taller, Desafío), fechas de inicio/fin, 
                  asesor asignado y notas. Ideal para seguimiento detallado.
                </p>
              </div>
              {/* Componente de Excel Detallado */}
              <EspecialidadesDetalleExcelReport />
            </div>
          )}

          {/* Filtro de rama para reportes masivos de DNI */}
          {(selectedReportType === ReportType.DNI_SCOUTS || 
            selectedReportType === ReportType.DNI_SCOUTS_SPLIT ||
            selectedReportType === ReportType.DNI_FAMILIARES ||
            selectedReportType === ReportType.DNI_FAMILIARES_SPLIT ||
            selectedReportType === ReportType.DNGI03_WORD_POR_SCOUT ||
            selectedReportType === ReportType.DNI_SCOUT_APODERADO_POR_SCOUT) && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
              {/* Selector de tipo de persona (solo para la ficha "Persona") */}
              {selectedReportType === ReportType.DNGI03_WORD_POR_SCOUT && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-sky-800 mb-2">
                    Tipo de persona
                  </label>
                  <select
                    value={personaEntityType}
                    onChange={(e) => {
                      setPersonaEntityType(e.target.value as 'SCOUT' | 'DIRIGENTE' | 'COMITE');
                      setSelectedPersonaId('');
                      setSelectedMassiveScoutId('');
                    }}
                    className="w-full md:w-64 px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="SCOUT">Scout</option>
                    <option value="DIRIGENTE">Dirigentes</option>
                    <option value="COMITE">Comité</option>
                  </select>
                </div>
              )}

              {/* Filtro por rama: oculto cuando es ficha Persona de dirigente/comité */}
              {!(selectedReportType === ReportType.DNGI03_WORD_POR_SCOUT && personaEntityType !== 'SCOUT') && (
                <>
                  <label className="block text-sm font-medium text-sky-800 mb-2">
                    Filtrar por Rama
                  </label>
                  <select
                    value={ramaFilter}
                    onChange={(e) => setRamaFilter(e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="TODAS">Todas las ramas</option>
                    {availableRamas.map(rama => (
                      <option key={rama} value={rama}>{rama}</option>
                    ))}
                  </select>
                  <p className="text-xs text-sky-600 mt-2">
                    Selecciona una rama para filtrar los documentos de identidad.
                  </p>
                </>
              )}

              {/* Selector de scout (ficha Persona tipo Scout o DNI scout+apoderado) */}
              {((selectedReportType === ReportType.DNGI03_WORD_POR_SCOUT && personaEntityType === 'SCOUT') ||
                selectedReportType === ReportType.DNI_SCOUT_APODERADO_POR_SCOUT) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-sky-800 mb-2">
                    Buscar Scout (según rama)
                  </label>
                  <select
                    value={selectedMassiveScoutId}
                    onChange={(e) => setSelectedMassiveScoutId(e.target.value)}
                    className="w-full md:w-[520px] px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un scout</option>
                    {filteredScoutsForMassive.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.codigo_asociado ? `${s.codigo_asociado} - ` : ''}{s.persona?.nombres} {s.persona?.apellidos}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-sky-600 mt-2">
                    Para reducir carga en base de datos, este reporte se exporta scout por scout.
                  </p>
                </div>
              )}

              {/* Selector de dirigente */}
              {selectedReportType === ReportType.DNGI03_WORD_POR_SCOUT && personaEntityType === 'DIRIGENTE' && (
                <div>
                  <label className="block text-sm font-medium text-sky-800 mb-2">
                    Buscar Dirigente
                  </label>
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className="w-full md:w-[520px] px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un dirigente</option>
                    {dirigentesList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.persona?.apellidos} {d.persona?.nombres}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de miembro de comité */}
              {selectedReportType === ReportType.DNGI03_WORD_POR_SCOUT && personaEntityType === 'COMITE' && (
                <div>
                  <label className="block text-sm font-medium text-sky-800 mb-2">
                    Buscar Miembro del Comité
                  </label>
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className="w-full md:w-[520px] px-3 py-2 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un miembro</option>
                    {comiteList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.apellidos} {m.nombres}{m.cargo ? ` (${m.cargo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {(selectedReportType === ReportType.ATTENDANCE ||
            selectedReportType === ReportType.PROGRESS) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {selectedReportType === ReportType.INSCRIPCIONES_ANUALES && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={filters.year || new Date().getFullYear()}
                  onChange={(e) =>
                    setFilters({ ...filters, year: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rama/Perfil (opcional)
                </label>
                <select
                  value={filters.rama || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, rama: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las ramas</option>
                  <option value="Manada">Manada</option>
                  <option value="Tropa">Tropa</option>
                  <option value="Comunidad">Comunidad</option>
                  <option value="Clan">Clan</option>
                  <option value="Dirigentes">Dirigentes</option>
                  <option value="Comite">Comite</option>
                </select>
              </div>
            </div>
          )}

          {selectedReportType === ReportType.CONTACTOS_EMERGENCIA && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rama (opcional)
              </label>
              <select
                value={filters.rama || ''}
                onChange={(e) =>
                  setFilters({ ...filters, rama: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las ramas</option>
                <option value="Manada">Manada</option>
                <option value="Tropa">Tropa</option>
                <option value="Comunidad">Comunidad</option>
                <option value="Clan">Clan</option>
              </select>
            </div>
          )}

          {selectedReportType === ReportType.DOCUMENTACION_PENDIENTE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={filters.year || new Date().getFullYear()}
                onChange={(e) =>
                  setFilters({ ...filters, year: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mostrará scouts con documentos o pagos pendientes
              </p>
            </div>
          )}

          {selectedReportType === ReportType.RANKING_PATRULLAS && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rama (opcional)
                </label>
                <select
                  value={filters.rama || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, rama: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las ramas</option>
                  <option value="Manada">Manada</option>
                  <option value="Tropa">Tropa</option>
                  <option value="Comunidad">Comunidad</option>
                  <option value="Clan">Clan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {selectedReportType === ReportType.DASHBOARD_EJECUTIVO && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                📊 Este reporte mostrará KPIs generales del grupo (scouts activos, asistencia promedio, tendencias) sin filtros adicionales.
              </p>
            </div>
          )}

          {selectedReportType === ReportType.REPORTE_FINANCIERO_INSCRIPCION && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={filters.year || new Date().getFullYear()}
                  onChange={(e) =>
                    setFilters({ ...filters, year: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rama (opcional)
                </label>
                <select
                  value={filters.rama || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, rama: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las ramas</option>
                  <option value="Manada">Manada</option>
                  <option value="Tropa">Tropa</option>
                  <option value="Comunidad">Comunidad</option>
                  <option value="Clan">Clan</option>
                </select>
              </div>
            </div>
          )}

          {selectedReportType === ReportType.REPORTE_FINANCIERO_RAMA && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={filters.year || new Date().getFullYear()}
                  onChange={(e) =>
                    setFilters({ ...filters, year: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes Desde
                </label>
                <select
                  value={filters.monthFrom || '1'}
                  onChange={(e) =>
                    setFilters({ ...filters, monthFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2020, m-1).toLocaleString('es-PE', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes Hasta
                </label>
                <select
                  value={filters.monthTo || '12'}
                  onChange={(e) =>
                    setFilters({ ...filters, monthTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      {new Date(2020, m-1).toLocaleString('es-PE', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedReportType === ReportType.REPORTE_ACTIVIDADES && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {selectedReportType === ReportType.REPORTE_INVENTARIO && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={filters.categoria || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, categoria: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  <option value="CAMPING">Camping</option>
                  <option value="DEPORTE">Deporte</option>
                  <option value="COCINA">Cocina</option>
                  <option value="SEGURIDAD">Seguridad</option>
                  <option value="CEREMONIAL">Ceremonial</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.estado || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, estado: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="PRESTADO">Prestado</option>
                  <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                  <option value="DAÑADO">Dañado</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botones de exportación - Solo para reportes que soportan PDF/DOCX */}
      {selectedReportType && 
       selectedReportType !== ReportType.SCOUTS_EXCEL_COMPLETO && (
        <div className="flex justify-end gap-3">
          <ReportExportButton
            onExport={handleExportReport}
            formats={getExportFormatsForReport(selectedReportType)}
            label="Descargar"
          />
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Formatos disponibles:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>PDF:</strong> Ideal para visualización e impresión
              </li>
              <li>
                <strong>Word:</strong> Permite edición posterior del documento
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManager;
