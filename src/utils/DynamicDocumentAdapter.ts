/**
 * 🔌 Dynamic Document Adapter (Simplified)
 * Conecta el editor visual con generación HTML básica
 */

import { DocumentFormat, Scout as StrategyScout } from './DocumentGenerationStrategy';
import { TableDesign, TableCell, TableRow } from '../components/documents/TableDesigner';
import { Scout } from '../lib/supabase';

export class DynamicDocumentAdapter {
  constructor() {
    // Constructor simplificado
  }

  /**
   * Genera documento usando el diseño visual personalizado
   */
  async generateFromDesign(
    design: TableDesign, 
    scout: Scout, 
    format: DocumentFormat
  ): Promise<{
    data: ArrayBuffer;
    filename: string;
    mimeType: string;
    format: string;
  }> {
    // Adaptar Scout al formato de estrategia
    const strategyScout = this.adaptScoutData(scout);

    // Generar según el formato solicitado
    switch (format) {
      case 'html':
        return this.generateHTMLFromDesign(design, strategyScout);
      case 'pdf':
        return this.generatePDFFromDesign(design, strategyScout);
      case 'word':
        return this.generateWordFromDesign(design, strategyScout);
      default:
        return this.generateHTMLFromDesign(design, strategyScout);
    }
  }

  /**
   * Generar HTML usando diseño personalizado
   */
  private async generateHTMLFromDesign(
    design: TableDesign, 
    scout: StrategyScout
  ): Promise<{
    data: ArrayBuffer;
    filename: string;
    mimeType: string;
    format: string;
  }> {
    const htmlContent = this.createHTMLDocument(design, scout);
    const encoder = new TextEncoder();
    const data = encoder.encode(htmlContent);
    
    const filename = this.generateFilename(scout, 'html');
    
    return {
      data: data.buffer,
      filename,
      mimeType: 'text/html',
      format: 'HTML Document'
    };
  }

  /**
   * Generar PDF usando diseño personalizado
   */
  private async generatePDFFromDesign(
    design: TableDesign, 
    scout: StrategyScout
  ): Promise<{
    data: ArrayBuffer;
    filename: string;
    mimeType: string;
    format: string;
  }> {
    try {
      console.log('📄 Generando PDF para:', scout.nombres, scout.apellidos);
      
      // Importar y usar el generador PDF dinámico
      const { DynamicPDFGenerator } = await import('./DynamicPDFGenerator');
      const pdfGenerator = new DynamicPDFGenerator(design);
      const pdfData = await pdfGenerator.generatePDF(scout);
      
      console.log('📊 PDF generado, tamaño:', pdfData.byteLength, 'bytes');
      
      const filename = this.generateFilename(scout, 'pdf');
      
      return {
        data: pdfData.buffer instanceof ArrayBuffer ? pdfData.buffer : new ArrayBuffer(pdfData.byteLength),
        filename,
        mimeType: 'application/pdf',
        format: 'PDF Document'
      };
    } catch (error) {
      console.error('❌ Error generando PDF, usando fallback a HTML:', error);
      // Fallback a HTML si PDF falla
      const htmlResult = await this.generateHTMLFromDesign(design, scout);
      return {
        ...htmlResult,
        filename: this.generateFilename(scout, 'html'),
        format: 'HTML Document (PDF fallback)'
      };
    }
  }

  /**
   * Generar Word usando diseño personalizado
   */
  private async generateWordFromDesign(
    design: TableDesign, 
    scout: StrategyScout
  ): Promise<{
    data: ArrayBuffer;
    filename: string;
    mimeType: string;
    format: string;
  }> {
    try {
      // Importar y usar el generador Word dinámico
      const { DynamicWordGenerator } = await import('./DynamicWordGenerator');
      const wordGenerator = new DynamicWordGenerator(design);
      const wordData = await wordGenerator.generateDocument(scout);
      
      const filename = this.generateFilename(scout, 'docx');
      
      return {
        data: new ArrayBuffer(wordData.byteLength),
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        format: 'Word Document'
      };
    } catch (error) {
      console.error('Error generando Word:', error);
      // Fallback a HTML si Word falla
      return this.generateHTMLFromDesign(design, scout);
    }
  }

  /**
   * Crear documento HTML completo
   */
  private createHTMLDocument(design: TableDesign, scout: StrategyScout): string {
    const scoutData = this.mapScoutToData(scout);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNGI-03 - ${scout.nombres} ${scout.apellidos}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${design.font.family}, Arial, sans-serif;
            font-size: ${design.font.size}px;
            line-height: 1.2;
            color: #000;
            padding: 20px;
        }
        
        .document-title {
            font-weight: bold;
            font-size: ${design.font.size + 4}px;
            margin: 15px 0;
            text-align: center;
        }
        
        .main-table {
            width: 100%;
            border-collapse: collapse;
            border: ${design.borderWidth}px solid ${design.borderColor};
            margin-bottom: 15px;
            table-layout: fixed;
        }
        
