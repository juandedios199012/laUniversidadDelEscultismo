/**
 * Enhanced Word Document Generator
 * Follows Single Responsibility Principle and uses Template Configuration
 */

import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, WidthType, AlignmentType, HeightRule, BorderStyle } from 'docx';
import { ITemplateConfig, DNGI03TemplateConfig } from '../config/TemplateConfig';

// Scout interface definition
export interface Scout {
  id?: string;
  apellidos?: string;
  nombres?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  unidad?: string;
  direccion?: string;
  codigo_postal?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  correo_institucional?: string;
  correo_personal?: string;
  celular?: string;
  telefono?: string;
  religion?: string;
  centro_estudios?: string;
  año_estudios?: string;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  observaciones_discapacidad?: string;
}

export interface IDocumentGenerator {
  generateDocument(scout: Scout): Promise<Buffer>;
}

export class EnhancedWordGenerator implements IDocumentGenerator {
  private config: ITemplateConfig;

  constructor(config?: ITemplateConfig) {
    this.config = config || new DNGI03TemplateConfig();
  }

  async generateDocument(scout: Scout): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: this.convertToTwips(this.config.margins.top),
              bottom: this.convertToTwips(this.config.margins.bottom),
              left: this.convertToTwips(this.config.margins.left),
              right: this.convertToTwips(this.config.margins.right),
            },
          },
        },
        children: [
          this.createSectionTitle(),
          this.createMainTable(scout),
          this.createAdditionalInfoTable(scout)
        ]
      }]
    });

    return await Packer.toBuffer(doc);
  }

  private createSectionTitle(): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: "Datos del Miembro Juvenil (menor de edad)",
          font: this.config.font.family,
          size: Math.round(this.config.font.size * 2), // docx usa half-points
          bold: true,
        }),
      ],
      spacing: {
        after: 200,
      },
    });
  }

  private createMainTable(scout: Scout): Table {
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [
        // Fila 1: APELLIDOS COMPLETOS (2 cols) | NOMBRES COMPLETOS (2 cols)
        new TableRow({
          children: [
            this.createHeaderCell("APELLIDOS COMPLETOS", 2, this.config.font.family),
            this.createHeaderCell("NOMBRES COMPLETOS", 2, this.config.font.family),
          ],
        }),
        // Fila 2: Datos de apellidos y nombres
        new TableRow({
          children: [
            this.createDataCell(scout.apellidos || '', 2, this.config.font.family),
            this.createDataCell(scout.nombres || '', 2, this.config.font.family),
          ],
        }),
        // Fila 3: SEXO | FECHA NACIMIENTO | TIPO DOC | NÚMERO DOC
        new TableRow({
          children: [
            this.createHeaderCell("SEXO", 1, this.config.font.family),
            this.createHeaderCell("FECHA DE\nNACIMIENTO", 1, this.config.font.family),
            this.createHeaderCell("TIPO DE\nDOCUMENTO", 1, this.config.font.family),
            this.createHeaderCell("NÚMERO DE\nDOCUMENTO", 1, this.config.font.family),
          ],
        }),
        // Fila 4: Datos de detalles
        new TableRow({
          children: [
            this.createDataCell(scout.sexo || '', 1, this.config.font.family),
            this.createDataCell(this.formatDate(scout.fecha_nacimiento), 1, this.config.font.family),
            this.createDataCell(scout.tipo_documento || 'DNI', 1, this.config.font.family),
            this.createDataCell(scout.numero_documento || '', 1, this.config.font.family),
          ],
        }),
        // Fila 5: REGIÓN | LOCALIDAD | NUMERAL | UNIDAD
        new TableRow({
          children: [
            this.createHeaderCell("REGIÓN", 1, this.config.font.family),
            this.createHeaderCell("LOCALIDAD", 1, this.config.font.family),
            this.createHeaderCell("NUMERAL", 1, this.config.font.family),
            this.createHeaderCell("UNIDAD", 1, this.config.font.family),
          ],
        }),
        // Fila 6: Datos de ubicación
        new TableRow({
          children: [
            this.createDataCell("XVIII", 1, this.config.font.family),
            this.createDataCell("LIMA", 1, this.config.font.family),
            this.createDataCell("12", 1, this.config.font.family),
            this.createDataCell(scout.unidad || 'TROPA', 1, this.config.font.family),
          ],
        }),
        // Fila 7: DIRECCIÓN (3 cols) | CÓDIGO POSTAL
        new TableRow({
          children: [
            this.createHeaderCell("DIRECCIÓN", 3, this.config.font.family),
            this.createHeaderCell("CÓDIGO\nPOSTAL", 1, this.config.font.family),
          ],
        }),
        // Fila 8: Datos de dirección
        new TableRow({
          children: [
            this.createDataCell(scout.direccion || '', 3, this.config.font.family),
            this.createDataCell(scout.codigo_postal || '', 1, this.config.font.family),
          ],
        }),
        // Fila 9: DEPARTAMENTO | PROVINCIA | DISTRITO (2 cols)
        new TableRow({
          children: [
            this.createHeaderCell("DEPARTAMENTO", 1, this.config.font.family),
            this.createHeaderCell("PROVINCIA", 1, this.config.font.family),
            this.createHeaderCell("DISTRITO", 2, this.config.font.family),
          ],
        }),
        // Fila 10: Datos de ubicación detallada
        new TableRow({
          children: [
            this.createDataCell(scout.departamento || 'LIMA', 1, this.config.font.family),
            this.createDataCell(scout.provincia || 'LIMA', 1, this.config.font.family),
            this.createDataCell(scout.distrito || '', 2, this.config.font.family),
          ],
        }),
        // Fila 11: CORREO INSTITUCIONAL (2 cols) | CORREO PERSONAL (2 cols)
        new TableRow({
          children: [
            this.createHeaderCell("CORREO ELECTRONICO\nINSTITUCIONAL", 2, this.config.font.family),
            this.createHeaderCell("CORREO ELECTRÓNICO\nPERSONAL", 2, this.config.font.family),
          ],
        }),
        // Fila 12: Datos de correos
        new TableRow({
          children: [
            this.createDataCell(scout.correo_institucional || '', 2, this.config.font.family),
            this.createDataCell(scout.correo_personal || '', 2, this.config.font.family),
          ],
        }),
        // Fila 13: CELULAR | TELÉFONO | RELIGIÓN (2 cols)
        new TableRow({
          children: [
            this.createHeaderCell("CELULAR", 1, this.config.font.family),
            this.createHeaderCell("TELEFONO DEL\nDOMICILIO", 1, this.config.font.family),
            this.createHeaderCell("RELIGIÓN O CREDO", 2, this.config.font.family),
          ],
        }),
        // Fila 14: Datos de contacto
        new TableRow({
          children: [
            this.createDataCell(scout.celular || '', 1, this.config.font.family),
            this.createDataCell(scout.telefono || '', 1, this.config.font.family),
            this.createDataCell(scout.religion || '', 2, this.config.font.family),
          ],
        }),
        // Fila 15: CENTRO DE ESTUDIOS (3 cols) | AÑO DE ESTUDIOS
        new TableRow({
          children: [
            this.createHeaderCell("CENTRO DE ESTUDIOS", 3, this.config.font.family),
            this.createHeaderCell("AÑO DE\nESTUDIOS", 1, this.config.font.family),
          ],
        }),
        // Fila 16: Datos de estudios
        new TableRow({
          children: [
            this.createDataCell(scout.centro_estudios || '', 3, this.config.font.family),
            this.createDataCell(scout.año_estudios || '', 1, this.config.font.family),
          ],
        }),
      ],
    });
  }

  private createAdditionalInfoTable(scout: Scout): Table {
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      },
      rows: [
        // Información médica - Headers
        new TableRow({
          children: [
            this.createHeaderCell("GRUPO\nSANGUÍNEO", 1, this.config.font.family),
            this.createHeaderCell("FACTOR\nSANGUÍNEO", 1, this.config.font.family),
            this.createHeaderCell("SEGURO\nMÉDICO", 1, this.config.font.family),
            this.createHeaderCell("TIPO DE\nDISCAPACIDAD", 1, this.config.font.family),
          ],
        }),
        // Información médica - Datos
        new TableRow({
          children: [
            this.createDataCell(scout.grupo_sanguineo || '', 1, this.config.font.family),
            this.createDataCell(scout.factor_sanguineo || '', 1, this.config.font.family),
            this.createDataCell(scout.seguro_medico || '', 1, this.config.font.family),
            this.createDataCell(scout.tipo_discapacidad || 'NINGUNA', 1, this.config.font.family),
          ],
        }),
        // Campo de observaciones
        new TableRow({
          children: [
            this.createHeaderCell("SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO", 4, this.config.font.family),
          ],
        }),
        new TableRow({
          children: [
            this.createDataCell(scout.observaciones_discapacidad || 'NO APLICA', 4, this.config.font.family, 60),
          ],
        }),
      ],
    });
  }

  private createHeaderCell(text: string, colspan: number, fontFamily: string): TableCell {
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              font: fontFamily,
              size: this.config.font.size * 2 - 2, // Ligeramente más pequeño para headers
              bold: true,
              color: this.config.colors.headerText.replace('#', ''),
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      shading: {
        fill: this.config.colors.headerBackground.replace('#', ''),
      },
      columnSpan: colspan,
      width: {
        size: Math.round(100 / (4 / colspan)), // Distribuir equitativamente
        type: WidthType.PERCENTAGE,
      },
      margins: {
        top: this.config.table.cellPadding * 20,
        bottom: this.config.table.cellPadding * 20,
        left: this.config.table.cellPadding * 20,
        right: this.config.table.cellPadding * 20,
      },
    });
  }

  private createDataCell(text: string, colspan: number, fontFamily: string, height?: number): TableCell {
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              font: fontFamily,
              size: this.config.font.size * 2,
              color: this.config.colors.cellText.replace('#', ''),
            }),
          ],
          alignment: AlignmentType.LEFT,
        }),
      ],
      shading: {
        fill: this.config.colors.cellBackground.replace('#', ''),
      },
      columnSpan: colspan,
      width: {
        size: Math.round(100 / (4 / colspan)),
        type: WidthType.PERCENTAGE,
      },
      margins: {
        top: this.config.table.cellPadding * 20,
        bottom: this.config.table.cellPadding * 20,
        left: this.config.table.cellPadding * 20,
        right: this.config.table.cellPadding * 20,
      },
      ...(height && {
        height: {
          value: height * 20, // Convert to twips
          rule: HeightRule.EXACT,
        },
      }),
    });
  }

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

  private convertToTwips(value: number): number {
    // Convierte milímetros a twips (1 mm = 56.69 twips)
    return Math.round(value * 56.69);
  }
}