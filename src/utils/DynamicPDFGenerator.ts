/**
 * 📊 Dynamic PDF Generator
 * Genera documentos PDF basados en diseños visuales personalizados
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableDesign, TableCell as DesignCell } from '../components/documents/TableDesigner';
import { Scout as StrategyScout } from './DocumentGenerationStrategy';

export class DynamicPDFGenerator {
  private design: TableDesign;

  constructor(design: TableDesign) {
    this.design = design;
  }

  /**
   * Generar PDF con diseño personalizado
   */
  async generatePDF(scout: StrategyScout): Promise<Uint8Array> {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const scoutData = this.mapScoutToData(scout);

      // Configurar fuente
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(this.design.font.size);

      // Título del documento
      doc.setFontSize(this.design.font.size + 4);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Miembro Juvenil (menor de edad)', 105, 20, { align: 'center' });

      // Generar tabla dinámica
      await this.generateDynamicTable(doc, scoutData);

      // Convertir a Uint8Array de forma segura
      const pdfOutput = doc.output('arraybuffer');
      const uint8Array = new Uint8Array(pdfOutput);
      
      console.log('✅ PDF generado correctamente, tamaño:', uint8Array.byteLength);
      
      return uint8Array;
    } catch (error) {
      console.error('❌ Error en generatePDF:', error);
      throw new Error(`Error generando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Generar tabla dinámica en PDF
   */
  private async generateDynamicTable(doc: jsPDF, scoutData: Record<string, string>): Promise<void> {
    // Preparar datos para autoTable
    const tableData: any[][] = [];
    
    this.design.rows.forEach(row => {
      const rowData: any[] = [];
      row.cells.forEach(cell => {
        const cellContent = this.resolveCellContent(cell, scoutData);
        
        // Configurar estilo de celda
        const cellStyle = {
          content: cellContent,
          styles: {
            fontSize: cell.fontSize || this.design.font.size,
            fontStyle: cell.fontWeight === 'bold' ? 'bold' : 'normal',
            fillColor: this.hexToRgb(cell.backgroundColor || '#FFFFFF'),
            textColor: this.hexToRgb(cell.textColor || '#000000'),
            halign: this.convertAlignment(cell.textAlign || 'left'),
            valign: 'middle',
            lineWidth: 0.1, // Borde fino para cada celda
            cellPadding: { top: 3, right: 3, bottom: 3, left: 3 } // Padding uniforme
          },
          colSpan: cell.colspan || 1,
          rowSpan: cell.rowspan || 1
        };
        
        rowData.push(cellStyle);
      });
      tableData.push(rowData);
    });

    // Configurar autoTable
    autoTable(doc, {
      startY: 30,
      head: [],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: this.design.font.size,
        font: 'helvetica',
        cellPadding: {
          top: this.design.cellPadding?.top || 3,
          right: this.design.cellPadding?.right || 3,
          bottom: this.design.cellPadding?.bottom || 3,
          left: this.design.cellPadding?.left || 3
        },
        lineWidth: this.design.borderWidth || 0.5,
        lineColor: this.hexToRgb(this.design.borderColor || '#000000'),
        textColor: this.hexToRgb(this.design.defaultTextColor || '#000000')
      },
      headStyles: {
        fillColor: this.hexToRgb(this.design.headerBackgroundColor || '#4a5568'),
        textColor: this.hexToRgb(this.design.headerTextColor || '#ffffff'),
        fontStyle: this.design.font.weight === 'bold' ? 'bold' : 'normal',
        lineWidth: this.design.borderWidth || 0.5
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' }
      },
      tableWidth: 'auto',
      margin: {
        top: this.design.tableMargin?.top || 10,
        left: this.design.tableMargin?.left || 10,
        right: this.design.tableMargin?.right || 10
      },
      tableLineWidth: this.design.borderWidth || 0.5,
      tableLineColor: this.hexToRgb(this.design.borderColor || '#000000')
    });
  }

  /**
   * Resolver contenido de celda
   */
  private resolveCellContent(cell: DesignCell, scoutData: Record<string, string>): string {
    if (cell.fieldKey && scoutData[cell.fieldKey]) {
      return scoutData[cell.fieldKey];
    }
    return cell.content || '';
  }

  /**
   * Convertir hex a RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

  /**
   * Convertir alineación
   */
  private convertAlignment(align: string): 'left' | 'center' | 'right' {
    switch (align) {
      case 'center':
        return 'center';
      case 'right':
        return 'right';
      default:
        return 'left';
    }
  }

  /**
   * Mapear datos del scout
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
}

export default DynamicPDFGenerator;