import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { CartaData } from './CartaOficialDocumento';
import { fechaLarga } from './CartaOficialDocumento';

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
// (Las imágenes de logo/firma se omiten para evitar problemas de CORS;
//  el texto y la firma escrita se conservan íntegros.)
// ================================================================
export async function descargarCartaWord(data: CartaData) {
  const { plantilla: p, institucion: inst, evento: ev } = data;
  const actividad = ev?.dinamico_actividad || '________________';
  const nombreInst = inst?.nombre_institucion || '________________';
  const direccion = inst?.direccion || '';

  const justify = AlignmentType.JUSTIFIED;

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
