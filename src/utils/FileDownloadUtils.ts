// ================================================================
// 🔄 Utilidades para Descarga de Archivos
// ================================================================

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import HTMLTemplateGenerator from './HTMLTemplateGenerator';

export interface DownloadableDocument {
  filename: string;
  content: Blob | string;
  mimeType?: string;
}

export class FileDownloadUtils {
  /**
   * Crea documento HTML con diseño perfecto DNGI-03
   */
  static createHTMLDocument(scoutName: string): Blob {
    try {
      // Simular datos del scout (en producción vendría de la base de datos)
      const scoutData = HTMLTemplateGenerator.convertScoutToHTMLData({
        apellidos: scoutName.split(' ').slice(-2).join(' '),
        nombres: scoutName.split(' ').slice(0, -2).join(' '),
      });

      const htmlContent = HTMLTemplateGenerator.generateHTML(scoutData);
      
      return new Blob([htmlContent], { type: 'text/html' });
      
    } catch (error) {
      console.error('Error creating HTML document:', error);
      return this.createMockWordDocument(scoutName);
    }
  }

  /**
   * Crea un documento Word real con formato DNGI-03 completo basado en el documento oficial
   */
  static async createRealWordDocument(scoutName: string): Promise<Blob> {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Encabezado con información del documento
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "[LOGOTIPO SCOUT]", size: 16, italics: true })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES", bold: true, size: 18 })],
                        alignment: AlignmentType.CENTER 
                      })],
                      width: { size: 60, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Código: DNGI-03", size: 14 })] }),
                        new Paragraph({ children: [new TextRun({ text: "Fecha:", size: 14 })] }),
                        new Paragraph({ children: [new TextRun({ text: "Versión: 2.1", size: 14 })] }),
                        new Paragraph({ children: [new TextRun({ text: "Páginas: Página 4 de 4", size: 14 })] }),
                      ],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),

            // Texto de instrucciones
            new Paragraph({
              children: [
                new TextRun({
                  text: "Estimado Padre de Familia, apoderado o tutor, es necesario que todos los datos estén llenos y con información exacta. Una vez completo, deberá hacérselo llegar a su Jefe de Grupo junto con su documento de identidad (DNI o Carné de Extranjería) y del de su menor hijo o apoderado para el proceso de inscripción.",
                  size: 20,
                })
              ],
              spacing: { before: 400, after: 400 },
            }),

            // Datos del Miembro Juvenil
            new Paragraph({
              children: [
                new TextRun({
                  text: "Datos del Miembro Juvenil (menor de edad)",
                  bold: true,
                  size: 22,
                })
              ],
              spacing: { before: 200, after: 200 },
            }),

            // Datos del Miembro Juvenil - Tabla principal
            new Table({
              rows: [
                // Fila 1: Apellidos y Nombres
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "APELLIDOS COMPLETOS", bold: true, size: 18, color: "FFFFFF" })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "NOMBRES COMPLETOS", bold: true, size: 18, color: "FFFFFF" })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                // Fila 2: Espacios vacíos para llenar
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                // Fila 3: Sexo, Fecha Nacimiento, Tipo Doc, Número Doc
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "SEXO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "FECHA DE NACIMIENTO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "TIPO DE DOCUMENTO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "NÚMERO DE DOCUMENTO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                // Fila 4: Espacios vacíos para datos personales
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                  ],
                }),
                // Fila 5: Región, Localidad, Numeral, Unidad
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "REGIÓN", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "LOCALIDAD", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "NUMERAL", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "UNIDAD", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                // Fila 6: Valores del grupo scout
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "XVIII", bold: true, size: 18 })],
                        alignment: AlignmentType.CENTER 
                      })],
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "LIMA", bold: true, size: 18 })],
                        alignment: AlignmentType.CENTER 
                      })],
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "12", bold: true, size: 18 })],
                        alignment: AlignmentType.CENTER 
                      })],
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "TROPA", bold: true, size: 18 })],
                        alignment: AlignmentType.CENTER 
                      })],
                    }),
                  ],
                }),
                // Fila 7: Dirección y Código Postal
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "DIRECCIÓN", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 75, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" },
                      columnSpan: 3,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "CÓDIGO POSTAL", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                // Fila 8: Espacios para dirección
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      columnSpan: 3,
                    }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                  ],
                }),
                // Fila 9: Departamento, Provincia, Distrito
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "DEPARTAMENTO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "PROVINCIA", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "DISTRITO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 34, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" },
                      columnSpan: 2,
                    }),
                  ],
                }),
                // Fila 10: Espacios para ubicación
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      columnSpan: 2,
                    }),
                  ],
                }),
                // Fila 11: Correos electrónicos
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "CORREO ELECTRONICO INSTITUCIONAL", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" },
                      columnSpan: 2,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "CORREO ELECTRÓNICO PERSONAL", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" },
                      columnSpan: 2,
                    }),
                  ],
                }),
                // Fila 12: Espacios para correos
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      columnSpan: 2,
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      columnSpan: 2,
                    }),
                  ],
                }),
                // Fila 13: Celular, Teléfono, Religión
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "CELULAR", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "TELEFONO DEL DOMICILIO", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "RELIGIÓN O CREDO", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 34, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" },
                      columnSpan: 2,
                    }),
                  ],
                }),
                // Fila 14: Espacios para contacto
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      columnSpan: 2,
                    }),
                  ],
                }),
                // Fila 15: Centro de Estudios y Año
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "CENTRO DE ESTUDIOS", bold: true, size: 16, color: "FFFFFF" })] })],
                      width: { size: 75, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" },
                      columnSpan: 3,
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "AÑO DE ESTUDIOS", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                // Fila 16: Espacios para estudios
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })],
                      columnSpan: 3,
                    }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                  ],
                }),
                // Fila 17: Información médica (5 columnas)
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "GRUPO SANGUÍNEO", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "FACTOR SANGUÍNEO", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "SEGURO MÉDICO", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "TIPO DE DISCAPACIDAD", bold: true, size: 12, color: "FFFFFF" })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "CARNÉ CONADIS", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                // Fila 18: Espacios para información médica
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " ", size: 24 })] })] }),
                  ],
                }),
              ],
            }),

            // Separador para el campo de discapacidad
            new Paragraph({
              children: [new TextRun({ text: "", size: 12 })],
              spacing: { before: 100, after: 100 },
            }),

            // Campo adicional para especificar discapacidad
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "SI CUENTA CON ALGÚN TIPO DE DISCAPACIDAD, POR FAVOR ESPECIFIQUE EL CASO", bold: true, size: 14, color: "FFFFFF" })] })],
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      shading: { fill: "808080" }
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [
                        new Paragraph({ children: [new TextRun({ text: " ", size: 36 })] }),
                        new Paragraph({ children: [new TextRun({ text: " ", size: 36 })] }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Datos de los Padres de Familia
            new Paragraph({
              children: [
                new TextRun({
                  text: "Datos de los Padres de Familia (Tutores o Apoderados)",
                  bold: true,
                  size: 22,
                })
              ],
              spacing: { before: 400, after: 200 },
            }),

            // Primera tabla de padre/madre
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "APELLIDOS COMPLETOS", bold: true, size: 16 })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "NOMBRES COMPLETOS", bold: true, size: 16 })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "SEXO", bold: true, size: 16 })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "TIPO DE DOCUMENTO", bold: true, size: 16 })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "NÚMERO DE DOCUMENTO", bold: true, size: 16 })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "PARENTESCO", bold: true, size: 16 })] })],
                      width: { size: 25, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "", size: 20 })] })] }),
                  ],
                }),
              ],
            }),

            // Espacio entre tablas
            new Paragraph({
              children: [new TextRun({ text: "", size: 20 })],
              spacing: { before: 200, after: 200 },
            }),

            // Declaración y compromiso
            new Paragraph({
              children: [
                new TextRun({
                  text: "Yo, _________________________ como adulto apoderado (padre, madre o tutor) y que suscribe y declara el presente documento, identificado con DNI N° ____________, comprendo que el movimiento Scout contribuye a la educación de niños y jóvenes para que participen en un mundo mejor, donde las personas se desarrollen plenamente y jueguen un papel constructivo en la sociedad, también declaro que he leído detenidamente cuales son los derechos y deberes de los padres de Familia de acuerdo a los artículos 181, 182 y 183 del REGLAMENTO DE LA ASOCIACIÓN DE SCOUTS DEL PERÚ, por lo cual me comprometo a cumplir todos mis deberes para con el GRUPO SCOUT y la ASOCIACIÓN DE SCOUTS DEL PERÚ, a los que estoy brindando la confianza y autorización para que mi menor hijo (a) participe en sus actividades. Me comprometo también a participar en todas las reuniones, asambleas y/o actividades que se programe en su beneficio.",
                  size: 20,
                })
              ],
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "Asimismo:", bold: true, size: 20 })],
              spacing: { before: 200, after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "1. Declaro tener conocimiento de la Política para la Protección de los Miembros Juveniles de la Asociación de Scouts del Perú*, así como comprometerme a velar por su cumplimiento.",
                  size: 18,
                })
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "2. Declaro tener conocimiento del Código de Conducta de Adultos de la Asociación de Scouts del Perú*, así como comprometerme a velar por su cumplimiento.",
                  size: 18,
                })
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "3. Declaro tener conocimiento de la Política Mundial de A Salvo del Peligro* de la Organización Mundial del Movimiento Scout, así como comprometerme a velar por su cumplimiento.",
                  size: 18,
                })
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "4. Declaro tener conocimiento de las Normas para Actividades Scouts* de la Asociación de Scouts del Perú, así como comprometerme a velar por su cumplimiento.",
                  size: 18,
                })
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "5. Autorizo asignar a mi menor hijo (a) una cuenta institucional Office 365 (en caso de no tenerla aun) y me comprometo al cumplimiento de las Reglas de Uso de las Cuentas Office 365*.",
                  size: 18,
                })
              ],
              spacing: { after: 200 },
            }),

            // Autorización de imágenes
            new Paragraph({
              children: [
                new TextRun({
                  text: "Autorizo a la Asociación de Scouts del Perú (ASP) el uso de imágenes fotográficas o videos en los que aparece mi menor, en medios de comunicación físicos y virtuales, conforme a lo señalado en las leyes de nuestro país, con la finalidad de difundir las actividades y eventos scout que realizan, sin recibir ningún tipo de retribución o contraprestación por ello.",
                  size: 18,
                })
              ],
              spacing: { before: 200, after: 200 },
            }),

            // Declaración final
            new Paragraph({
              children: [
                new TextRun({
                  text: "Con la firma de este documento declaro bajo juramento que la información contenida en este FORMATO DE REGISTRO INSTITUCIONAL y la documentación adjunta, se ajusta estrictamente a la verdad. Cualquier omisión o distorsión estará baja la responsabilidad de quién declara y firma.",
                  size: 18,
                })
              ],
              spacing: { before: 200, after: 300 },
            }),

            // Tipo de registro y anexos
            new Paragraph({
              children: [new TextRun({ text: "Tipo de Registro Anual: _________________________", size: 18 })],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "Anexo: Copia del documento de identidad del menor", size: 18 })],
              spacing: { after: 50 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "        Copia de documento de identidad del declarante para validar la firma", size: 18 })],
              spacing: { after: 50 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "        En caso de ser tutor: Copia del documento que lo acredite como tal", size: 18 })],
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "Fecha: _________________________", size: 18 })],
              spacing: { after: 300 },
            }),

            // Sección de firma
            new Paragraph({
              children: [new TextRun({ text: "____________________________________________", size: 18 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [new TextRun({ text: "FIRMA (igual que en su documento de identidad)", bold: true, size: 18 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),

            // Espacios para nombres y huella
            new Paragraph({
              children: [new TextRun({ text: "_________________________      [ESPACIO PARA HUELLA]", size: 18 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 500 },
            }),

            // Pie de página
            new Paragraph({
              children: [
                new TextRun({
                  text: "* Publicado en la página web de la Asociación de Scouts del Perú.",
                  size: 16,
                  italics: true,
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
            }),
          ],
        }],
      });

      // Convertir a Blob
      const blob = await Packer.toBlob(doc);
      return blob;
      
    } catch (error) {
      console.error('Error creating Word document:', error);
      // Fallback al método anterior si hay error
      return this.createMockWordDocument(scoutName);
    }
  }

  /**
   * Crea un documento Word simulado (placeholder) - Método legacy
   */
  static createMockWordDocument(scoutName: string): Blob {
    // Contenido básico XML para un documento Word
    const wordContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>DOCUMENTO DNGI-03</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>FORMATO DE REGISTRO INSTITUCIONAL PARA MIEMBROS JUVENILES</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Scout: ${scoutName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Fecha de generación: ${new Date().toLocaleDateString('es-PE')}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Este es un documento de ejemplo generado automáticamente.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

    return new Blob([wordContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  }

  /**
   * Descarga un único archivo
   */
  static downloadSingleFile(filename: string, content: Blob): void {
    try {
      saveAs(content, filename);
      console.log(`✅ Descarga iniciada: ${filename}`);
    } catch (error) {
      console.error('❌ Error al descargar archivo:', error);
      throw new Error(`Error al descargar ${filename}`);
    }
  }

  /**
   * Crea un archivo ZIP con múltiples documentos y lo descarga
   */
  static async downloadMultipleFilesAsZip(
    documents: DownloadableDocument[],
    zipFilename: string = 'documentos-dngi03.zip',
    progressCallback?: (progress: number, current: string) => void
  ): Promise<void> {
    try {
      const zip = new JSZip();
      
      // Agregar cada documento al ZIP
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        if (progressCallback) {
          progressCallback(i, doc.filename);
        }
        
        // Agregar archivo al ZIP
        if (doc.content instanceof Blob) {
          const arrayBuffer = await doc.content.arrayBuffer();
          zip.file(doc.filename, arrayBuffer);
        } else {
          zip.file(doc.filename, doc.content);
        }
        
        // Pequeña pausa para no bloquear la UI
        if (i % 10 === 0 && i > 0) {
          await this.sleep(10);
        }
      }
      
      if (progressCallback) {
        progressCallback(documents.length, 'Generando archivo ZIP...');
      }
      
      // Generar el ZIP
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Descargar el ZIP
      saveAs(zipBlob, zipFilename);
      
      console.log(`✅ ZIP generado y descargado: ${zipFilename}`);
      console.log(`📦 Contenido: ${documents.length} documentos`);
      
    } catch (error) {
      console.error('❌ Error al crear ZIP:', error);
      throw new Error('Error al generar el archivo ZIP');
    }
  }

  /**
   * Genera un nombre de archivo único para evitar conflictos
   */
  static generateUniqueFilename(baseName: string, extension: string = 'docx'): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const cleanName = baseName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').trim();
    return `${cleanName}_${timestamp}.${extension}`;
  }

  /**
   * Genera un nombre de archivo seguro para el scout
   */
  static generateScoutFilename(scoutName: string, documentType: string = 'DNGI-03'): string {
    const safeName = scoutName
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
    
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${documentType}_${safeName}_${timestamp}.docx`;
  }

  /**
   * Calcula el tamaño estimado del ZIP
   */
  static estimateZipSize(documentCount: number, avgDocSizeKB: number = 250): string {
    const totalSizeKB = documentCount * avgDocSizeKB * 0.7; // Factor de compresión
    
    if (totalSizeKB < 1024) {
      return `${Math.round(totalSizeKB)} KB`;
    } else if (totalSizeKB < 1024 * 1024) {
      return `${(totalSizeKB / 1024).toFixed(1)} MB`;
    } else {
      return `${(totalSizeKB / (1024 * 1024)).toFixed(1)} GB`;
    }
  }

  /**
   * Pausa asíncrona para evitar bloquear la UI
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpia recursos de URLs creadas
   */
  static cleanupObjectURL(url: string): void {
    try {
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('No se pudo limpiar URL:', error);
    }
  }
}

export default FileDownloadUtils;