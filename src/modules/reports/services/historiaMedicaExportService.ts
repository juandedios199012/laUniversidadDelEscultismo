/**
 * Servicio para exportar Historia Médica a PDF y DOCX
 */

import React from 'react';
import { generateAndDownloadPDF } from './pdfService';
import { getHistoriaMedicaData } from './reportDataService';
import { ReportMetadata, ReportGenerationResult, ReportStatus } from '../types/reportTypes';
import { HistoriaMedicaReportTemplate } from '../templates/pdf/HistoriaMedicaReportTemplate';
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

/**
 * Genera y descarga el PDF de Historia Médica de un scout
 */
export async function exportarHistoriaMedicaPDF(
  scoutId: string,
  personaId: string,
  options?: {
    organizacion?: string;
    fechaLlenado?: string;
  }
): Promise<ReportGenerationResult> {
  try {
    // 1. Obtener datos de la historia médica
    const data = await getHistoriaMedicaData(scoutId, personaId);

    if (!data) {
      return {
        status: ReportStatus.ERROR,
        fileName: 'historia_medica.pdf',
        error: 'No se encontró información de historia médica para este scout',
      };
    }

    // 1b. Permitir sobreescribir la fecha de llenado (ej. imprimir con la fecha de hoy)
    if (options?.fechaLlenado) {
      data.fechaLlenado = options.fechaLlenado;
    }

    // 2. Preparar metadatos
    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      generatedBy: 'Sistema de Gestión Scout',
      organizacion: options?.organizacion || 'Grupo Scout Lima 12',
      version: '1.0',
    };

    // 3. Crear componente del template
    const Component = React.createElement(HistoriaMedicaReportTemplate, {
      data,
      metadata,
    });

    // 4. Generar nombre de archivo
    const nombreArchivo = `historia_medica_${data.nombreCompleto.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    // 5. Generar y descargar PDF
    return await generateAndDownloadPDF(Component, nombreArchivo);
  } catch (error) {
    console.error('Error exportando Historia Médica a PDF:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'historia_medica.pdf',
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF',
    };
  }
}

/**
 * Genera y descarga el DOCX de Historia Médica de un scout
 * (Implementación básica - se puede expandir según necesidad)
 */
export async function exportarHistoriaMedicaDOCX(
  scoutId: string,
  personaId: string,
  options?: {
    organizacion?: string;
    fechaLlenado?: string;
  }
): Promise<ReportGenerationResult> {
  try {
    // Importar módulo docx dinámicamente
    const {
      Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType,
      Header, ImageRun, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
      BorderStyle, ShadingType, TableLayoutType,
    } = await import('docx');
    const { saveAs } = await import('file-saver');

    // 1. Obtener datos
    const data = await getHistoriaMedicaData(scoutId, personaId);

    if (!data) {
      return {
        status: ReportStatus.ERROR,
        fileName: 'historia_medica.docx',
        error: 'No se encontró información de historia médica para este scout',
      };
    }

    // 1b. Permitir sobreescribir la fecha de llenado (ej. imprimir con la fecha de hoy)
    if (options?.fechaLlenado) {
      data.fechaLlenado = options.fechaLlenado;
    }

    // Un menor de edad no debe firmar como "participante mayor de edad"
    const esMayorDeEdad = data.edad >= 18;

    // 1c. Marca de agua (header flotante detrás del texto, se repite en cada página)
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

    // ============================================================
    // Helpers de estilo — mismo diseño que el template PDF (ANEXO 08)
    // ============================================================
    const PRIMARY_HEX = '2E5A8B';
    const BORDER_HEX = '000000';

    const allBorders = () => ({
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_HEX },
    });

    // Celda "etiqueta" (fondo azul, texto blanco en negrita) — como labelCell del PDF
    const lbl = (text: string, widthPct: number) => new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, fill: PRIMARY_HEX, color: PRIMARY_HEX },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 16 })] })],
    });

    // Celda "valor" (fondo blanco) — como valueCell del PDF
    const val = (text: string | undefined, widthPct: number) => new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [new Paragraph({ children: [new TextRun({ text: text || '', size: 18 })] })],
    });

    // Celda de encabezado de tabla (fondo azul, centrado) — como tableHeaderCell del PDF
    const head = (text: string, widthPct: number) => new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, fill: PRIMARY_HEX, color: PRIMARY_HEX },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 14 })] })],
    });

    // Celda SI/NO
    const check = (mark: boolean, widthPct: number) => new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 20, right: 20 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: mark ? 'X' : '', bold: true, size: 16 })] })],
    });

    // Celda simple bordeada, sin fondo
    const plain = (text: string | undefined, widthPct: number) => new TableCell({
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      borders: allBorders(),
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      children: [new Paragraph({ children: [new TextRun({ text: text || '', size: 16 })] })],
    });

    const seccionTitulo = (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, color: PRIMARY_HEX, size: 20, underline: {} })],
      spacing: { before: 240, after: 120 },
    });

    // Condiciones/alergias/vacunas fijas del formulario — mismas listas que el PDF
    const CONDICIONES_FIJAS = [
      { fila: 'Diabetes Mellitus', nombres: ['diabetes'] },
      { fila: 'Hipertension Arterial', nombres: ['hipertension', 'hipertensión'] },
      { fila: 'Asma', nombres: ['asma'] },
      { fila: 'Convulsiones', nombres: ['convulsion', 'epilepsia'] },
      { fila: 'Lesion traumatica', nombres: ['lesion', 'lesión', 'traumatic', 'trauma'] },
      { fila: 'Tratamiento psicologico o psiquiatrico', nombres: ['psicolog', 'psiquiat'] },
      { fila: 'Cirugias y hospitalizaciones', nombres: ['cirug', 'hospital'] },
    ];
    const ALERGIAS_FIJAS = [
      { fila: 'Medicamentos', nombres: ['medicamentos', 'medicamento', 'penicilina', 'aspirina', 'ibuprofeno', 'sulfas', 'anestésico', 'anestesico'] },
      { fila: 'Alimentos', nombres: ['alimentos', 'alimento', 'maní', 'mani', 'mariscos', 'pescado', 'huevo', 'leche', 'lácteos', 'lacteos', 'gluten', 'trigo', 'soya', 'frutos secos'] },
      { fila: 'Plantas', nombres: ['plantas', 'planta', 'polen', 'ácaros', 'acaros', 'moho', 'pelo de animales', 'ambiental'] },
      { fila: 'Picaduras / mordeduras de insectos', nombres: ['picaduras', 'insectos', 'mordeduras', 'insecto', 'picadura'] },
      { fila: 'Sustancias u otros', nombres: ['sustancias', 'otros', 'otra', 'látex', 'latex', 'níquel', 'niquel', 'cosméticos', 'cosmeticos', 'contacto'] },
    ];
    const VACUNAS_FIJAS = [
      { fila: 'Antiamarilica (fiebre amarilla)', nombres: ['amaril', 'fiebre'] },
      { fila: 'Hepatitis B', nombres: ['hepatitis'] },
      { fila: 'Influenza', nombres: ['influenza', 'gripe'] },
      { fila: 'COVID - 19', nombres: ['covid'] },
      { fila: 'Neumococo', nombres: ['neumococo', 'neumonia'] },
    ];

    // 2. Crear documento Word
    const doc = new Document({
      sections: [
        {
          headers: { default: watermarkHeader() },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({
                text: 'ANEXO 08 - FICHA MEDICA: INFORMACION GENERAL / HISTORIAL DE SALUD',
                bold: true,
                color: PRIMARY_HEX,
                size: 22,
              })],
            }),
            new Paragraph({ text: '' }),

            // Datos Personales
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              rows: [
                new TableRow({ children: [lbl('Fecha de llenado:', 25), val(data.fechaLlenado ? new Date(data.fechaLlenado).toLocaleDateString('es-PE') : '', 75)] }),
                new TableRow({ children: [lbl('Nombre Completo:', 25), val(data.nombreCompleto, 75)] }),
                new TableRow({ children: [lbl('Lugar y Fecha de Nacimiento:', 25), val(`${data.distrito || ''} - ${data.fechaNacimiento ? new Date(data.fechaNacimiento).toLocaleDateString('es-PE') : ''}`, 75)] }),
                new TableRow({ children: [lbl('Edad:', 12), val(`${data.edad} años`, 21), lbl('DNI:', 12), val(data.numeroDocumento, 55)] }),
                new TableRow({ children: [lbl('Estatura (m):', 15), val(data.estaturaCm ? data.estaturaCm.toFixed(2) : '', 18), lbl('Peso (kg):', 12), val(data.pesoKg?.toString(), 55)] }),
                new TableRow({ children: [lbl('Grupo sanguineo y Rh:', 25), val(`${data.grupoSanguineo || ''} ${data.factorSanguineo || ''}`.trim(), 25), lbl('Genero:', 12), val(data.sexo === 'M' ? 'Masculino' : data.sexo === 'F' ? 'Femenino' : data.sexo, 38)] }),
                new TableRow({ children: [lbl('Direccion:', 15), val(data.direccion, 85)] }),
                new TableRow({ children: [lbl('Distrito:', 12), val(data.distrito, 21), lbl('Provincia:', 12), val(data.provincia, 21), lbl('Region:', 12), val(data.departamento, 22)] }),
                new TableRow({ children: [lbl('Compania de Seguros:', 25), val(data.seguroMedico, 25), lbl('Nº Póliza:', 12), val('', 38)] }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Contacto de Emergencia
            seccionTitulo('EN CASO DE EMERGENCIA NOTIFICAR A LA SIGUIENTE PERSONA:'),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              rows: [
                new TableRow({ children: [lbl('Nombre:', 20), val(data.contactoEmergencia?.nombre, 45), lbl('Parentesco:', 15), val(data.contactoEmergencia?.parentesco, 20)] }),
                new TableRow({ children: [lbl('Direccion:', 20), val(data.direccion, 80)] }),
                new TableRow({ children: [lbl('Telefono casa:', 20), val(data.telefonoCasa, 30), lbl('Telefono movil:', 20), val(data.contactoEmergencia?.celular, 30)] }),
                new TableRow({ children: [lbl('Contacto alternativo:', 35), val(data.contactoAlternativo?.nombre, 65)] }),
                new TableRow({ children: [lbl('Parentesco:', 20), val(data.contactoAlternativo?.parentesco, 30), lbl('Telefono movil:', 20), val(data.contactoAlternativo?.celular, 30)] }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Historial de Salud
            seccionTitulo('HISTORIAL DE SALUD'),
            new Paragraph({ children: [new TextRun({ text: '¿Actualmente recibe o ha recibido tratamiento para alguna de las siguientes condiciones?', size: 16, italics: true })], spacing: { after: 100 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              rows: [
                new TableRow({ children: [head('SI', 10), head('NO', 10), head('CONDICION', 55), head('Fecha de Atencion', 25)] }),
                ...CONDICIONES_FIJAS.map((item) => {
                  const encontrada = data.condiciones.find(c => item.nombres.some(n => c.condicion?.toLowerCase().includes(n)));
                  return new TableRow({ children: [check(!!encontrada, 10), check(!encontrada, 10), plain(item.fila, 55), plain(encontrada?.fechaAtencion, 25)] });
                }),
                (() => {
                  const otra = data.condiciones.find(c => c.condicion?.toLowerCase().includes('otra condici'));
                  return new TableRow({ children: [check(!!otra, 10), check(!otra, 10), plain('Otra condicion no mencionada en la presente lista:', 55), plain(otra?.fechaAtencion, 25)] });
                })(),
              ],
            }),
            new Paragraph({ text: '' }),

            // Alergias
            seccionTitulo('ALERGIAS O REACCIONES ADVERSAS'),
            new Paragraph({ children: [new TextRun({ text: '¿Tiene alergias, o presenta reaccion adversa a alguno de los siguientes?', size: 16, italics: true })], spacing: { after: 100 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              rows: [
                new TableRow({ children: [head('SI', 10), head('NO', 10), head('ALERGIAS O REACCIONES', 35), head('MENCIONAR', 45)] }),
                ...ALERGIAS_FIJAS.map((item) => {
                  const enFila = data.alergias.filter(a => item.nombres.some(n => a.alergia?.toLowerCase().includes(n)));
                  const tieneSI = enFila.length > 0;
                  const mencionar = enFila.map(a => a.mencionar || '').filter(Boolean).join(', ');
                  return new TableRow({ children: [check(tieneSI, 10), check(!tieneSI, 10), plain(item.fila, 35), plain(mencionar, 45)] });
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Medicamentos
            seccionTitulo('MEDICAMENTOS ADMINISTRADOS ACTUALMENTE (INCLUYENDO SIN RECETA MEDICA)'),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              rows: [
                new TableRow({ children: [head('MEDICAMENTO', 25), head('DOSIS', 15), head('FRECUENCIA', 20), head('FECHA DE INICIO Y DURACION', 40)] }),
                ...(data.medicamentos.filter(m => m.activo).length > 0
                  ? data.medicamentos.filter(m => m.activo).map(m => new TableRow({
                      children: [plain(m.medicamento, 25), plain(m.dosis, 15), plain(m.frecuencia, 20), plain(m.fechaInicioDuracion, 40)],
                    }))
                  : [new TableRow({ children: [plain('', 25), plain('', 15), plain('', 20), plain('', 40)] })]),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({
                text: 'La administracion de medicamentos indicados para el menor esta aprobada por (colocar nombres, apellidos y documento de identidad): ______________________________________',
                size: 16,
              })],
            }),
            new Paragraph({ text: '' }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              borders: allBorders(),
              rows: [
                new TableRow({
                  children: [new TableCell({
                    borders: allBorders(),
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      children: [new TextRun({
                        text: 'ES RESPONSABILIDAD DEL PADRE O TUTOR INFORMAR A LOS ADULTOS RESPONSABLES DEL GRUPO SCOUT, SI EXISTIESE ALGUNA CONDICION MEDICA POSTERIOR A LO DECLARADO EN EL PRESENTE DOCUMENTO, QUE PUEDA AFECTAR, AFECTE O PRESENTE UN RIESGO LATENTE, AL NORMAL DESARROLLO DE LAS ACTIVIDADES DE SU HIJO O HIJA EN EL MOVIMIENTO SCOUT.',
                        bold: true,
                        size: 18,
                      })],
                    })],
                  })],
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Vacunas
            seccionTitulo('INMUNIZACIONES (VACUNAS)'),
            new Paragraph({ children: [new TextRun({ text: '¿Ha recibido alguna de las siguientes vacunas?', size: 16, italics: true })], spacing: { after: 100 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              rows: [
                new TableRow({ children: [head('SI', 10), head('NO', 10), head('VACUNA', 45), head('FECHA (ULTIMA DOSIS)', 35)] }),
                ...VACUNAS_FIJAS.map((item) => {
                  const encontrada = data.vacunas.find(v => item.nombres.some(n => v.vacuna?.toLowerCase().includes(n)));
                  return new TableRow({ children: [check(!!encontrada, 10), check(!encontrada, 10), plain(item.fila, 45), plain(encontrada?.fechaUltimaDosis, 35)] });
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Restricciones
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              borders: allBorders(),
              rows: [
                new TableRow({
                  children: [new TableCell({
                    borders: allBorders(),
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: 'Restriccion fisica, psicologica, neurologica u otra del participante, si existiese, en:', bold: true, size: 18 })] }),
                      new Paragraph({ children: [new TextRun({ text: data.descripcionDiscapacidad || '', size: 18 })], spacing: { before: 100 } }),
                    ],
                  })],
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Confidencialidad
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              borders: allBorders(),
              rows: [
                new TableRow({
                  children: [new TableCell({
                    shading: { type: ShadingType.SOLID, fill: 'E8F4FC', color: 'E8F4FC' },
                    borders: allBorders(),
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({
                        text: 'La informacion contenida en esta ficha medica es estrictamente confidencial. Sera vista unicamente por el Equipo de Adultos Voluntarios Responsables, el personal de salud y otros que comprendan el caracter reservado de la presente informacion.',
                        italics: true,
                        color: PRIMARY_HEX,
                        size: 16,
                      })],
                    })],
                  })],
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Firmas de Consentimiento
            new Paragraph({
              children: [new TextRun({ text: 'FIRMAS DE CONSENTIMIENTO INFORMADO (firmar la que corresponda)', bold: true, size: 20 })],
              spacing: { before: 200, after: 300 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              columnWidths: new Array(100).fill(50),
              borders: { top: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, bottom: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, left: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, right: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX } },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, bottom: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, left: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, right: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX } },
                      children: [
                        new Paragraph({ text: '' }),
                        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_HEX } }, children: [new TextRun({ text: ' ' })] }),
                        new Paragraph({ children: [new TextRun({ text: 'Firma del participante mayor de edad', bold: true, size: 16 })], spacing: { before: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: 'Nombres y Apellidos: ', bold: true, size: 14 }), new TextRun({ text: esMayorDeEdad ? (data.nombreCompleto || '') : '', size: 14 })] }),
                        new Paragraph({ children: [new TextRun({ text: 'DNI: ', bold: true, size: 14 }), new TextRun({ text: esMayorDeEdad ? (data.numeroDocumento || '') : '', size: 14 })] }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: { top: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, bottom: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, left: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX }, right: { style: BorderStyle.NONE, size: 0, color: BORDER_HEX } },
                      children: [
                        new Paragraph({ text: '' }),
                        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_HEX } }, children: [new TextRun({ text: ' ' })] }),
                        new Paragraph({ children: [new TextRun({ text: 'Firma del padre o tutor del participante menor de edad', bold: true, size: 16 })], spacing: { before: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: 'Nombres y Apellidos: ', bold: true, size: 14 }), new TextRun({ text: data.contactoEmergencia?.nombre || '', size: 14 })] }),
                        new Paragraph({ children: [new TextRun({ text: 'DNI: ', bold: true, size: 14 }), new TextRun({ text: data.contactoEmergencia?.numeroDocumento || '', size: 14 })] }),
                        new Paragraph({ children: [new TextRun({ text: 'Nombres y Apellidos del menor: ', bold: true, size: 14 }), new TextRun({ text: data.nombreCompleto || '', size: 14 })], spacing: { before: 100 } }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    // 3. Generar y descargar
    const blob = await Packer.toBlob(doc);
    const nombreArchivo = `historia_medica_${data.nombreCompleto.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

    saveAs(blob, nombreArchivo);

    return {
      status: ReportStatus.SUCCESS,
      blob,
      fileName: nombreArchivo,
    };
  } catch (error) {
    console.error('Error exportando Historia Médica a DOCX:', error);
    return {
      status: ReportStatus.ERROR,
      fileName: 'historia_medica.docx',
      error: error instanceof Error ? error.message : 'Error desconocido al generar DOCX',
    };
  }
}
