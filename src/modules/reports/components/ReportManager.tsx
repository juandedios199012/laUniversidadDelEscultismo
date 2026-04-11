/**
 * Componente principal para gestión de reportes
 */

import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Calendar, Download, FileSpreadsheet, Award, CreditCard, List } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import {
  ReportType,
  ExportFormat,
  ReportFilters,
  ReportGenerationResult,
} from '../types/reportTypes';
import { ReportExportButton } from './ReportExportButton';
import { generateAndDownloadPDF, generateReportMetadata } from '../services/pdfService';
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
import { getEspecialidadesReportData } from '../services/especialidadesDataService';
import { supabase } from '../../../lib/supabase';
// Imports para reportes masivos
import DniCollectionTemplate from '../templates/pdf/DniCollectionTemplate';
import {
  getAllScoutsWithDni,
  getAllFamiliaresWithDni,
  generateMasiveReportMetadata,
  getAvailableRamas,
  splitPersonasForPdf,
} from '../services/masiveReportService';

interface Scout {
  id: string;
  codigo_scout: string;
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

  // Cargar lista de scouts y ramas al montar el componente
  useEffect(() => {
    loadScouts();
    loadRamas();
  }, []);
  
  const loadRamas = async () => {
    const ramas = await getAvailableRamas();
    setAvailableRamas(ramas);
  };

  const loadScouts = async () => {
    setLoadingScouts(true);
    try {
      const { data, error } = await supabase
        .from('scouts')
        .select(`
          id,
          codigo_scout,
          rama_actual,
          persona:personas!scouts_persona_id_fkey (
            nombres,
            apellidos
          )
        `)
        .eq('estado', 'ACTIVO')
        .order('codigo_scout', { ascending: true });

      if (error) throw error;
      setScouts(data || []);
    } catch (error) {
      console.error('Error cargando scouts:', error);
    } finally {
      setLoadingScouts(false);
    }
  };

  // Definir tipos de reportes disponibles (agrupados por categoría)
  const reportCategories = [
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
          type: 'INSCRIPCIONES_ANUALES' as ReportType,
          title: 'Inscripciones Anuales',
          description: 'Estado de pagos y documentación',
          icon: <FileText className="w-6 h-6" />,
          color: 'yellow',
          badge: 'Nuevo'
        },
        {
          type: 'CONTACTOS_EMERGENCIA' as ReportType,
          title: 'Contactos de Emergencia',
          description: 'Datos médicos y contactos familiares',
          icon: <Users className="w-6 h-6" />,
          color: 'red',
          badge: 'Nuevo'
        },
        {
          type: 'DOCUMENTACION_PENDIENTE' as ReportType,
          title: 'Documentación Pendiente',
          description: 'Scouts con docs o pagos incompletos',
          icon: <FileText className="w-6 h-6" />,
          color: 'orange',
          badge: 'Nuevo'
        },
        {
          type: 'RANKING_PATRULLAS' as ReportType,
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
          type: 'DASHBOARD_EJECUTIVO' as ReportType,
          title: 'Dashboard Ejecutivo',
          description: 'KPIs, tendencias y alertas del grupo',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'emerald',
          badge: 'Nuevo'
        },
        {
          type: 'REPORTE_FINANCIERO' as ReportType,
          title: 'Reporte Financiero',
          description: 'Ingresos, gastos y balance general',
          icon: <FileText className="w-6 h-6" />,
          color: 'teal',
          badge: 'Nuevo'
        },
        {
          type: 'REPORTE_ACTIVIDADES' as ReportType,
          title: 'Reporte de Actividades',
          description: 'Programas ejecutados y participación',
          icon: <Calendar className="w-6 h-6" />,
          color: 'cyan',
          badge: 'Nuevo'
        },
        {
          type: 'REPORTE_INVENTARIO' as ReportType,
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

        case ReportType.DNI_SCOUTS:
          return await exportDniScouts(format);
          
        case ReportType.DNI_SCOUTS_SPLIT:
          return await exportDniScoutsSplit(format);

        case ReportType.DNI_FAMILIARES:
          return await exportDniFamiliares(format);
          
        case ReportType.DNI_FAMILIARES_SPLIT:
          return await exportDniFamiliaresSplit(format);

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
        
        const { dashboard, scouts } = especialidadesData;
        
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
                      {scout.codigo_scout} - {scout.persona?.nombres} {scout.persona?.apellidos} ({scout.rama_actual})
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
            selectedReportType === ReportType.DNI_FAMILIARES_SPLIT) && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
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

          {selectedReportType === 'INSCRIPCIONES_ANUALES' && (
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
                  <option value="Lobatos">Lobatos</option>
                  <option value="Scouts">Scouts</option>
                  <option value="Rovers">Rovers</option>
                </select>
              </div>
            </div>
          )}

          {selectedReportType === 'CONTACTOS_EMERGENCIA' && (
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
                <option value="Lobatos">Lobatos</option>
                <option value="Scouts">Scouts</option>
                <option value="Rovers">Rovers</option>
              </select>
            </div>
          )}

          {selectedReportType === 'DOCUMENTACION_PENDIENTE' && (
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

          {selectedReportType === 'RANKING_PATRULLAS' && (
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
                  <option value="Lobatos">Lobatos</option>
                  <option value="Scouts">Scouts</option>
                  <option value="Rovers">Rovers</option>
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

          {selectedReportType === 'DASHBOARD_EJECUTIVO' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                📊 Este reporte mostrará KPIs generales del grupo (scouts activos, asistencia promedio, tendencias) sin filtros adicionales.
              </p>
            </div>
          )}

          {selectedReportType === 'REPORTE_FINANCIERO' && (
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

          {selectedReportType === 'REPORTE_ACTIVIDADES' && (
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

          {selectedReportType === 'REPORTE_INVENTARIO' && (
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
            formats={[ExportFormat.PDF, ExportFormat.DOCX]}
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
