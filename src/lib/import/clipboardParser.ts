/**
 * ======================================================================
 * 📋 PARSER DE PORTAPAPELES — Pegado de celdas copiadas desde Excel
 * ======================================================================
 * Convierte el texto plano que el navegador recibe al pegar un rango de
 * celdas de Excel (TSV: columnas separadas por tab, filas por salto de
 * línea) en RawRow[], mapeando columnas por POSICIÓN según el orden de
 * `columns` (a diferencia de excelParser, que mapea por encabezado leído
 * de un archivo .xlsx real).
 *
 * Produce el mismo `RawRow` que excelParser, por lo que el resto del
 * motor de importación (coerceAndValidateSheet) se reutiliza sin cambios.
 * ======================================================================
 */
import type { ColumnDef, RawRow } from './types';

/** Resultado de parsear un pegado de portapapeles. */
export interface ClipboardParseResult {
  rows: RawRow[];
  /** true si la primera línea pegada era el encabezado y se descartó. */
  skippedHeaderRow: boolean;
}

/**
 * true si el texto pegado viene de un rango de celdas de Excel (trae al
 * menos un tab, el separador de columnas). Se exige tab —y no solo
 * salto de línea— para no confundir esto con un pegado normal de texto
 * multilínea dentro de un textarea (p. ej. una descripción larga).
 */
export function looksLikeMultiCellPaste(text: string): boolean {
  return text.includes('\t');
}

/**
 * Parsea texto de portapapeles a RawRow[] usando el orden de `columns`
 * para asignar cada celda a su columna. Si la primera línea coincide con
 * los encabezados esperados, se omite como fila de datos.
 */
export function parseClipboardRows(
  text: string,
  columns: ColumnDef[],
): ClipboardParseResult {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { rows: [], skippedHeaderRow: false };
  }

  const expectedHeaders = columns.map((c) => c.header.toLowerCase());
  const firstCells = lines[0].split('\t').map((c) => c.trim().toLowerCase());
  const looksLikeHeaderRow =
    firstCells.some((c) => c !== '') &&
    firstCells.every((c, i) => c === '' || c === expectedHeaders[i]);

  const dataLines = looksLikeHeaderRow ? lines.slice(1) : lines;

  const rows: RawRow[] = dataLines.map((line, i) => {
    const cells = line.split('\t');
    const row: RawRow = {};
    columns.forEach((col, colIndex) => {
      row[col.header] = (cells[colIndex] ?? '').trim();
    });
    // Número de fila dentro del pegado (1-based), para mensajes de error.
    // Reutiliza la misma propiedad oculta que excelParser usa para
    // identificar la fila de origen (ver getExcelRowNumber).
    Object.defineProperty(row, '__excelRow', {
      value: i + 1 + (looksLikeHeaderRow ? 1 : 0),
      enumerable: false,
    });
    return row;
  });

  return { rows, skippedHeaderRow: looksLikeHeaderRow };
}