        .main-table td {
            border: ${design.borderWidth}px solid ${design.borderColor};
            padding: 4px;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .header-cell {
            background-color: #808080;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: ${design.font.size - 1}px;
            padding: 3px;
            vertical-align: middle;
        }
        
        .data-cell {
            min-height: 20px;
            background-color: white;
            font-size: ${design.font.size}px;
            padding: 3px;
        }
    </style>
</head>
<body>
    <div class="document-title">Datos del Miembro Juvenil (menor de edad)</div>
    
    <table class="main-table">
        ${design.rows.map(row => this.generateHTMLRow(row, scoutData)).join('')}
    </table>
</body>
</html>`;
  }

  /**
   * Generar fila HTML
   */
  private generateHTMLRow(row: TableRow, scoutData: Record<string, string>): string {
    return `<tr>${row.cells.map(cell => this.generateHTMLCell(cell, scoutData)).join('')}</tr>`;
  }

  /**
   * Generar celda HTML
   */
  private generateHTMLCell(cell: TableCell, scoutData: Record<string, string>): string {
    const cellContent = this.resolveCellContent(cell, scoutData);
    const cellClass = cell.isHeader ? 'header-cell' : 'data-cell';
    
    return `<td 
                class="${cellClass}"
                colspan="${cell.colspan}"
                rowspan="${cell.rowspan}"
                style="
                    width: ${(cell.colspan / 4) * 100}%;
                    background-color: ${cell.backgroundColor || '#FFFFFF'};
                    color: ${cell.textColor || '#000000'};
                    font-weight: ${cell.fontWeight || 'normal'};
                    text-align: ${cell.textAlign || 'left'};
                    font-size: ${cell.fontSize || 10}px;
                "
            >${cellContent}</td>`;
  }

  /**
   * Resolver contenido de celda
   */
  private resolveCellContent(cell: TableCell, scoutData: Record<string, string>): string {
    if (cell.fieldKey && scoutData[cell.fieldKey]) {
      return scoutData[cell.fieldKey];
    }
    return cell.content || '';
  }

  /**
   * Mapear datos del scout para el template
   */
  private mapScoutToData(scout: StrategyScout): Record<string, string> {
    return {
      apellidos: scout.apellidos || '',
      nombres: scout.nombres || '',
      sexo: scout.sexo || '',
      fecha_nacimiento: this.formatDate(scout.fecha_nacimiento),
      tipo_documento: scout.tipo_documento || 'DNI',
      numero_documento: scout.numero_documento || '',
      celular: scout.celular || '',
      telefono: scout.telefono || '',
      correo: scout.correo_personal || scout.correo_institucional || '',
      correo_institucional: scout.correo_institucional || '',
      correo_personal: scout.correo_personal || '',
      direccion: scout.direccion || '',
      departamento: scout.departamento || 'LIMA',
      provincia: scout.provincia || 'LIMA',
      distrito: scout.distrito || '',
      centro_estudio: scout.centro_estudios || '',
      rama_actual: scout.unidad || 'TROPA',
      observaciones: scout.observaciones_discapacidad || 'NO APLICA'
    };
  }

  /**
   * Adaptar datos del Scout
   */
  private adaptScoutData(scout: Scout): StrategyScout {
    return {
      id: scout.id,
      apellidos: scout.apellidos,
      nombres: scout.nombres,
      sexo: scout.sexo,
      fecha_nacimiento: scout.fecha_nacimiento,
      tipo_documento: scout.tipo_documento,
      numero_documento: scout.numero_documento,
      unidad: scout.rama_actual || 'TROPA',
      direccion: scout.direccion,
      codigo_postal: '',
      departamento: scout.departamento,
      provincia: scout.provincia,
      distrito: scout.distrito,
      correo_institucional: scout.correo,
      correo_personal: '',
      celular: scout.celular,
      telefono: scout.telefono,
      religion: '',
      centro_estudios: scout.centro_estudio,
      año_estudios: '',
      grupo_sanguineo: '',
      factor_sanguineo: '',
      seguro_medico: '',
      tipo_discapacidad: 'NINGUNA',
      observaciones_discapacidad: 'NO APLICA'
    };
  }

  /**
   * Formatear fecha
   */
  private formatDate(dateString?: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Generar nombre de archivo
   */
  private generateFilename(scout: StrategyScout, extension: string): string {
    const scoutName = `${scout.apellidos || 'Scout'}_${scout.nombres || 'Unknown'}`.replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `DNGI-03_${scoutName}_${timestamp}.${extension}`;
  }
}

/**
 * Utilidad para generar documentos masivos con diseño personalizado
 */
export class BulkDynamicDocumentGenerator {
  private adapter: DynamicDocumentAdapter;

  constructor() {
    this.adapter = new DynamicDocumentAdapter();
  }

  /**
   * Generar documentos masivos con diseño personalizado
   */
  async generateBulkDocuments(
    design: TableDesign,
    scouts: Scout[],
    format: DocumentFormat,
    progressCallback?: (progress: number, scoutName: string) => void
  ): Promise<{
    documents: Array<{
      scout: Scout;
      document: Uint8Array;
      filename: string;
      mimeType: string;
    }>;
    errors: Array<{
      scout: Scout;
      error: string;
    }>;
  }> {
    const documents: Array<{
      scout: Scout;
      document: Uint8Array;
      filename: string;
      mimeType: string;
    }> = [];
    
    const errors: Array<{
      scout: Scout;
      error: string;
    }> = [];

    for (let i = 0; i < scouts.length; i++) {
      const scout = scouts[i];
      const scoutName = `${scout.apellidos || ''} ${scout.nombres || ''}`.trim();
      
      try {
        if (progressCallback) {
          progressCallback(Math.round((i / scouts.length) * 100), scoutName);
        }

        const result = await this.adapter.generateFromDesign(design, scout, format);
        
        documents.push({
          scout,
          document: new Uint8Array(result.data),
          filename: result.filename,
          mimeType: result.mimeType
        });
      } catch (error) {
        errors.push({
          scout,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    if (progressCallback) {
      progressCallback(100, 'Completado');
    }

    return { documents, errors };
  }
}

export default DynamicDocumentAdapter;