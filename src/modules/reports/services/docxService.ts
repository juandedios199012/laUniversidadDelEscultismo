/**
 * Servicio para generación de documentos Word (DOCX)
 * Utiliza docx.js
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  ScoutReportData,
  AttendanceData,
  ProgressData,
  ReportMetadata,
  ReportGenerationResult,
  ReportStatus,
} from '../types/reportTypes';
import { formatDate } from './pdfService';

/**
 * Genera un documento Word genérico
 */
export async function generateDOCX(
  doc: Document,
  fileName: string
): Promise<ReportGenerationResult> {
  try {
    const blob = await Packer.toBlob(doc);

    return {
      status: ReportStatus.SUCCESS,
      blob,
      fileName: `${fileName}.docx`,
    };
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: `${fileName}.docx`,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera y descarga un documento Word
 */
export async function generateAndDownloadDOCX(
  doc: Document,
  fileName: string
): Promise<ReportGenerationResult> {
  try {
    const result = await generateDOCX(doc, fileName);

    if (result.status === ReportStatus.SUCCESS && result.blob) {
      saveAs(result.blob, result.fileName);
    }

    return result;
  } catch (error) {
    console.error('Error downloading DOCX:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: `${fileName}.docx`,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Genera reporte de Scout en formato DOCX
 */
export function createScoutReportDOCX(
  scout: ScoutReportData,
  metadata: ReportMetadata
): Document {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Título
          new Paragraph({
            text: 'REPORTE DE SCOUT',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Generado: ${formatDate(metadata.generatedAt)}`,
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),

          // Información Personal
          new Paragraph({
            text: 'Información Personal',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          createInfoTable([
            ['Nombre Completo', `${scout.nombre} ${scout.apellido}`],
            ['Número de Registro', scout.numeroRegistro],
            ['Fecha de Nacimiento', formatDate(scout.fechaNacimiento)],
            ['Edad', `${scout.edad} años`],
            ['Rama', scout.rama],
            ['Patrulla', scout.patrulla || 'N/A'],
            ['Fecha de Ingreso', formatDate(scout.fechaIngreso)],
          ]),

          // Información de Contacto
          new Paragraph({
            text: 'Información de Contacto',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          createInfoTable([
            ['Dirección', scout.direccion || 'N/A'],
            ['Teléfono', scout.telefono || 'N/A'],
            ['Email', scout.email || 'N/A'],
            ['Contacto de Emergencia', scout.contactoEmergencia || 'N/A'],
          ]),

          // Información Familiar
          new Paragraph({
            text: 'Información Familiar',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),

          createInfoTable([
            ['Nombre del Padre', scout.nombrePadre || 'N/A'],
            ['Nombre de la Madre', scout.nombreMadre || 'N/A'],
          ]),

          // Observaciones
          ...(scout.observaciones
            ? [
                new Paragraph({
                  text: 'Observaciones',
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 200 },
                }),
                new Paragraph({
                  text: scout.observaciones,
                  spacing: { after: 200 },
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Genera reporte de asistencia en formato DOCX
 */
export function createAttendanceReportDOCX(
  attendanceData: AttendanceData[],
  metadata: ReportMetadata,
  dateRange: { from: string; to: string }
): Document {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Título
          new Paragraph({
            text: 'REPORTE DE ASISTENCIA',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Periodo: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generado: ${formatDate(metadata.generatedAt)}`,
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),

          // Tabla de asistencia
          createAttendanceTable(attendanceData),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Genera reporte de progreso en formato DOCX
 */
export function createProgressReportDOCX(
  progressData: ProgressData[],
  metadata: ReportMetadata
): Document {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Título
          new Paragraph({
            text: 'REPORTE DE PROGRESO',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Generado: ${formatDate(metadata.generatedAt)}`,
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),

          // Tabla de progreso
          createProgressTable(progressData),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Crea una tabla de información clave-valor
 */
function createInfoTable(data: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: data.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                    }),
                  ],
                }),
              ],
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: {
                fill: 'E0E0E0',
                type: ShadingType.SOLID,
              },
            }),
            new TableCell({
              children: [new Paragraph({ text: value })],
              width: { size: 65, type: WidthType.PERCENTAGE },
            }),
          ],
        })
    ),
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

/**
 * Crea una tabla de asistencia
 */
function createAttendanceTable(data: AttendanceData[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Fecha', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Scout', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Estado', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Observaciones', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
    ],
  });

  const dataRows = data.map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: formatDate(item.fecha) })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.scoutNombre })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.presente
                      ? 'Presente'
                      : item.justificado
                      ? 'Justificado'
                      : 'Ausente',
                    bold: true,
                    color: item.presente
                      ? '27AE60'
                      : item.justificado
                      ? 'F39C12'
                      : 'E74C3C',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.motivo || '-' })],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

/**
 * Crea una tabla de progreso
 */
function createProgressTable(data: ProgressData[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Scout', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Especialidad', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Nivel', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Estado', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Progreso', bold: true })],
          }),
        ],
        shading: { fill: '0066CC', type: ShadingType.SOLID },
      }),
    ],
  });

  const dataRows = data.map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: item.scoutNombre })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.especialidad })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.nivel })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.estado,
                    bold: true,
                    color:
                      item.estado === 'completado'
                        ? '27AE60'
                        : item.estado === 'en_progreso'
                        ? 'F39C12'
                        : 'E74C3C',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${item.porcentaje}%` })],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

export default {
  generateDOCX,
  generateAndDownloadDOCX,
  createScoutReportDOCX,
  createAttendanceReportDOCX,
  createProgressReportDOCX,
};
