/**
 * Componente principal para gestión de reportes
 */

import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Calendar, Download, FileSpreadsheet, Award, CreditCard, List, Info, Heart, FileSignature } from 'lucide-react';
import { PersonSearchCombobox } from '@/components/shared/PersonSearch';
import type { PersonaResult } from '@/services/personaService';
import { useToast } from '@/hooks/useToast';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import {
  ReportType,
  ExportFormat,
  ReportFilters,
  ReportGenerationResult,
  ReportStatus,
} from '../types/reportTypes';
import { ReportExportButton } from './ReportExportButton';
import { generateAndDownloadPDF, generatePDF, generateReportMetadata } from '../services/pdfService';
import { generateAndDownloadDOCX, createScoutReportDOCX } from '../services/docxService';
import { ScoutsExcelReport } from './ScoutsExcelReport';
import { EspecialidadesExcelReport } from './EspecialidadesExcelReport';
import { EspecialidadesDetalleExcelReport } from './EspecialidadesDetalleExcelReport';
import {
  getScoutData,
  getAttendanceData,
} from '../services/reportDataService';
import DNGI03Template from '../templates/pdf/DNGI03Template';
import AttendanceAdvancedTemplate from '../templates/pdf/AttendanceAdvancedTemplate';
import EspecialidadesReportTemplate from '../templates/pdf/EspecialidadesReportTemplate';
import RankingPatrullasReportTemplate from '../templates/pdf/RankingPatrullasReportTemplate';
import GenericSummaryReportTemplate from '../templates/pdf/GenericSummaryReportTemplate';
import { getEspecialidadesReportData } from '../services/especialidadesDataService';
import { supabase } from '../../../lib/supabase';
import DirigenteService from '../../../services/dirigenteService';
import ComitePadresService from '../../../services/comitePadresService';
import ReportsService from '../../../services/reportsService';
import FinanzasService, { ConceptoFinanzas, SaldoPersona } from '../../../services/finanzasService';
import InventarioService from '../../../services/inventarioService';
import {
  getRankingPatrullas,
} from '../services/reportDataService';
// Imports para reportes masivos
import DniCollectionTemplate from '../templates/pdf/DniCollectionTemplate';
import DniScoutApoderadoTemplate from '../templates/pdf/DniScoutApoderadoTemplate';
import { createDNGI03WordDocument } from '../templates/word/DNGI03WordTemplate';
import AttendanceMatrixTemplate from '../templates/pdf/AttendanceMatrixTemplate';
import { getAttendanceMatrixData, monthToRange, quarterToRange } from '../services/attendanceMatrixService';
import PersonasIngresosTemplate from '../templates/pdf/PersonasIngresosTemplate';
import MovimientosPorTipoTemplate from '../templates/pdf/MovimientosPorTipoTemplate';
import IngresosPorConceptoTemplate from '../templates/pdf/IngresosPorConceptoTemplate';
import EstadoCuentaPersonaTemplate from '../templates/pdf/EstadoCuentaPersonaTemplate';
import FinancieroRamaTemplate from '../templates/pdf/FinancieroRamaTemplate';
import InventarioReportTemplate from '../templates/pdf/InventarioReportTemplate';
import { exportarHistoriaMedicaPDF, exportarHistoriaMedicaDOCX } from '../services/historiaMedicaExportService';
import { exportarAutorizacionApoderadoPDF, exportarAutorizacionApoderadoDOCX } from '../services/autorizacionApoderadoExportService';
import {
  getAllScoutsForMasiveDNGI03,
  getAllScoutsWithDni,
  getScoutsWithApoderadoDni,
  generateMasiveReportMetadata,
  getAvailableRamas,
  getScoutIdsByRama,
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

  // Estado para el filtro de Matriz de Asistencia
  const [matrixMode, setMatrixMode] = useState<'mes' | 'trimestre'>('mes');
  const [matrixMonth, setMatrixMonth] = useState<number>(new Date().getMonth() + 1);
  const [matrixQuarter, setMatrixQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [matrixYear, setMatrixYear] = useState<number>(new Date().getFullYear());
  const [matrixMinSessions, setMatrixMinSessions] = useState<number>(4);
  const [matrixTopN, setMatrixTopN] = useState<number>(5);

  // Estado para el reporte "Persona" (DNGI-03): tipo de persona y selección
  const [personaEntityType, setPersonaEntityType] = useState<'SCOUT' | 'DIRIGENTE' | 'COMITE'>('SCOUT');
  const [dirigentesList, setDirigentesList] = useState<any[]>([]);
  const [comiteList, setComiteList] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');

  // Estado para el filtro del reporte "Movimientos por Tipo"
  const [movimientoTipoFilter, setMovimientoTipoFilter] = useState<'TODOS' | 'INGRESO' | 'EGRESO'>('TODOS');

  // Estado para el filtro de Concepto del reporte "Ingresos por Concepto"
  const [ingresosConceptoFilter, setIngresosConceptoFilter] = useState<string>('');
  const [conceptosFinanzasList, setConceptosFinanzasList] = useState<ConceptoFinanzas[]>([]);

  // Estado para el filtro de Persona del reporte "Estado de Cuenta por Persona"
  const [estadoCuentaPersonaId, setEstadoCuentaPersonaId] = useState<string>('');
  const [personasConMovimientosList, setPersonasConMovimientosList] = useState<SaldoPersona[]>([]);

  // Estado para el filtro de Persona (buscador) del reporte "Historia Médica"
  const [historiaMedicaPersona, setHistoriaMedicaPersona] = useState<PersonaResult | null>(null);
  const [historiaMedicaFechaLlenado, setHistoriaMedicaFechaLlenado] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Estado para el filtro de Persona (buscador) del reporte "Autorización del Padre o Apoderado"
  const [autorizacionApoderadoPersona, setAutorizacionApoderadoPersona] = useState<PersonaResult | null>(null);
  const [autorizacionApoderadoFecha, setAutorizacionApoderadoFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Modo masivo: generar un archivo por cada scout de la rama elegida
  const [autorizacionApoderadoModo, setAutorizacionApoderadoModo] = useState<'PERSONA' | 'RAMA'>('PERSONA');
  const [autorizacionApoderadoRama, setAutorizacionApoderadoRama] = useState<string>('TODAS');

  // Cargar lista de scouts y ramas al montar el componente
  useEffect(() => {
    loadScouts();
    loadRamas();
    loadDirigentesYComite();
    loadConceptosFinanzas();
    loadPersonasConMovimientos();
  }, []);

  const loadConceptosFinanzas = async () => {
    try {
      const conceptos = await FinanzasService.listarConceptosFinanzas(false);
      setConceptosFinanzasList(conceptos);
    } catch (error) {
      console.error('Error cargando conceptos de finanzas:', error);
    }
  };

  const loadPersonasConMovimientos = async () => {
    try {
      const { saldos } = await FinanzasService.listarSaldosPersonas();
      setPersonasConMovimientosList(saldos);
    } catch (error) {
      console.error('Error cargando personas con movimientos:', error);
    }
  };

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
          type: ReportType.ATTENDANCE_ADVANCED,
          title: 'Asistencia Avanzada',
          description: 'KPIs, tendencias, ranking por scout y alertas de inasistencia',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'teal',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.ATTENDANCE_MATRIX,
          title: 'Matriz de Asistencia',
          description: 'Scout x sesion: P/F/FJ/N/A, % rendimiento real, totales por fecha',
          icon: <Calendar className="w-6 h-6" />,
          color: 'cyan',
          badge: '¡Nuevo!'
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
        {
          type: ReportType.HISTORIA_MEDICA,
          title: 'Historia Médica',
          description: 'Ficha médica completa de un scout: condiciones, alergias, medicamentos y vacunas',
          icon: <Heart className="w-6 h-6" />,
          color: 'red',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.AUTORIZACION_PADRE_APODERADO,
          title: 'Autorización del Padre o Apoderado',
          description: 'ANEXO 4: identificación del scout y su apoderado legal, para completar los datos de la actividad a mano',
          icon: <FileSignature className="w-6 h-6" />,
          color: 'blue',
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
          type: ReportType.REPORTE_FINANCIERO_RAMA,
          title: 'Finanzas Operativas (Rama)',
          description: 'Ingresos/egresos del módulo Finanzas por período',
          icon: <FileText className="w-6 h-6" />,
          color: 'cyan',
          badge: 'Nuevo'
        },
        {
          type: ReportType.PERSONAS_INGRESOS,
          title: 'Personas e Ingresos',
          description: 'Movimientos de Cuenta por Persona: ingresos, egresos y saldo por persona',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'teal',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.MOVIMIENTOS_POR_TIPO,
          title: 'Movimientos por Tipo',
          description: 'Detalle de movimientos de Cuenta por Persona filtrado por Ingreso o Egreso',
          icon: <List className="w-6 h-6" />,
          color: 'sky',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.INGRESOS_POR_CONCEPTO,
          title: 'Ingresos por Concepto',
          description: 'Seguimiento de ingresos de Cuenta por Persona agrupados por Concepto: bruto cobrado y ganancia neta',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'teal',
          badge: '¡Nuevo!'
        },
        {
          type: ReportType.ESTADO_CUENTA_PERSONA,
          title: 'Estado de Cuenta por Persona',
          description: 'Ingresos, egresos, saldo a favor y deuda de una persona específica, con el concepto de cada movimiento',
          icon: <CreditCard className="w-6 h-6" />,
          color: 'emerald',
          badge: '¡Nuevo!'
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

        case ReportType.ATTENDANCE_ADVANCED:
          return await exportAttendanceAdvancedReport(format, metadata);

        case ReportType.ATTENDANCE_MATRIX:
          return await exportAttendanceMatrixReport(format, metadata);

        case ReportType.ESPECIALIDADES:
          return await exportEspecialidadesReport(format, metadata);

        case ReportType.ESPECIALIDADES_DETALLE:
          return await exportEspecialidadesDetalleReport(format, metadata);

        case ReportType.RANKING_PATRULLAS:
          return await exportRankingPatrullasReport(format, metadata);

        case ReportType.DASHBOARD_EJECUTIVO:
          return await exportDashboardEjecutivoReport(format, metadata);

        case ReportType.REPORTE_FINANCIERO_RAMA:
          return await exportFinancieroRamaReport(format, metadata);

        case ReportType.REPORTE_FINANCIERO:
          return await exportFinancieroRamaReport(format, metadata);

        case ReportType.PERSONAS_INGRESOS:
          return await exportPersonasIngresosReport(format, metadata);

        case ReportType.MOVIMIENTOS_POR_TIPO:
          return await exportMovimientosPorTipoReport(format, metadata);

        case ReportType.INGRESOS_POR_CONCEPTO:
          return await exportIngresosPorConceptoReport(format, metadata);

        case ReportType.ESTADO_CUENTA_PERSONA:
          return await exportEstadoCuentaPersonaReport(format, metadata);

        case ReportType.HISTORIA_MEDICA:
          return await exportHistoriaMedicaReport(format);

        case ReportType.AUTORIZACION_PADRE_APODERADO:
          return await exportAutorizacionApoderadoReport(format);

        case ReportType.REPORTE_ACTIVIDADES:
          return await exportActividadesReport(format, metadata);

        case ReportType.REPORTE_INVENTARIO:
          return await exportInventarioReport(format, metadata);

        case ReportType.DNI_SCOUTS:
          return await exportDniScouts(format);

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
        <DNGI03Template
          scout={scoutData}
          metadata={metadata}
          additionalData={{
            tipoRegistro: 'Renovación',
            fechaRegistro: new Date().toLocaleDateString('es-PE'),
          }}
        />,
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

  const exportAttendanceAdvancedReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const attendanceData = await getAttendanceData(filters);

    if (attendanceData.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron datos de asistencia para el período seleccionado' };
    }

    const dateRange = {
      from: filters.dateFrom || '2024-01-01',
      to: filters.dateTo || new Date().toISOString().split('T')[0],
    };

    return await generateAndDownloadPDF(
      <AttendanceAdvancedTemplate data={attendanceData} metadata={metadata} dateRange={dateRange} />,
      'reporte_asistencia_avanzado'
    );
  };

  // Exportar matriz de asistencia
  const exportAttendanceMatrixReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const { dateFrom, dateTo } = matrixMode === 'mes'
      ? monthToRange(matrixYear, matrixMonth)
      : quarterToRange(matrixYear, matrixQuarter);

    const rama = filters.rama || undefined;
    const matrixData = await getAttendanceMatrixData(dateFrom, dateTo, rama);

    if (matrixData.sessions.length === 0) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'No se encontraron sesiones en el periodo seleccionado',
      };
    }

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <AttendanceMatrixTemplate data={matrixData} metadata={metadata} minSessions={matrixMinSessions} topN={matrixTopN} />,
        `matriz_asistencia_${dateFrom}_${dateTo}`
      );
    }

    // Word export: text-based summary + per-scout list
    const { scouts, sessions, globalRendimiento } = matrixData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Matriz de Asistencia por Scout', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Periodo: ${dateFrom} al ${dateTo}${rama ? ` | Rama: ${rama}` : ''}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Rendimiento global: ${globalRendimiento}% | Scouts: ${scouts.length} | Sesiones: ${sessions.length}` })] }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: 'Resumen por Scout', bold: true, size: 26 })] }),
          ...scouts.map(s => new Paragraph({
            children: [new TextRun({
              text: `${s.apellidos}, ${s.nombres} (${s.codigo}) — P:${s.presente} F:${s.falta} FJ:${s.justificado} NA:${s.na} | Rend: ${s.rendimiento}%`,
            })],
          })),
        ],
      }],
    });
    return await generateAndDownloadDOCX(doc, `matriz_asistencia_${dateFrom}_${dateTo}`);
  };

  // Exportar reporte de progreso
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
        <FinancieroRamaTemplate
          data={{ transacciones, total, totalIngresos, totalEgresos, periodo: `${fechaInicio} a ${fechaFin}` }}
          metadata={metadata}
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

  // Exportar reporte de Personas e Ingresos (Finanzas > Cuenta por Persona)
  const exportPersonasIngresosReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const { saldos, saldoGlobal, gananciaNetaGlobal, inversionGlobal, deudaGlobal } = await FinanzasService.listarSaldosPersonas();

    const totalIngresos = saldos.reduce((s, p) => s + Number(p.total_ingresos || 0), 0);
    const totalEgresos = saldos.reduce((s, p) => s + Number(p.total_egresos || 0), 0);

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <PersonasIngresosTemplate data={{ saldos, saldoGlobal, gananciaNetaGlobal, inversionGlobal, deudaGlobal }} metadata={metadata} />,
        'personas_ingresos'
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Personas e Ingresos', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Personas con movimientos: ${saldos.length} | Ingresos: S/ ${totalIngresos.toFixed(2)} | Egresos: S/ ${totalEgresos.toFixed(2)} | Saldo global: S/ ${saldoGlobal.toFixed(2)} | Ganancia Neta: S/ ${gananciaNetaGlobal.toFixed(2)} | Inversión: S/ ${inversionGlobal.toFixed(2)} | Deuda por cobrar: S/ ${deudaGlobal.toFixed(2)}` })] }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: 'Detalle por Persona', bold: true, size: 26 })] }),
          ...saldos.map(p => new Paragraph({
            children: [new TextRun({
              text: `${p.apellidos}, ${p.nombres} — Ingresos: S/ ${Number(p.total_ingresos).toFixed(2)} | Egresos: S/ ${Number(p.total_egresos).toFixed(2)} | Saldo: S/ ${Number(p.saldo).toFixed(2)} | Ganancia Neta: S/ ${Number(p.ganancia_neta).toFixed(2)} | Inversión: S/ ${Number(p.inversion).toFixed(2)} | Deuda: S/ ${Number(p.deuda).toFixed(2)} | Mov.: ${p.movimientos_count}`,
            })],
          })),
        ],
      }],
    });
    return await generateAndDownloadDOCX(doc, 'personas_ingresos');
  };

  // Exportar reporte de Movimientos por Tipo (Finanzas > Cuenta por Persona, filtrado por Ingreso/Egreso)
  const exportMovimientosPorTipoReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const tipo = movimientoTipoFilter === 'TODOS' ? undefined : movimientoTipoFilter;
    const { movimientos, totalIngresos, totalEgresos, totalGananciaNeta, totalInversion, totalDeuda } = await FinanzasService.listarMovimientosPorTipo(tipo);

    if (movimientos.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron movimientos para el filtro seleccionado' };
    }

    const fileName = `movimientos_${movimientoTipoFilter.toLowerCase()}`;

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <MovimientosPorTipoTemplate
          data={{ movimientos, totalIngresos, totalEgresos, totalGananciaNeta, totalInversion, totalDeuda, tipoFiltro: movimientoTipoFilter }}
          metadata={metadata}
        />,
        fileName
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Movimientos por Tipo', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Filtro: ${movimientoTipoFilter} | Movimientos: ${movimientos.length} | Ingresos: S/ ${totalIngresos.toFixed(2)} | Egresos: S/ ${totalEgresos.toFixed(2)} | Ganancia Neta: S/ ${totalGananciaNeta.toFixed(2)} | Inversión: S/ ${totalInversion.toFixed(2)} | Deuda por cobrar: S/ ${totalDeuda.toFixed(2)}` })] }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: 'Detalle de Movimientos', bold: true, size: 26 })] }),
          ...movimientos.map(m => new Paragraph({
            children: [new TextRun({
              text: `${m.apellidos}, ${m.nombres} — ${m.tipo_movimiento} — ${m.concepto} — S/ ${Number(m.monto).toFixed(2)} — ${m.fecha}`,
            })],
          })),
        ],
      }],
    });
    return await generateAndDownloadDOCX(doc, fileName);
  };

  // Exportar reporte de Ingresos por Concepto (Finanzas > Cuenta por Persona, agrupado por Concepto)
  const exportIngresosPorConceptoReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    const { detalle, resumen, totalIngresos, totalGananciaNeta, totalInversion, totalDeuda } = await FinanzasService.listarIngresosPorConcepto(ingresosConceptoFilter || undefined);

    if (detalle.length === 0) {
      return { status: 'error' as any, fileName: 'error', error: 'No se encontraron ingresos registrados' };
    }

    const fileName = 'ingresos_por_concepto';

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <IngresosPorConceptoTemplate
          data={{ detalle, resumen, totalIngresos, totalGananciaNeta, totalInversion, totalDeuda, conceptoFiltro: ingresosConceptoFilter || 'Todos' }}
          metadata={metadata}
        />,
        fileName
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Ingresos por Concepto', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Filtro: ${ingresosConceptoFilter || 'Todos'} | Conceptos: ${resumen.length} | Movimientos: ${detalle.length} | Ingresos Brutos: S/ ${totalIngresos.toFixed(2)} | Ganancia Neta: S/ ${totalGananciaNeta.toFixed(2)} | Inversión: S/ ${totalInversion.toFixed(2)} | Deuda por cobrar: S/ ${totalDeuda.toFixed(2)}` })] }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: 'Resumen por Concepto', bold: true, size: 26 })] }),
          ...resumen.map(r => new Paragraph({
            children: [new TextRun({
              text: `${r.concepto} — Movimientos: ${r.movimientos_count} | Cantidad: ${r.total_cantidad} | Bruto: S/ ${Number(r.total_monto).toFixed(2)} | Neto: S/ ${Number(r.total_ganancia_neta).toFixed(2)} | Inversión: S/ ${Number(r.total_inversion).toFixed(2)} | Deuda: S/ ${Number(r.total_deuda).toFixed(2)}`,
            })],
          })),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: 'Detalle de Movimientos', bold: true, size: 26 })] }),
          ...detalle.map(m => new Paragraph({
            children: [new TextRun({
              text: `${m.apellidos}, ${m.nombres} — ${m.concepto} — S/ ${Number(m.monto).toFixed(2)} — ${m.fecha}`,
            })],
          })),
        ],
      }],
    });
    return await generateAndDownloadDOCX(doc, fileName);
  };

  // Exportar Estado de Cuenta de una Persona (Finanzas > Cuenta por Persona, una sola persona)
  const exportEstadoCuentaPersonaReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    if (!estadoCuentaPersonaId) {
      return { status: 'error' as any, fileName: 'error', error: 'Selecciona una persona para generar su estado de cuenta' };
    }

    const { persona, saldo, data: movimientos } = await FinanzasService.listarMovimientosPersona(estadoCuentaPersonaId);

    const totalIngresos = movimientos.reduce((s, m) => s + (m.tipo_movimiento === 'INGRESO' ? Number(m.monto || 0) : 0), 0);
    const totalEgresos = movimientos.reduce((s, m) => s + (m.tipo_movimiento === 'EGRESO' ? Number(m.monto || 0) : 0), 0);
    const totalDeuda = movimientos.reduce((s, m) => {
      if (m.tipo_movimiento !== 'INGRESO' || m.cantidad == null || m.precio_unitario == null) return s;
      const meta = m.cantidad * m.precio_unitario;
      return s + Math.max(meta - Number(m.monto || 0), 0);
    }, 0);

    const nombreArchivo = sanitizeFilePart(`${persona.apellidos}_${persona.nombres}`) || 'persona';
    const fileName = `estado_cuenta_${nombreArchivo}`;

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <EstadoCuentaPersonaTemplate
          data={{ persona, movimientos, totalIngresos, totalEgresos, saldo, totalDeuda }}
          metadata={metadata}
        />,
        fileName
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: 'Estado de Cuenta', bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `${persona.apellidos}, ${persona.nombres}${persona.numero_documento ? ` — Doc.: ${persona.numero_documento}` : ''}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Total Ingresos: S/ ${totalIngresos.toFixed(2)} | Total Egresos: S/ ${totalEgresos.toFixed(2)} | Saldo a Favor: S/ ${saldo.toFixed(2)} | Deuda Pendiente: S/ ${totalDeuda.toFixed(2)}` })] }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [new TextRun({ text: 'Detalle de Movimientos', bold: true, size: 26 })] }),
          ...movimientos.map(m => new Paragraph({
            children: [new TextRun({
              text: `${m.tipo_movimiento} — ${m.concepto} — S/ ${Number(m.monto).toFixed(2)} — ${m.fecha}`,
            })],
          })),
        ],
      }],
    });
    return await generateAndDownloadDOCX(doc, fileName);
  };

  const exportHistoriaMedicaReport = async (
    format: ExportFormat
  ): Promise<ReportGenerationResult> => {
    if (!historiaMedicaPersona) {
      return { status: 'error' as any, fileName: 'error', error: 'Busca y selecciona una persona para generar su Historia Médica' };
    }

    const scoutId = historiaMedicaPersona.es_scout?.scout_id;
    if (!scoutId) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'La Historia Médica solo está disponible para personas registradas como Scout',
      };
    }

    const options = {
      organizacion: 'Grupo Scout Lima 12',
      fechaLlenado: historiaMedicaFechaLlenado || undefined,
    };

    if (format === ExportFormat.PDF) {
      return await exportarHistoriaMedicaPDF(scoutId, historiaMedicaPersona.persona_id, options);
    }

    return await exportarHistoriaMedicaDOCX(scoutId, historiaMedicaPersona.persona_id, options);
  };

  const exportAutorizacionApoderadoReport = async (
    format: ExportFormat
  ): Promise<ReportGenerationResult> => {
    const options = {
      fechaDocumento: autorizacionApoderadoFecha || undefined,
    };

    if (autorizacionApoderadoModo === 'RAMA') {
      try {
        const scouts = await getScoutIdsByRama(autorizacionApoderadoRama);
        if (scouts.length === 0) {
          showError('No hay scouts activos para la rama seleccionada');
          return { status: 'error' as any, fileName: 'error', error: 'No hay datos' };
        }

        info(`Se generarán ${scouts.length} archivo(s), uno por cada scout de la rama.`);

        for (let i = 0; i < scouts.length; i++) {
          const scout = scouts[i];
          const result = format === ExportFormat.PDF
            ? await exportarAutorizacionApoderadoPDF(scout.id, '', options)
            : await exportarAutorizacionApoderadoDOCX(scout.id, '', options);

          if (result.status === ReportStatus.ERROR) {
            console.warn(`Autorización omitida para ${scout.nombreCompleto || scout.id}: ${result.error}`);
          }

          if (i < scouts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 450));
          }
        }

        return {
          status: 'success' as any,
          fileName: `Autorizacion_Padre_Apoderado_${scouts.length}_archivos`,
        };
      } catch (error) {
        console.error('Error exportando Autorización del Padre o Apoderado por rama:', error);
        return {
          status: 'error' as any,
          fileName: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
    }

    if (!autorizacionApoderadoPersona) {
      return { status: 'error' as any, fileName: 'error', error: 'Busca y selecciona una persona para generar su Autorización del Padre o Apoderado' };
    }

    const scoutId = autorizacionApoderadoPersona.es_scout?.scout_id;
    if (!scoutId) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'La Autorización del Padre o Apoderado solo está disponible para personas registradas como Scout',
      };
    }

    if (format === ExportFormat.PDF) {
      return await exportarAutorizacionApoderadoPDF(scoutId, autorizacionApoderadoPersona.persona_id, options);
    }

    return await exportarAutorizacionApoderadoDOCX(scoutId, autorizacionApoderadoPersona.persona_id, options);
  };

  const exportActividadesReport = async (
    format: ExportFormat,
    metadata: any
  ): Promise<ReportGenerationResult> => {
    // El filtro visible para este reporte es Fecha Desde/Fecha Hasta (no Año/Rama),
    // así que se envían esos valores a la RPC en vez de filters.year/filters.rama
    // (que pertenecen a otros reportes y nunca se setean para este).
    const anio = filters.year || new Date().getFullYear();
    const fechaDesde = filters.dateFrom || undefined;
    const fechaHasta = filters.dateTo || undefined;

    const reporte = await ReportsService.getReporteActividadesGerencial({
      ano: fechaDesde || fechaHasta ? undefined : anio,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    });

    const operacionales = reporte?.kpis_operacionales || {};
    const financieros = reporte?.kpis_financieros || {};
    const impacto = reporte?.kpis_impacto || {};
    const topActividades = impacto?.top_actividades || [];
    const periodoLabel = fechaDesde || fechaHasta
      ? `${fechaDesde || '...'} a ${fechaHasta || '...'}`
      : `Año ${anio}`;

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <GenericSummaryReportTemplate
          title="Reporte de Actividades - Metricas Gerenciales"
          subtitle={periodoLabel}
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
        new Paragraph({ children: [new TextRun({ text: periodoLabel, size: 24 })], alignment: AlignmentType.CENTER }),
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
    const allItems = await InventarioService.getAllItems();
    const items = allItems.filter((i) =>
      (!filters.categoria || i.categoria === filters.categoria) &&
      (!filters.estado || i.estado_item === filters.estado)
    );
    const total = items.length;
    const disponibles = items.filter((i) => i.estado_item === 'DISPONIBLE').length;
    const prestados = items.filter((i) => i.estado_item === 'PRESTADO').length;
    const valorTotal = items.reduce((sum, i) => sum + Number(i.valor_unitario || 0) * Number(i.cantidad_disponible || 0), 0);

    if (format === ExportFormat.PDF) {
      return await generateAndDownloadPDF(
        <InventarioReportTemplate
          data={{ items, total, disponibles, prestados, valorTotal }}
          metadata={metadata}
        />,
        'reporte_inventario'
      );
    }

    const doc = new Document({
      sections: [{ children: [
        new Paragraph({ children: [new TextRun({ text: 'Reporte de Inventario', bold: true, size: 34 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `Items: ${total} | Disponibles: ${disponibles} | Prestados: ${prestados} | Valor Total: S/ ${valorTotal.toFixed(2)}` })] }),
        new Paragraph({ children: [] }),
        ...items.map((i) => new Paragraph({ children: [new TextRun({ text: `${i.nombre} | ${i.categoria} | Cant.: ${i.cantidad_disponible} | ${i.estado_item} | ${i.ubicacion || '-'}` })] })),
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

          {selectedReportType === ReportType.ATTENDANCE_MATRIX && (
            <div className="space-y-4">
              <p className="text-sm text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                Matriz Scout x Sesion. Selecciona un mes o trimestre para limitar las columnas y evitar texto ilegible.
              </p>

              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMatrixMode('mes')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${matrixMode === 'mes' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-300 hover:border-cyan-400'}`}
                >
                  Por Mes
                </button>
                <button
                  onClick={() => setMatrixMode('trimestre')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${matrixMode === 'trimestre' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-300 hover:border-cyan-400'}`}
                >
                  Por Trimestre
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Month or Quarter selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {matrixMode === 'mes' ? 'Mes' : 'Trimestre'}
                  </label>
                  {matrixMode === 'mes' ? (
                    <select
                      value={matrixMonth}
                      onChange={(e) => setMatrixMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={matrixQuarter}
                      onChange={(e) => setMatrixQuarter(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value={1}>Q1 — Ene/Mar</option>
                      <option value={2}>Q2 — Abr/Jun</option>
                      <option value={3}>Q3 — Jul/Sep</option>
                      <option value={4}>Q4 — Oct/Dic</option>
                    </select>
                  )}
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                  <select
                    value={matrixYear}
                    onChange={(e) => setMatrixYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    {[2023, 2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Rama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rama (opcional)</label>
                  <select
                    value={filters.rama || ''}
                    onChange={(e) => setFilters({ ...filters, rama: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="">Todas las ramas</option>
                    <option value="Manada">Manada</option>
                    <option value="Tropa">Tropa</option>
                    <option value="Comunidad">Comunidad</option>
                    <option value="Clan">Clan</option>
                  </select>
                </div>
              </div>

              {/* Mínimo de reuniones activas + cuántos puestos mostrar */}
              <div className="flex items-start gap-4">

                {/* Mínimo reuniones */}
                <div className="flex items-center gap-2">
                  <div className="w-44">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mín. reuniones activas
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={matrixMinSessions}
                      onChange={(e) => setMatrixMinSessions(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative group mt-6">
                    <Info className="w-5 h-5 text-cyan-500 cursor-help" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-lg">
                      Solo entran al ranking y a las Alertas los scouts con <strong> ≥ {matrixMinSessions} reunion{matrixMinSessions !== 1 ? 'es' : ''} activa{matrixMinSessions !== 1 ? 's' : ''}</strong>. Ingresa un número ≥ 1.
                      <span className="block mt-1 text-gray-400">Evita que scouts recién ingresados distorsionen el ranking.</span>
                    </div>
                  </div>
                </div>

                {/* Top N puestos */}
                <div className="flex items-center gap-2">
                  <div className="w-44">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puestos a mostrar (TOP N)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={matrixTopN}
                      onChange={(e) => setMatrixTopN(Math.max(1, parseInt(e.target.value) || 5))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative group mt-6">
                    <Info className="w-5 h-5 text-cyan-500 cursor-help" />
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-lg">
                      Cuántos puestos mostrar en el ranking. Si hay empates en el último puesto, se incluyen <strong>todos los empatados</strong> aunque superen el número. Ingresa un número ≥ 1.
                      <span className="block mt-1 text-gray-400">Ejemplo: TOP 10 muestra los 10 mejores (+ empatados en el puesto 10).</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {selectedReportType === ReportType.ATTENDANCE_ADVANCED && (
            <div className="space-y-4">
              <p className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                Reporte avanzado: KPIs globales, tendencia mensual, ranking de scouts por tasa de asistencia y alertas automáticas de inasistencia.
              </p>
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
            </div>
          )}

          {selectedReportType === ReportType.MOVIMIENTOS_POR_TIPO && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento
              </label>
              <select
                value={movimientoTipoFilter}
                onChange={(e) => setMovimientoTipoFilter(e.target.value as 'TODOS' | 'INGRESO' | 'EGRESO')}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TODOS">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Filtra el detalle de movimientos de Cuenta por Persona para hacer seguimiento específico por tipo.
              </p>
            </div>
          )}

          {selectedReportType === ReportType.INGRESOS_POR_CONCEPTO && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concepto
              </label>
              <select
                value={ingresosConceptoFilter}
                onChange={(e) => setIngresosConceptoFilter(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {conceptosFinanzasList.map((c) => (
                  <option key={c.id} value={c.descripcion}>{c.descripcion}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Agrupa los ingresos de Finanzas &gt; Cuenta por Persona por Concepto, mostrando el subtotal bruto (cobrado), neto (ya descontada la inversión) y deuda por cobrar de cada uno. Filtra por un concepto específico o deja "Todos" para verlos todos.
              </p>
            </div>
          )}

          {selectedReportType === ReportType.ESTADO_CUENTA_PERSONA && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Persona
              </label>
              <select
                value={estadoCuentaPersonaId}
                onChange={(e) => setEstadoCuentaPersonaId(e.target.value)}
                className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una persona</option>
                {personasConMovimientosList.map((p) => (
                  <option key={p.persona_id} value={p.persona_id}>
                    {p.apellidos}, {p.nombres}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Genera el estado de cuenta individual de Finanzas &gt; Cuenta por Persona: sus ingresos y egresos (con el concepto de cada uno), su saldo a favor y su deuda pendiente. Pensado para entregar a la persona o su familia.
              </p>
            </div>
          )}

          {selectedReportType === ReportType.HISTORIA_MEDICA && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona
                </label>
                <PersonSearchCombobox
                  placeholder="Buscar por nombre o N° documento..."
                  onSelect={(persona) => setHistoriaMedicaPersona(persona)}
                  personaVinculada={historiaMedicaPersona}
                  onDesvincular={() => setHistoriaMedicaPersona(null)}
                  simplificarBadgeScout
                />
                {historiaMedicaPersona && !historiaMedicaPersona.es_scout && (
                  <p className="text-xs text-amber-600 mt-2">
                    Esta persona no está registrada como Scout. La Historia Médica solo está disponible para Scouts.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Llenado
                </label>
                <input
                  type="date"
                  value={historiaMedicaFechaLlenado}
                  onChange={(e) => setHistoriaMedicaFechaLlenado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Fecha que aparecerá impresa en el documento (por defecto, hoy).
                </p>
              </div>
              <p className="text-xs text-gray-500 md:col-span-2">
                Genera la ficha médica completa del scout (ANEXO 10/11): datos personales, condiciones, alergias, medicamentos y vacunas.
              </p>
            </div>
          )}

          {selectedReportType === ReportType.AUTORIZACION_PADRE_APODERADO && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo de generación
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      checked={autorizacionApoderadoModo === 'PERSONA'}
                      onChange={() => setAutorizacionApoderadoModo('PERSONA')}
                    />
                    Un scout específico
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      checked={autorizacionApoderadoModo === 'RAMA'}
                      onChange={() => setAutorizacionApoderadoModo('RAMA')}
                    />
                    Toda una rama (masivo, un archivo por scout)
                  </label>
                </div>
              </div>

              {autorizacionApoderadoModo === 'PERSONA' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona
                  </label>
                  <PersonSearchCombobox
                    placeholder="Buscar por nombre o N° documento..."
                    onSelect={(persona) => setAutorizacionApoderadoPersona(persona)}
                    personaVinculada={autorizacionApoderadoPersona}
                    onDesvincular={() => setAutorizacionApoderadoPersona(null)}
                    simplificarBadgeScout
                  />
                  {autorizacionApoderadoPersona && !autorizacionApoderadoPersona.es_scout && (
                    <p className="text-xs text-amber-600 mt-2">
                      Esta persona no está registrada como Scout. La Autorización del Padre o Apoderado solo está disponible para Scouts.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rama
                  </label>
                  <select
                    value={autorizacionApoderadoRama}
                    onChange={(e) => setAutorizacionApoderadoRama(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TODAS">Todas las ramas</option>
                    {availableRamas.map(rama => (
                      <option key={rama} value={rama}>{rama}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Se generará y descargará un documento por cada scout activo de la rama seleccionada.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Documento
                </label>
                <input
                  type="date"
                  value={autorizacionApoderadoFecha}
                  onChange={(e) => setAutorizacionApoderadoFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Fecha que aparecerá impresa junto a la firma (por defecto, hoy).
                </p>
              </div>
              <p className="text-xs text-gray-500 md:col-span-2">
                Genera el ANEXO 4 con la identificación del scout y de su Apoderado Legal ya completada (Yo/DNI, Padre/Madre/Apoderado, niño/niña, código de asociado y firma). La tabla de datos de la actividad queda en blanco para llenarla a mano.
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

          {selectedReportType === ReportType.PERSONAS_INGRESOS && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                💰 Este reporte lista a todas las personas con movimientos en Finanzas &gt; Cuenta por Persona, con sus ingresos, egresos y saldo acumulado a la fecha, sin filtros adicionales.
              </p>
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
                  <option value="CAMPING">Camping / Material Scout</option>
                  <option value="CEREMONIAL">Ceremonial</option>
                  <option value="DEPORTE">Deportivo</option>
                  <option value="SEGURIDAD">Primeros Auxilios</option>
                  <option value="COCINA">Cocina / Alimentación</option>
                  <option value="EDUCATIVO">Material Educativo</option>
                  <option value="OTRO">Otro / Administrativo</option>
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
                  <option value="PERDIDO">Perdido</option>
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
