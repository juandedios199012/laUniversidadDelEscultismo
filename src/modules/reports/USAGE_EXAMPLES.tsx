/**
 * Ejemplos de uso del módulo de reportes
 * Copia y adapta estos ejemplos según tus necesidades
 */

import React from 'react';
import {
  // Componentes
  ReportManager,
  ReportExportButton,
  
  // Plantillas PDF
  ScoutReportTemplate,
  AttendanceReportTemplate,
  ProgressReportTemplate,
  
  // Servicios
  generateAndDownloadPDF,
  generateAndDownloadDOCX,
  createScoutReportDOCX,
  // createAttendanceReportDOCX, // Usado en ejemplos comentados
  // createProgressReportDOCX, // Usado en ejemplos comentados
  generateReportMetadata,
  
  // Servicios de datos
  getScoutData,
  getAttendanceData,
  getProgressData,
  
  // Tipos
  ExportFormat,
  // ReportType, // Usado en ejemplos comentados
  ReportGenerationResult,
} from './index';

// ============================================
// EJEMPLO 1: Usar el componente completo
// ============================================

export function Example1_CompleteComponent() {
  return (
    <div className="p-8">
      <ReportManager />
    </div>
  );
}

// ============================================
// EJEMPLO 2: Generar reporte de Scout en PDF
// ============================================

export async function Example2_ScoutPDF(scoutId: string) {
  try {
    // 1. Obtener datos del scout
    const scoutData = await getScoutData(scoutId);
    
    if (!scoutData) {
      console.error('Scout no encontrado');
      return;
    }

    // 2. Generar metadata
    const metadata = generateReportMetadata();

    // 3. Generar y descargar PDF
    const result = await generateAndDownloadPDF(
      <ScoutReportTemplate 
        scout={scoutData} 
        metadata={metadata} 
        includeLogo={false}
      />,
      `reporte_scout_${scoutData.numeroRegistro}`
    );

    if (result.status === 'success') {
      console.log('PDF generado exitosamente');
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error generando reporte:', error);
  }
}

// ============================================
// EJEMPLO 3: Generar reporte de Scout en Word
// ============================================

export async function Example3_ScoutWord(scoutId: string) {
  try {
    const scoutData = await getScoutData(scoutId);
    
    if (!scoutData) {
      console.error('Scout no encontrado');
      return;
    }

    const metadata = generateReportMetadata();
    
    // Crear documento Word
    const doc = createScoutReportDOCX(scoutData, metadata);
    
    // Descargar
    await generateAndDownloadDOCX(
      doc,
      `reporte_scout_${scoutData.numeroRegistro}`
    );
  } catch (error) {
    console.error('Error generando reporte:', error);
  }
}

// ============================================
// EJEMPLO 4: Generar reporte de asistencia
// ============================================

export async function Example4_AttendanceReport() {
  try {
    // Obtener datos de asistencia filtrados
    const attendanceData = await getAttendanceData({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
    });

    if (attendanceData.length === 0) {
      console.log('No hay datos de asistencia');
      return;
    }

    const metadata = generateReportMetadata();
    const dateRange = { from: '2024-01-01', to: '2024-12-31' };

    // Generar PDF
    await generateAndDownloadPDF(
      <AttendanceReportTemplate 
        data={attendanceData}
        metadata={metadata}
        dateRange={dateRange}
      />,
      'reporte_asistencia_2024'
    );
  } catch (error) {
    console.error('Error generando reporte:', error);
  }
}

// ============================================
// EJEMPLO 5: Generar reporte de progreso
// ============================================

export async function Example5_ProgressReport(scoutIds?: string[]) {
  try {
    const progressData = await getProgressData({
      scoutIds: scoutIds, // Opcional: filtrar por scouts específicos
    });

    if (progressData.length === 0) {
      console.log('No hay datos de progreso');
      return;
    }

    const metadata = generateReportMetadata();

    // Generar PDF
    await generateAndDownloadPDF(
      <ProgressReportTemplate 
        data={progressData}
        metadata={metadata}
      />,
      'reporte_progreso'
    );
  } catch (error) {
    console.error('Error generando reporte:', error);
  }
}

// ============================================
// EJEMPLO 6: Botón de exportación personalizado
// ============================================

export function Example6_CustomExportButton() {
  const handleExport = async (format: ExportFormat): Promise<ReportGenerationResult> => {
    try {
      // Tu lógica personalizada aquí
      console.log(`Exportando en formato: ${format}`);
      
      // Ejemplo: generar reporte de un scout específico
      const scoutData = await getScoutData('scout-id-aqui');
      
      if (!scoutData) {
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'Scout no encontrado',
        };
      }

      const metadata = generateReportMetadata();

      if (format === ExportFormat.PDF) {
        return await generateAndDownloadPDF(
          <ScoutReportTemplate scout={scoutData} metadata={metadata} />,
          `reporte_${scoutData.numeroRegistro}`
        );
      } else {
        const doc = createScoutReportDOCX(scoutData, metadata);
        return await generateAndDownloadDOCX(
          doc,
          `reporte_${scoutData.numeroRegistro}`
        );
      }
    } catch (error) {
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Exportar Reporte</h3>
      <ReportExportButton
        onExport={handleExport}
        formats={[ExportFormat.PDF, ExportFormat.DOCX]}
        label="Descargar"
      />
    </div>
  );
}

// ============================================
// EJEMPLO 7: Generar múltiples reportes
// ============================================

export async function Example7_MultipleReports(scoutIds: string[]) {
  console.log('Generando reportes para', scoutIds.length, 'scouts...');

  for (const scoutId of scoutIds) {
    try {
      const scoutData = await getScoutData(scoutId);
      
      if (scoutData) {
        const metadata = generateReportMetadata();
        
        await generateAndDownloadPDF(
          <ScoutReportTemplate scout={scoutData} metadata={metadata} />,
          `reporte_scout_${scoutData.numeroRegistro}`
        );

        // Esperar un poco entre cada descarga para no sobrecargar el navegador
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`✓ Reporte generado para ${scoutData.nombre}`);
      }
    } catch (error) {
      console.error(`Error generando reporte para scout ${scoutId}:`, error);
    }
  }

  console.log('Todos los reportes generados');
}

