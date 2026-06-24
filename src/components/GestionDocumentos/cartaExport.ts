import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import type { CartaData } from './CartaOficialDocumento';
import { fechaLarga } from './CartaOficialDocumento';

type DocxImageType = 'png' | 'jpg' | 'gif' | 'bmp';
type FetchedImage = { data: ArrayBuffer; type: DocxImageType; width: number; height: number };

function detectImageType(buf: ArrayBuffer): DocxImageType | null {
  const b = new Uint8Array(buf);
  if (b[0] === 0x89 && b[1] === 0x50) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b[0] === 0x47 && b[1] === 0x49) return 'gif';
  if (b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  return null;
}

function imageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth || 200, height: img.naturalHeight || 80 });
    img.onerror = () => resolve({ width: 200, height: 80 });
    img.src = url;
  });
}

// Descarga una imagen remota y la prepara para incrustar en el .docx.
// Devuelve null si falla (p. ej. CORS) para que el documento se genere igual.
async function fetchImage(url?: string): Promise<FetchedImage | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    const type = detectImageType(data);
    if (!type) return null;
    const { width, height } = await imageDimensions(url);
    return { data, type, width, height };
  } catch {
    return null;
  }
}

// Escala una imagen a una altura objetivo (px) conservando la proporción.
function scaledImageRun(img: FetchedImage, targetHeight: number): ImageRun {
  const ratio = img.width > 0 && img.height > 0 ? img.width / img.height : 2.5;
  return new ImageRun({
    data: img.data,
    type: img.type,
    transformation: { width: Math.round(targetHeight * ratio), height: targetHeight },
  });
}

function numeroCartaTexto({ numeroCarta, anio, plantilla }: CartaData): string {
  return [
    numeroCarta?.trim() || '000',
    anio?.trim() || String(new Date().getFullYear()),
    plantilla?.carta_prefijo || 'ASL12',
  ].join(' – ');
}

function nombreArchivo(data: CartaData): string {
  const inst = (data.institucion?.nombre_institucion || 'institucion')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
  return `Carta_${data.numeroCarta?.trim() || '000'}_${inst}`;
}

// ================================================================
// PDF — impresión nativa del navegador (window.print)
// Toma el nodo ya renderizado (con estilos inline) para máxima fidelidad.
// ================================================================
export function imprimirCartaPDF(node: HTMLElement | null) {
  if (!node) return;
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) {
    alert('Habilita las ventanas emergentes para generar el PDF.');
    return;
  }
  win.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>Carta Oficial</title>` +
    `<style>` +
    `@page { size: A4; margin: 0; }` +
    `* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }` +
    `html, body { margin: 0; padding: 0; background: #fff; }` +
    `</style></head><body>${node.outerHTML}</body></html>`
  );
  win.document.close();
  win.focus();
  // Pequeña espera para que carguen logo/firma antes de imprimir.
  setTimeout(() => {
    win.print();
  }, 400);
}

