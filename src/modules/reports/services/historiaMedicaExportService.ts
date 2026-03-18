/**
 * Servicio para exportar Historia Médica a PDF y DOCX
 */

import React from 'react';
import { generateAndDownloadPDF } from './pdfService';
import { getHistoriaMedicaData } from './reportDataService';
import { ReportMetadata, ReportGenerationResult, ReportStatus } from '../types/reportTypes';
import { HistoriaMedicaReportTemplate } from '../templates/pdf/HistoriaMedicaReportTemplate';

/**
 * Genera y descarga el PDF de Historia Médica de un scout
 */
export async function exportarHistoriaMedicaPDF(
  scoutId: string,
  personaId: string,
  options?: {
    logoUrl?: string;
    organizacion?: string;
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
      logoUrl: options?.logoUrl,
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
  }
): Promise<ReportGenerationResult> {
  try {
    // Importar módulo docx dinámicamente
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } = await import('docx');
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

    // 2. Función helper para crear filas de tabla
    const createTableRow = (label: string, value: string) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ text: value || 'N/A' })],
            width: { size: 70, type: WidthType.PERCENTAGE },
          }),
        ],
      });
    };

    // 3. Crear documento Word
    const doc = new Document({
      sections: [
        {
          children: [
            // Título
            new Paragraph({
              text: 'HISTORIA MÉDICA',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Ficha de Salud del Scout - ${options?.organizacion || 'Grupo Scout Lima 12'}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: '' }),

            // Datos Personales
            new Paragraph({
              text: '1. DATOS PERSONALES',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                createTableRow('Nombre Completo', data.nombreCompleto),
                createTableRow('Código Scout', data.codigoScout || 'N/A'),
                createTableRow('Fecha de Nacimiento', data.fechaNacimiento ? new Date(data.fechaNacimiento).toLocaleDateString('es-PE') : 'N/A'),
                createTableRow('Edad', `${data.edad} años`),
                createTableRow('Sexo', data.sexo === 'M' ? 'Masculino' : data.sexo === 'F' ? 'Femenino' : data.sexo || 'N/A'),
                createTableRow('Estatura', data.estaturaCm ? `${data.estaturaCm} m` : 'N/A'),
                createTableRow('Peso', data.pesoKg ? `${data.pesoKg} kg` : 'N/A'),
                createTableRow('Grupo Sanguíneo', `${data.grupoSanguineo || 'N/A'} ${data.factorSanguineo || ''}`),
                createTableRow('Rama / Patrulla', `${data.rama || 'N/A'} / ${data.patrulla || 'Sin patrulla'}`),
              ],
            }),
            new Paragraph({ text: '' }),

            // Contacto de Emergencia
            new Paragraph({
              text: '2. CONTACTO DE EMERGENCIA',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                createTableRow('Nombre', data.contactoEmergencia?.nombre || 'No registrado'),
                createTableRow('Parentesco', data.contactoEmergencia?.parentesco || 'N/A'),
                createTableRow('Teléfono', data.contactoEmergencia?.celular || data.contactoEmergencia?.telefono || 'N/A'),
              ],
            }),
            new Paragraph({ text: '' }),

            // Seguro Médico
            new Paragraph({
              text: '3. SEGURO Y ATENCIÓN MÉDICA',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                createTableRow('Seguro Médico', data.seguroMedico || 'No tiene'),
                createTableRow('N° Póliza', data.numeroPoliza || 'N/A'),
                createTableRow('Médico de Cabecera', data.medicoCabecera || 'No especificado'),
                createTableRow('Teléfono Médico', data.telefonoMedico || 'N/A'),
                createTableRow('Hospital Preferencia', data.hospitalPreferencia || 'No especificado'),
              ],
            }),
            new Paragraph({ text: '' }),

            // Condiciones Médicas
            new Paragraph({
              text: '4. CONDICIONES MÉDICAS',
              heading: HeadingLevel.HEADING_2,
            }),
            data.condiciones.length === 0
              ? new Paragraph({ children: [new TextRun({ text: 'No se han registrado condiciones médicas', italics: true })] })
              : new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Condición', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tratamiento', bold: true })] })] }),
                      ],
                    }),
                    ...data.condiciones.map(c => new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: c.nombre })] }),
                        new TableCell({ children: [new Paragraph({ text: c.activa ? 'Activa' : 'Controlada' })] }),
                        new TableCell({ children: [new Paragraph({ text: c.tratamiento || '-' })] }),
                      ],
                    })),
                  ],
                }),
            new Paragraph({ text: '' }),

            // Alergias
            new Paragraph({
              text: '5. ALERGIAS',
              heading: HeadingLevel.HEADING_2,
            }),
            data.alergias.length === 0
              ? new Paragraph({ children: [new TextRun({ text: 'No se han registrado alergias conocidas', italics: true })] })
              : new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Alergia', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tipo', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Mención', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tratamiento', bold: true })] })] }),
                      ],
                    }),
                    ...data.alergias.map(a => new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: a.nombre })] }),
                        new TableCell({ children: [new Paragraph({ text: a.tipo })] }),
                        new TableCell({ children: [new Paragraph({ text: a.mencionar || '-' })] }),
                        new TableCell({ children: [new Paragraph({ text: a.tratamientoEmergencia || '-' })] }),
                      ],
                    })),
                  ],
                }),
            new Paragraph({ text: '' }),

            // Medicamentos
            new Paragraph({
              text: '6. MEDICAMENTOS ACTUALES',
              heading: HeadingLevel.HEADING_2,
            }),
            data.medicamentos.filter(m => m.activo).length === 0
              ? new Paragraph({ children: [new TextRun({ text: 'No toma medicamentos actualmente', italics: true })] })
              : new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Medicamento', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dosis', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Frecuencia', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Motivo', bold: true })] })] }),
                      ],
                    }),
                    ...data.medicamentos.filter(m => m.activo).map(m => new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: m.nombre })] }),
                        new TableCell({ children: [new Paragraph({ text: m.dosis })] }),
                        new TableCell({ children: [new Paragraph({ text: m.frecuencia })] }),
                        new TableCell({ children: [new Paragraph({ text: m.motivo || '-' })] }),
                      ],
                    })),
                  ],
                }),
            new Paragraph({ text: '' }),

            // Vacunas
            new Paragraph({
              text: '7. REGISTRO DE VACUNAS',
              heading: HeadingLevel.HEADING_2,
            }),
            data.vacunas.length === 0
              ? new Paragraph({ children: [new TextRun({ text: 'No se han registrado vacunas', italics: true })] })
              : new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Vacuna', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Fecha', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dosis', bold: true })] })] }),
                      ],
                    }),
                    ...data.vacunas.map(v => new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: v.nombre })] }),
                        new TableCell({ children: [new Paragraph({ text: v.fechaAplicacion ? new Date(v.fechaAplicacion).toLocaleDateString('es-PE') : 'N/A' })] }),
                        new TableCell({ children: [new Paragraph({ text: v.dosisNumero?.toString() || '-' })] }),
                      ],
                    })),
                  ],
                }),
            new Paragraph({ text: '' }),

            // Observaciones
            new Paragraph({
              text: '8. OBSERVACIONES GENERALES',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: data.observacionesGenerales || 'Sin observaciones adicionales.',
            }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '' }),

            // Firma
            new Paragraph({
              text: '____________________________                    ____________________________',
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: 'Firma del Padre/Madre/Apoderado                DNI del Padre/Madre/Apoderado',
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    // 4. Generar y descargar
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
