/**
 * Servicio para generación de reportes PDF
 * Utiliza @react-pdf/renderer
 */

import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  ReportConfig,
  ReportGenerationResult,
  ReportStatus,
} from '../types/reportTypes';

/**
 * Genera un PDF a partir de un componente React
 */
export async function generatePDF(
  Component: React.ReactElement,
  fileName: string
): Promise<ReportGenerationResult> {
  try {
    // Generar el blob del PDF
    const blob = await pdf(Component).toBlob();

    return {
      status: ReportStatus.SUCCESS,
      blob,
      fileName: `${fileName}.pdf`,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: `${fileName}.pdf`,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera y descarga un PDF directamente
 */
export async function generateAndDownloadPDF(
  Component: React.ReactElement,
  fileName: string
): Promise<ReportGenerationResult> {
  try {
    const result = await generatePDF(Component, fileName);

    if (result.status === ReportStatus.SUCCESS && result.blob) {
      saveAs(result.blob, result.fileName);
    }

    return result;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: `${fileName}.pdf`,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera un nombre de archivo basado en la configuración
 */
export function generateFileName(config: ReportConfig): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportName = config.title.toLowerCase().replace(/\s+/g, '_');
  return `${reportName}_${timestamp}`;
}

/**
 * Convierte un blob a base64 (útil para almacenar en Supabase)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remover el prefijo data:application/pdf;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Guarda el PDF en Supabase Storage (opcional)
 */
export async function savePDFToSupabase(
  blob: Blob,
  fileName: string,
  bucket: string = 'reports'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Nota: Esto requiere que hayas configurado el bucket 'reports' en Supabase Storage
    const { supabase } = await import('../../../lib/supabase');
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error saving PDF to Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Valida la configuración del reporte
 */
export function validateReportConfig(config: ReportConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.title || config.title.trim() === '') {
    errors.push('El título del reporte es requerido');
  }

  if (!config.type) {
    errors.push('El tipo de reporte es requerido');
  }

  if (!config.format) {
    errors.push('El formato de exportación es requerido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Genera metadatos del reporte
 */
export function generateReportMetadata() {
  return {
    generatedAt: new Date(),
    generatedBy: 'Sistema de Reportes Scout',
    version: '1.0.0',
    organizacion: 'Grupo Scout Lima 12',
  };
}

/**
 * Formatea fechas para mostrar en reportes
 * NOTA: Para fechas tipo DATE de PostgreSQL, parseamos como local sin timezone
 */
export function formatDate(date: string | Date): string {
  let d: Date;
  
  if (typeof date === 'string') {
    // Si es string de fecha tipo "2026-01-17" (DATE de PostgreSQL)
    // Parseamos como local para evitar timezone offset
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = date;
  }
  
  return d.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea hora para mostrar en reportes
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea números con separadores de miles
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('es-PE');
}

/**
 * Formatea porcentajes
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export default {
  generatePDF,
  generateAndDownloadPDF,
  generateFileName,
  blobToBase64,
  savePDFToSupabase,
  validateReportConfig,
  generateReportMetadata,
  formatDate,
  formatTime,
  formatNumber,
  formatPercentage,
};