// ================================================================
// WORD (.docx) — generación estructurada con la librería `docx`
// Mantiene la verticalidad y los saltos de línea solicitados.
// La cabecera de ancho completo (banner + emblema) y la firma se
// incrustan descargando las imágenes; si alguna falla (CORS), el
// documento se genera igual sin esa imagen.
// ================================================================
export async function descargarCartaWord(data: CartaData) {
  const { plantilla: p, institucion: inst, evento: ev } = data;
  const actividad = ev?.dinamico_actividad || '________________';
  const nombreInst = inst?.nombre_institucion || '________________';
  const direccion = inst?.direccion || '';

  const justify = AlignmentType.JUSTIFIED;

  // Descarga las imágenes en paralelo (cabecera + firma).
  const [banner, emblema, firma] = await Promise.all([
    fetchImage(p?.logo_url),
    fetchImage(p?.emblema_url),
    fetchImage(p?.firma_url_imagen),
  ]);

  // Cabecera de ancho completo: tabla sin bordes, banner (izq.) y emblema (der.).
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const cabeceraBloque: (Table | Paragraph)[] =
    banner || emblema
      ? [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
              insideHorizontal: noBorder, insideVertical: noBorder,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: banner ? [scaledImageRun(banner, 64)] : [new TextRun('')],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: emblema ? [scaledImageRun(emblema, 72)] : [new TextRun('')],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 120 } }),
        ]
      : [];

  const datoLinea = (label: string, valor?: string) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun({ text: valor || '—' }),
      ],
    });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cabecera (banner + emblema) a ancho completo
          ...cabeceraBloque,

          // Fecha + numeración (derecha)
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(fechaLarga())] }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 240 },
            children: [new TextRun({ text: `Carta Nro. ${numeroCartaTexto(data)}`, bold: true })],
          }),

          // Destinatario
          new Paragraph({
            children: [
              new TextRun({ text: `${inst?.encargado_cargo || 'Señor(a)'}: `, bold: true }),
              new TextRun({ text: inst?.encargado_nombre || '________________', bold: true }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: nombreInst, bold: true })] }),
          ...(direccion
            ? [new Paragraph({ children: [new TextRun({ text: direccion, italics: true })] })]
            : []),
          new Paragraph({ text: '' }),

          // Asunto
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'ASUNTO: ', bold: true }),
              new TextRun({ text: actividad.toUpperCase(), bold: true }),
            ],
          }),

          // Presentación
          new Paragraph({
            alignment: justify,
            spacing: { after: 160 },
            children: [
              new TextRun(
                p?.parrafo_presentacion ||
                  'Por medio de la presente expreso mi saludo y parabienes a su gestión, a la vez comunicarle que nuestra institución, como parte de su ciclo de programa va a realizar una '
              ),
              new TextRun({ text: actividad, bold: true, underline: {} }),
              new TextRun(' en las instalaciones del '),
              new TextRun({
                text: `${nombreInst}${direccion ? ` (${direccion})` : ''}`,
                bold: true,
                underline: {},
              }),
              new TextRun(' que Ud. administra, y solicitarle nos brinde las facilidades del caso.'),
            ],
          }),

          // Datos dinámicos (verticales)
          datoLinea('Día', ev?.dinamico_dias),
          datoLinea('Hora', ev?.dinamico_horas),
          datoLinea('Punto de llegada y partida', ev?.dinamico_partida),
          datoLinea('Cantidad de jóvenes', ev?.dinamico_jovenes),
          new Paragraph({ text: '' }),

          // Responsabilidad
          new Paragraph({
            alignment: justify,
            spacing: { after: 160 },
            children: [
              new TextRun('Los cuales estarán acompañados y bajo responsabilidad de '),
              new TextRun({ text: ev?.dinamico_adultos || '—', bold: true }),
              new TextRun(' adultos voluntarios.'),
            ],
          }),

          // Despedida
          new Paragraph({
            alignment: justify,
            spacing: { after: 200 },
            children: [
              new TextRun(
                p?.parrafo_despedida ||
                  'Por tal motivo, se le hace partícipe para los fines correspondientes. Sin otro en particular me despido reiterando mi estima personal.'
              ),
            ],
          }),

          // Frase cierre
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 480 },
            children: [
              new TextRun({
                text: `"${p?.frase_cierre || 'Siempre listo para avanzar y servir'}"`,
                italics: true,
                bold: true,
              }),
            ],
          }),

          // Firma
          ...(firma
            ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [scaledImageRun(firma, 70)] })]
            : []),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('_______________________________')] }),
          ...(p?.firma_nombre
            ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.firma_nombre, bold: true })] })]
            : []),
          ...(p?.firma_cargo
            ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(p.firma_cargo)] })]
            : []),
          ...(p?.firma_registro
            ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.firma_registro, size: 18 })] })]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${nombreArchivo(data)}.docx`);
}
