/**
 * ======================================================================
 * 📥 PARSER DE EXCEL — Genérico (ExcelJS)
 * ======================================================================
 * Lee un archivo .xlsx y devuelve, por hoja, las filas como objetos
 * { encabezado: valorTexto }. No conoce ninguna entidad: solo lee.
 * ======================================================================
 */
import ExcelJS from 'exceljs';
import type { RawRow } from './types';

/** Convierte el valor de una celda ExcelJS a texto limpio. */
function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';

  // Fechas → ISO corto (YYYY-MM-DD)
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  // Celdas con fórmula → usar el resultado
  if (typeof value === 'object') {
    const anyVal = value as Record<string, unknown>;
    if ('result' in anyVal) return cellToString(anyVal.result as ExcelJS.CellValue);
    if ('text' in anyVal) return String(anyVal.text ?? '');
    if ('richText' in anyVal && Array.isArray(anyVal.richText)) {
      return (anyVal.richText as Array<{ text?: string }>)
        .map((r) => r.text ?? '')
        .join('');
    }
    if ('hyperlink' in anyVal) return String(anyVal.text ?? anyVal.hyperlink ?? '');
  }

  return String(value).trim();
}

/**
 * Lee una hoja por nombre y devuelve sus filas como objetos keyed por
 * el encabezado (primera fila). Filas totalmente vacías se omiten.
 */
function readSheet(workbook: ExcelJS.Workbook, sheetName: string): RawRow[] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: Record<number, string> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const h = cellToString(cell.value);
    if (h) headers[colNumber] = h;
  });

  const rows: RawRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // encabezado

    const obj: RawRow = {};
    let hasValue = false;
    Object.entries(headers).forEach(([colStr, header]) => {
      const colNumber = Number(colStr);
      const text = cellToString(row.getCell(colNumber).value);
      obj[header] = text;
      if (text !== '') hasValue = true;
    });

    // Guardamos el número de fila de Excel para reportar errores.
    if (hasValue) {
      Object.defineProperty(obj, '__excelRow', {
        value: rowNumber,
        enumerable: false,
      });
      rows.push(obj);
    }
  });

  return rows;
}

/** Número de fila de Excel asociado a una fila cruda (o -1). */
export function getExcelRowNumber(row: RawRow): number {
  const n = (row as unknown as { __excelRow?: number }).__excelRow;
  return typeof n === 'number' ? n : -1;
}

/**
 * Parsea un archivo y devuelve un mapa nombreHoja → filas crudas.
 * Solo lee las hojas solicitadas.
 */
export async function parseWorkbook(
  file: File,
  sheetNames: string[],
): Promise<Record<string, RawRow[]>> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const result: Record<string, RawRow[]> = {};
  for (const name of sheetNames) {
    result[name] = readSheet(workbook, name);
  }
  return result;
}
