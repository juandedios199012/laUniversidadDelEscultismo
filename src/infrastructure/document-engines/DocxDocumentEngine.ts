// ================================================================
// 🏗️ Infrastructure: DOCX Engine Implementation
// ================================================================

import { DocumentEngine } from '../../domain/services/DocumentGenerationService';
import { DocumentTemplate, DocumentField } from '../../domain/entities/DocumentTemplate';
import { DocumentData } from '../../domain/entities/DocumentData';
import { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, HeadingLevel, Table, TableCell, TableRow, WidthType, ImageRun } from 'docx';

export class DocxDocumentEngine implements DocumentEngine {
  supports(format: string): boolean {
    return format === 'docx';
  }

  async generate(template: DocumentTemplate, data: DocumentData): Promise<Buffer> {
    try {
      // Crear documento DOCX
      const doc = new Document({
        sections: [
          {
            properties: {},
            headers: {
              default: await this.createHeader(template, data)
            },
            footers: template.footer ? {
              default: await this.createFooter(template, data)
            } : undefined,
            children: await this.createDocumentContent(template, data)
          }
        ]
      });

      // Generar buffer
      return await Packer.toBuffer(doc);
    } catch (error) {
      throw new Error(`DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createHeader(template: DocumentTemplate, data: DocumentData): Promise<Header> {
    const children: Paragraph[] = [];

    // Logo si existe
    if (template.header.logo) {
      // Aquí se añadiría la lógica para cargar y añadir el logo
      // children.push(new Paragraph({
      //   children: [new ImageRun({...})],
      //   alignment: AlignmentType.CENTER
      // }));
    }

    // Título principal
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: template.header.title,
            bold: true,
            size: 28,
            font: 'Arial'
          })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
      })
    );

    // Subtítulo si existe
    if (template.header.subtitle) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: template.header.subtitle,
              size: 20,
              font: 'Arial'
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );
    }

    // Información de la organización
    const orgInfo = template.header.organizationInfo;
    if (orgInfo) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: orgInfo.name,
              bold: true,
              size: 16
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );

      if (orgInfo.address || orgInfo.phone || orgInfo.email) {
        const contactInfo = [
          orgInfo.address,
          orgInfo.phone,
          orgInfo.email
        ].filter(Boolean).join(' | ');

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactInfo,
                size: 12
              })
            ],
            alignment: AlignmentType.CENTER
          })
        );
      }
    }

    return new Header({
      children
    });
  }

  private async createFooter(template: DocumentTemplate, data: DocumentData): Promise<Footer> {
    const children: Paragraph[] = [];

    if (template.footer?.text) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: template.footer.text,
              size: 10
            })
          ],
          alignment: AlignmentType.CENTER
        })
      );
    }

    if (template.footer?.includeDate) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generado el: ${new Date().toLocaleDateString('es-ES')}`,
              size: 10,
              italics: true
            })
          ],
          alignment: AlignmentType.RIGHT
        })
      );
    }

    return new Footer({
      children
    });
  }

  private async createDocumentContent(template: DocumentTemplate, data: DocumentData): Promise<Paragraph[]> {
    const content: Paragraph[] = [];

    // Espacio después del header
    content.push(new Paragraph({ text: '' }));
    content.push(new Paragraph({ text: '' }));

    // Procesar cada sección del template
    for (const section of template.sections.sort((a, b) => a.order - b.order)) {
      // Título de sección
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 18,
              color: '1f4e79'
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      // Contenido de la sección según layout
      if (section.layout.columns === 1) {
        // Layout de una columna
        for (const field of section.fields) {
          const fieldContent = await this.renderField(field, data);
          if (fieldContent) {
            content.push(fieldContent);
          }
        }
      } else {
        // Layout de múltiples columnas usando tabla
        const table = await this.createFieldTable(section.fields, data, section.layout.columns);
        if (table) {
          content.push(new Paragraph({ children: [] })); // Espacio antes de la tabla
          // Las tablas se añaden de manera diferente en docx
          // content.push(table);
        }
      }

      // Espacio después de la sección
      content.push(new Paragraph({ text: '' }));
    }

    return content;
  }

  private async renderField(field: DocumentField, data: DocumentData): Promise<Paragraph | null> {
    const value = this.getFieldValue(data, field.dataSource);
    
    if (value === undefined || value === null) {
      if (field.validation?.required) {
        return new Paragraph({
          children: [
            new TextRun({
              text: `${field.label}: [CAMPO REQUERIDO FALTANTE]`,
              color: 'FF0000',
              bold: true
            })
          ]
        });
      }
      return null;
    }

    const formattedValue = this.formatFieldValue(value, field);

    return new Paragraph({
      children: [
        new TextRun({
          text: `${field.label}: `,
          bold: true
        }),
        new TextRun({
          text: formattedValue
        })
      ],
      spacing: { after: 120 }
    });
  }

  private async createFieldTable(fields: DocumentField[], data: DocumentData, columns: number): Promise<Table | null> {
    const rows: TableRow[] = [];
    
    // Crear filas con el número de columnas especificado
    for (let i = 0; i < fields.length; i += columns) {
      const rowFields = fields.slice(i, i + columns);
      const cells: TableCell[] = [];

      for (const field of rowFields) {
        const value = this.getFieldValue(data, field.dataSource);
        const formattedValue = value ? this.formatFieldValue(value, field) : '';
        
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${field.label}: `,
                    bold: true,
                    size: 10
                  }),
                  new TextRun({
                    text: formattedValue,
                    size: 10
                  })
                ]
              })
            ],
            width: { size: 100 / columns, type: WidthType.PERCENTAGE }
          })
        );
      }

      // Rellenar celdas vacías si es necesario
      while (cells.length < columns) {
        cells.push(new TableCell({
          children: [new Paragraph({ text: '' })],
          width: { size: 100 / columns, type: WidthType.PERCENTAGE }
        }));
      }

      rows.push(new TableRow({ children: cells }));
    }

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE }
    });
  }

  private getFieldValue(data: DocumentData, dataSource: string): any {
    const path = dataSource.split('.');
    let value: any = data;
    
    for (const key of path) {
      value = value?.[key];
    }
    
    return value;
  }

  private formatFieldValue(value: any, field: DocumentField): string {
    if (value === null || value === undefined) {
      return '';
    }

    // Formateo según tipo de campo
    switch (field.type) {
      case 'date':
        if (value instanceof Date) {
          return field.format?.dateFormat === 'short' 
            ? value.toLocaleDateString('es-ES')
            : value.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
        }
        return String(value);

      case 'number':
        if (typeof value === 'number') {
          return field.format?.numberFormat === 'currency'
            ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
            : value.toLocaleString('es-ES');
        }
        return String(value);

      case 'text':
        const text = String(value);
        if (field.format?.textTransform) {
          switch (field.format.textTransform) {
            case 'uppercase':
              return text.toUpperCase();
            case 'lowercase':
              return text.toLowerCase();
            case 'capitalize':
              return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          }
        }
        return text;

      case 'email':
      case 'phone':
        return String(value);

      default:
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value);
    }
  }
}