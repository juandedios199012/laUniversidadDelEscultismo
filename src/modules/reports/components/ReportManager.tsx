/**
 * Componente principal para gestión de reportes
 */

import React, { useState } from 'react';
import { FileText, Users, TrendingUp, Calendar, Download } from 'lucide-react';
import {
  ReportType,
  ExportFormat,
  ReportFilters,
  ReportGenerationResult,
} from '../types/reportTypes';
import { ReportExportButton } from './ReportExportButton';
import { generateAndDownloadPDF, generateReportMetadata } from '../services/pdfService';
import { generateAndDownloadDOCX, createScoutReportDOCX, createAttendanceReportDOCX, createProgressReportDOCX } from '../services/docxService';
import {
  getScoutData,
  getAttendanceData,
  getProgressData,
} from '../services/reportDataService';
import ScoutReportTemplate from '../templates/pdf/ScoutReportTemplate';
import AttendanceReportTemplate from '../templates/pdf/AttendanceReportTemplate';
import ProgressReportTemplate from '../templates/pdf/ProgressReportTemplate';

interface ReportManagerProps {
  className?: string;
}

export const ReportManager: React.FC<ReportManagerProps> = ({ className = '' }) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '',
    dateTo: '',
    scoutIds: [],
  });
  const [scoutId, setScoutId] = useState<string>('');

  // Definir tipos de reportes disponibles
  const reportTypes = [
    {
      type: ReportType.SCOUT_PROFILE,
      title: 'Perfil de Scout',
      description: 'Información completa de un scout individual',
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
      title: 'Progreso',
      description: 'Avance en especialidades y etapas',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'purple',
    },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.type}
              onClick={() => setSelectedReportType(report.type)}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${
                  selectedReportType === report.type
                    ? `border-${report.color}-600 bg-${report.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    p-2 rounded-lg
                    ${selectedReportType === report.type ? `bg-${report.color}-100` : 'bg-gray-100'}
                  `}
                >
                  {report.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros específicos por tipo de reporte */}
      {selectedReportType && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Configuración del Reporte</h3>

          {selectedReportType === ReportType.SCOUT_PROFILE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID del Scout
              </label>
              <input
                type="text"
                value={scoutId}
                onChange={(e) => setScoutId(e.target.value)}
                placeholder="Ingresa el ID del scout"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
        </div>
      )}

      {/* Botones de exportación */}
      {selectedReportType && (
        <div className="flex justify-end">
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
