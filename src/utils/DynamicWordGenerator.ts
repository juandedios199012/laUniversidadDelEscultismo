/**
 * 📝 Dynamic Word Generator
 * Genera documentos Word basados en diseños visuales personalizados
 */

import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import { TableDesign, TableCell as DesignCell, TableRow as DesignRow } from '../components/documents/TableDesigner';
import { Scout as StrategyScout } from './DocumentGenerationStrategy';

export class DynamicWordGenerator {
  private design: TableDesign;

  constructor(design: TableDesign) {
    this.design = design;
  }

  /**
   * Generar documento Word con diseño personalizado
   */
  async generateDocument(scout: StrategyScout): Promise<Uint8Array> {
    const scoutData = this.mapScoutToData(scout);
    const baseFontSize = Math.max(this.design.font?.size || 11, 11);

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5" en twips
              right: 720,  // 0.5" en twips
              bottom: 720, // 0.5" en twips
              left: 720    // 0.5" en twips
            }
          }
        },
        children: [
          // Título del documento
          new Paragraph({
            children: [
              new TextRun({
                text: "Datos del Miembro Juvenil (menor de edad)",
                bold: true,
                size: (baseFontSize + 4) * 2 // Convertir a half-points
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }
          }),
          
          // Tabla principal generada dinámicamente
          this.createDynamicTable(scoutData)
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Crear tabla dinámica basada en el diseño
   */
  private createDynamicTable(scoutData: Record<string, string>): Table {
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      rows: this.design.rows.map(row => this.createTableRow(row, scoutData)),
      borders: {
        top: { style: BorderStyle.SINGLE, size: this.design.borderWidth },
        bottom: { style: BorderStyle.SINGLE, size: this.design.borderWidth },
        left: { style: BorderStyle.SINGLE, size: this.design.borderWidth },
        right: { style: BorderStyle.SINGLE, size: this.design.borderWidth },
        insideHorizontal: { style: BorderStyle.SINGLE, size: this.design.borderWidth },
        insideVertical: { style: BorderStyle.SINGLE, size: this.design.borderWidth }
      }
    });
  }

  /**
   * Crear fila de tabla
   */
  private createTableRow(row: DesignRow, scoutData: Record<string, string>): TableRow {
    return new TableRow({
      children: row.cells.map(cell => this.createTableCell(cell, scoutData))
    });
  }

  /**
   * Crear celda de tabla
   */
  private createTableCell(cell: DesignCell, scoutData: Record<string, string>): TableCell {
    const cellContent = this.resolveCellContent(cell, scoutData);
    const resolvedFontSize = Math.max(cell.fontSize || this.design.font?.size || 11, 11);
    
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: cellContent,
              bold: cell.fontWeight === 'bold',
              size: resolvedFontSize * 2, // Convertir a half-points
              color: (cell.textColor || '#000000').replace('#', '')
            })
          ],
          alignment: this.getAlignment(cell.textAlign || 'left')
        })
      ],
      columnSpan: cell.colspan,
      rowSpan: cell.rowspan,
      shading: {
        fill: (cell.backgroundColor || '#FFFFFF').replace('#', '')
      },
      margins: {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60
      }
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
   * Convertir alineación de texto
   */
  private getAlignment(textAlign: string): typeof AlignmentType[keyof typeof AlignmentType] {
    switch (textAlign) {
      case 'center':
        return AlignmentType.CENTER;
      case 'right':
        return AlignmentType.RIGHT;
      case 'justify':
        return AlignmentType.JUSTIFIED;
      default:
        return AlignmentType.LEFT;
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

export default DynamicWordGenerator;