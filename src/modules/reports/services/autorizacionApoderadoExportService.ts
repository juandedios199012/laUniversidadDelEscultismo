/**
 * Servicio para exportar "Autorización del Padre o Apoderado" (ANEXO 4)
 * a PDF y DOCX. Autocompleta la identificación del Scout y de su Apoderado
 * Legal; los datos de la actividad (nombre, lugar, fecha, cuota, etc.) se
 * reciben en `options.actividad` y se imprimen igual en todos los
 * documentos generados en una misma exportación.
 */

import React from 'react';
import { generateAndDownloadPDF } from './pdfService';
import { getAutorizacionApoderadoData } from './reportDataService';
import { ReportGenerationResult, ReportStatus, AutorizacionApoderadoReportData } from '../types/reportTypes';
import { AutorizacionApoderadoTemplate, AutorizacionApoderadoConsolidadoTemplate } from '../templates/pdf/AutorizacionApoderadoTemplate';
import { marcaAguaFichaMedicaBase64 } from '../../../assets/images/marcaAguaFichaMedicaBase64';

function base64ToUint8Array(base64: string): Uint8Array {
  const b64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function detectImageType(base64: string): 'png' | 'jpg' | 'gif' | 'bmp' {
  const normalized = (base64 || '').toLowerCase();
  if (normalized.startsWith('data:image/jpeg') || normalized.startsWith('data:image/jpg')) return 'jpg';
  if (normalized.startsWith('data:image/gif')) return 'gif';
  if (normalized.startsWith('data:image/bmp')) return 'bmp';
  return 'png';
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatFechaLarga(fechaStr?: string): string {
  if (!fechaStr) return '';
  const fecha = new Date(`${fechaStr}T00:00:00`);
  if (isNaN(fecha.getTime())) return fechaStr;
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} del ${fecha.getFullYear()}`;
}

const DECLARACIONES = [
  'Que acepto la normativa y condiciones de la actividad, reconociendo expresamente que mi representado se encuentra en condiciones físicas adecuadas para el desarrollo de las diferentes acciones de la actividad.',
  'Que conozco y acepto íntegramente la Metodología Scout para el desarrollo de las actividades donde participarán mis representados.',
  'Que, si mi representado padeciera, algún tipo de lesión, habilidad diferente o cualquier otra circunstancia que pudiera agravarse o perjudicar gravemente la salud y/o desarrollo de la actividad, lo pondré en conocimiento de la Organización, aceptando las decisiones que al respecto se adopten por los/as responsables de la Actividad.',
  'Autorizo a la Organización de la Actividad para usar cualquier fotografía, filmación, grabación o cualquier otra forma de archivo de mi participación o la de mis representados/as, en este evento, sin derecho a contraprestación económica.',
  'Reconozco que la participación de mi menor hijo, en esta actividad, conlleva riesgos conocidos, anticipables y/o no anticipables que podrían resultar en lesiones de diversa índole, por lo que expresamente asumo todas las amenazas que se puedan generar por su participación; quedando exonerada, la Asociación de Scouts del Perú, de cualquier responsabilidad ante cualquier evento no deseado que pudiera surgir.',
];

function actividadFilas(actividad?: AutorizacionApoderadoReportData['actividad']): [string, string][] {
  return [
    ['Nombre de la Actividad:', actividad?.nombreActividad || ''],
    ['Lugar de la Actividad:', actividad?.lugar || ''],
    ['Fecha(s) y hora de la Actividad:', actividad?.fechaHora || ''],
    ['Cuota de participación:', actividad?.cuota || ''],
    ['Director:', actividad?.director || ''],
    ['Dirigente Responsable:', actividad?.dirigenteResponsable || ''],
    ['Dirigente(s) Acompañante(s)', actividad?.acompanantes || ''],
    ['Colaborador:', actividad?.colaborador || ''],
  ];
}

type AutorizacionApoderadoExportOptions = {
  fechaDocumento?: string;
  actividad?: AutorizacionApoderadoReportData['actividad'];
};

/**
 * Genera y descarga el PDF de Autorización del Padre o Apoderado de un scout
 */
export async function exportarAutorizacionApoderadoPDF(
  scoutId: string,
  personaId: string,
  options?: AutorizacionApoderadoExportOptions
): Promise<ReportGenerationResult> {
  try {
    const data = await getAutorizacionApoderadoData(scoutId, personaId);

    if (!data) {
      return {
        status: ReportStatus.ERROR,
        fileName: 'autorizacion_padre_apoderado.pdf',
        error: 'No se encontró información del scout para generar la autorización',
      };
    }

    if (options?.fechaDocumento) {
      data.fechaDocumento = options.fechaDocumento;
    }
    if (options?.actividad) {
      data.actividad = options.actividad;
    }

    const Component = React.createElement(AutorizacionApoderadoTemplate, { data });

    const nombreArchivo = `ANEXO 4 - AUTORIZACION - ${data.nombreCompleto}`;

    return await generateAndDownloadPDF(Component, nombreArchivo);
  } catch (error) {
    console.error('Error exportando Autorización del Padre o Apoderado a PDF:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'autorizacion_padre_apoderado.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF',
    };
  }
}

/**
 * Genera y descarga un único PDF consolidado con la Autorización del Padre o
 * Apoderado de varios scouts elegidos manualmente (una página por scout).
 */
export async function exportarAutorizacionApoderadoConsolidadoPDF(
  scoutIds: string[],
  options?: AutorizacionApoderadoExportOptions
): Promise<ReportGenerationResult> {
  try {
    const resultados = await Promise.all(
      scoutIds.map((scoutId) => getAutorizacionApoderadoData(scoutId, ''))
    );

    const datas = resultados.filter((d): d is AutorizacionApoderadoReportData => d !== null);

    if (datas.length === 0) {
      return {
        status: ReportStatus.ERROR,
        fileName: 'autorizacion_padre_apoderado_consolidado.pdf',
        error: 'No se encontró información para ninguno de los scouts seleccionados',
      };
    }

    datas.forEach((data) => {
      if (options?.fechaDocumento) data.fechaDocumento = options.fechaDocumento;
      if (options?.actividad) data.actividad = options.actividad;
    });

    const Component = React.createElement(AutorizacionApoderadoConsolidadoTemplate, { datas });

    const nombreArchivo = `ANEXO 4 - AUTORIZACION - CONSOLIDADO (${datas.length})`;

    return await generateAndDownloadPDF(Component, nombreArchivo);
  } catch (error) {
    console.error('Error exportando Autorización del Padre o Apoderado consolidada a PDF:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'autorizacion_padre_apoderado_consolidado.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF',
    };
  }
}

/**
 * Genera y descarga el DOCX de Autorización del Padre o Apoderado de un scout
 */
export async function exportarAutorizacionApoderadoDOCX(
  scoutId: string,
  personaId: string,
  options?: AutorizacionApoderadoExportOptions
): Promise<ReportGenerationResult> {
  try {
    const {
      Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType,
      Header, ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
      BorderStyle, ShadingType, TableLayoutType,
    } = await import('docx');
    const { saveAs } = await import('file-saver');

    const data = await getAutorizacionApoderadoData(scoutId, personaId);

    if (!data) {
      return {
        status: ReportStatus.ERROR,
        fileName: 'autorizacion_padre_apoderado.docx',
        error: 'No se encontró información del scout para generar la autorización',
      };
    }

    if (options?.fechaDocumento) {
      data.fechaDocumento = options.fechaDocumento;
    }
    if (options?.actividad) {
      data.actividad = options.actividad;
    }

    const PRIMARY_HEX = '4F81BD';
    const BORDER_HEX = '000000';
    const tipoApoderado = data.apoderado?.tipo;

    const watermarkHeader = () => new Header({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: base64ToUint8Array(marcaAguaFichaMedicaBase64),
              type: detectImageType(marcaAguaFichaMedicaBase64),
              transformation: { width: 794, height: 1123 },
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                allowOverlap: true,
                lockAnchor: false,
                behindDocument: true,
              },
            }),
          ],
        }),
      ],
    });

    const allBorders = () => ({
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
    });

    const lbl = (text: string) => new TableCell({
      width: { size: 35, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, fill: PRIMARY_HEX, color: PRIMARY_HEX },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 16 })] })],
    });

    const val = (text: string) => new TableCell({
      width: { size: 65, type: WidthType.PERCENTAGE },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
    });

    const doc = new Document({
      sections: [
        {
          headers: { default: watermarkHeader() },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'ANEXO 4 - AUTORIZACIÓN DE PARTICIPACIÓN', bold: true, size: 24, underline: {} })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Para Miembros Juveniles Menores de Edad', bold: true, italics: true, size: 18 })],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: `Yo: ${data.apoderado?.nombre || ''} identificado con DNI: ${data.apoderado?.numeroDocumento || ''}, `, size: 18 }),
                new TextRun({ text: `${tipoApoderado === 'PADRE' ? '☒' : '☐'} Padre    `, size: 18 }),
                new TextRun({ text: `${tipoApoderado === 'MADRE' ? '☒' : '☐'} Madre    `, size: 18 }),
                new TextRun({ text: `${tipoApoderado === 'APODERADO' ? '☒' : '☐'} Apoderado`, size: 18 }),
              ],
              spacing: { after: 80 },
            }),
            (() => {
              const sexoNorm = (data.sexo || '').toUpperCase();
              const esNina = sexoNorm === 'F' || sexoNorm === 'FEMENINO';
              const esNino = sexoNorm === 'M' || sexoNorm === 'MASCULINO';
              return new Paragraph({
                children: [
                  new TextRun({ text: 'del ', size: 18 }),
                  new TextRun({ text: `${esNino ? '☒' : '☐'} niño    `, size: 18 }),
                  new TextRun({ text: `${esNina ? '☒' : '☐'} niña    `, size: 18 }),
                  new TextRun({ text: '☐ joven: ', size: 18 }),
                  new TextRun({ text: `${data.nombreCompleto || ''} identificado con DNI: ${data.numeroDocumento || ''}`, size: 18 }),
                ],
                spacing: { after: 80 },
              });
            })(),
            new Paragraph({
              children: [new TextRun({
                text: `y código de asociado N° ${data.codigoScout || ''} por medio de la presente, autorizo la participación de mi menor hijo(a) en la Actividad organizada por el Grupo Scout Lima 12, que tiene las siguientes características:`,
                size: 18,
              })],
              spacing: { after: 120 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              rows: actividadFilas(data.actividad).map(([label, valor]) => new TableRow({ children: [lbl(label), val(valor)] })),
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              children: [new TextRun({ text: 'Asimismo, declaro:', bold: true, size: 18 })],
              spacing: { after: 100 },
            }),
            ...DECLARACIONES.map((texto, idx) => new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({ text: `${idx + 1}. `, size: 16 }),
                new TextRun({ text: texto, size: 16 }),
              ],
              spacing: { after: 100 },
            })),

            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `Lima, ${formatFechaLarga(data.fechaDocumento)}`, size: 18 })],
              spacing: { before: 200, after: 400 },
            }),

            ...(data.apoderado?.firmaBase64
              ? [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new ImageRun({
                    data: base64ToUint8Array(data.apoderado.firmaBase64),
                    type: detectImageType(data.apoderado.firmaBase64),
                    transformation: { width: 140, height: 50 },
                  })],
                })]
              : []),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              indent: { left: 2500, right: 2500 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_HEX } },
              children: [new TextRun({ text: ' ' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Firma', bold: true, size: 18 })],
              spacing: { before: 60 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `Nombre y Apellidos: ${data.apoderado?.nombre || ''}`, size: 18 })],
              spacing: { before: 100 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `DNI: ${data.apoderado?.numeroDocumento || ''}`, size: 18 })],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const nombreArchivo = `ANEXO 4 - AUTORIZACION - ${data.nombreCompleto}.docx`;

    saveAs(blob, nombreArchivo);

    return {
      status: ReportStatus.SUCCESS,
      blob,
      fileName: nombreArchivo,
    };
  } catch (error) {
    console.error('Error exportando Autorización del Padre o Apoderado a DOCX:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'autorizacion_padre_apoderado.docx',
      error: error instanceof Error ? error.message : 'Error desconocido al generar DOCX',
    };
  }
}