// ============================================
// EJEMPLO 8: Integración con página React
// ============================================

export function Example8_ReportsPageIntegration() {
  const [selectedScoutId, setSelectedScoutId] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateReport = async (format: ExportFormat): Promise<ReportGenerationResult> => {
    if (!selectedScoutId) {
      alert('Por favor selecciona un scout');
      return {
        status: 'error' as any,
        fileName: 'error',
        error: 'No se seleccionó un scout',
      };
    }

    setIsGenerating(true);

    try {
      const scoutData = await getScoutData(selectedScoutId);
      
      if (!scoutData) {
        alert('Scout no encontrado');
        return {
          status: 'error' as any,
          fileName: 'error',
          error: 'Scout no encontrado',
        };
      }

      const metadata = generateReportMetadata();

      if (format === ExportFormat.PDF) {
        const result = await generateAndDownloadPDF(
          <ScoutReportTemplate scout={scoutData} metadata={metadata} />,
          `reporte_${scoutData.numeroRegistro}`
        );
        alert('Reporte generado exitosamente');
        return result;
      } else {
        const doc = createScoutReportDOCX(scoutData, metadata);
        const result = await generateAndDownloadDOCX(doc, `reporte_${scoutData.numeroRegistro}`);
        alert('Reporte generado exitosamente');
        return result;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generando reporte');
      return {
        status: 'error' as any,
        fileName: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Generar Reporte de Scout</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          ID del Scout
        </label>
        <input
          type="text"
          value={selectedScoutId}
          onChange={(e) => setSelectedScoutId(e.target.value)}
          placeholder="Ingresa el ID del scout"
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isGenerating}
        />
      </div>

      <ReportExportButton
        onExport={handleGenerateReport}
        disabled={!selectedScoutId || isGenerating}
      />
    </div>
  );
}

// ============================================
// TIPS Y MEJORES PRÁCTICAS
// ============================================

/*
1. MANEJO DE ERRORES:
   - Siempre envuelve las llamadas en try-catch
   - Valida que los datos existan antes de generar reportes
   - Muestra mensajes de error amigables al usuario

2. PERFORMANCE:
   - Para reportes grandes, considera mostrar un indicador de carga
   - No generes múltiples reportes simultáneamente
   - Usa filtros para limitar la cantidad de datos

3. PERSONALIZACIÓN:
   - Modifica las plantillas en src/modules/reports/templates/pdf/
   - Ajusta los estilos en src/modules/reports/styles/pdfStyles.ts
   - Crea nuevas plantillas basándote en las existentes

4. DATOS:
   - Verifica que las tablas de Supabase existan
   - Asegúrate de tener los permisos correctos configurados
   - Prueba con datos de ejemplo primero

5. FORMATOS:
   - PDF: Mejor para visualización e impresión
   - Word: Mejor para edición posterior
   - Ofrece ambos formatos cuando sea posible
*/
