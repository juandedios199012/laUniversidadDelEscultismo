/**
 * Componente para botón de exportación de reportes
 */

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  ExportFormat,
  ReportGenerationResult,
  ReportStatus,
} from '../types/reportTypes';

interface ReportExportButtonProps {
  onExport: (format: ExportFormat) => Promise<ReportGenerationResult>;
  formats?: ExportFormat[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const ReportExportButton: React.FC<ReportExportButtonProps> = ({
  onExport,
  formats = [ExportFormat.PDF, ExportFormat.DOCX],
  label = 'Exportar',
  className = '',
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    format?: ExportFormat;
    status?: ReportStatus;
    message?: string;
  }>({});

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setExportStatus({ format, status: ReportStatus.GENERATING });

      const result = await onExport(format);

      setExportStatus({
        format,
        status: result.status,
        message:
          result.status === ReportStatus.SUCCESS
            ? `Reporte descargado exitosamente`
            : result.error || 'Error al generar el reporte',
      });

      // Limpiar estado después de 3 segundos
      setTimeout(() => {
        setExportStatus({});
      }, 3000);
    } catch (error) {
      console.error('Error exporting report:', error);
      setExportStatus({
        format,
        status: ReportStatus.ERROR,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.PDF:
        return <FileText className="w-4 h-4" />;
      case ExportFormat.DOCX:
        return <FileSpreadsheet className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case ExportFormat.PDF:
        return 'PDF';
      case ExportFormat.DOCX:
        return 'Word';
      default:
        return format;
    }
  };

  return (
    <div className={`inline-flex flex-col gap-2 ${className}`}>
      <div className="inline-flex gap-2">
        {formats.map((format) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={disabled || isExporting}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              font-medium text-sm transition-all
              ${
                disabled || isExporting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
              ${exportStatus.format === format && exportStatus.status === ReportStatus.GENERATING ? 'animate-pulse' : ''}
            `}
          >
            {exportStatus.format === format &&
            exportStatus.status === ReportStatus.GENERATING ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              getFormatIcon(format)
            )}
            <span>
              {label} {getFormatLabel(format)}
            </span>
          </button>
        ))}
      </div>

      {/* Status message */}
      {exportStatus.message && (
        <div
          className={`
            text-sm px-3 py-2 rounded-md
            ${
              exportStatus.status === ReportStatus.SUCCESS
                ? 'bg-green-100 text-green-800'
                : exportStatus.status === ReportStatus.ERROR
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }
          `}
        >
          {exportStatus.message}
        </div>
      )}
    </div>
  );
};

export default ReportExportButton;
