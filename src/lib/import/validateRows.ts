/**
 * ======================================================================
 * 📥 COERCIÓN + VALIDACIÓN DE FILAS
 * ======================================================================
 * Convierte filas crudas (texto) a objetos tipados según las ColumnDef
 * y valida cada fila con el esquema Zod de la hoja.
 * ======================================================================
 */
import type { ColumnDef, RawRow, RowError, SheetDef } from './types';
import { getExcelRowNumber } from './excelParser';

const DEFAULT_ARRAY_DELIMITER = ';';

/** Coerciona un valor de texto al tipo lógico de la columna. */
function coerceValue(raw: string, col: ColumnDef): unknown {
  const value = (raw ?? '').trim();

  switch (col.type) {
    case 'number': {
      if (value === '') return undefined;
      const n = Number(value.replace(',', '.'));
      return Number.isNaN(n) ? value : n; // si no es número, dejar string → Zod lo marca
    }
    case 'boolean': {
      if (value === '') return undefined;
      return ['1', 'true', 'si', 'sí', 'x', 'yes', 'verdadero'].includes(
        value.toLowerCase(),
      );
    }
    case 'array': {
      if (value === '') return [];
      const delim = col.arrayDelimiter ?? DEFAULT_ARRAY_DELIMITER;
      return value
        .split(delim)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    case 'date':
    case 'string':
    default:
      return value === '' ? undefined : value;
  }
}

/** Mapea una fila cruda a un objeto tipado según las columnas. */
function mapRow(raw: RawRow, columns: ColumnDef[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const col of columns) {
    obj[col.key] = coerceValue(raw[col.header] ?? '', col);
  }
  return obj;
}

export interface ValidRow {
  data: Record<string, unknown>;
  excelRow: number;
}

export interface SheetValidation {
  valid: ValidRow[];
  errors: RowError[];
}

/** Coerciona y valida todas las filas de una hoja. */
export function coerceAndValidateSheet(
  rows: RawRow[],
  sheet: SheetDef,
): SheetValidation {
  const valid: ValidRow[] = [];
  const errors: RowError[] = [];

  rows.forEach((raw) => {
    const excelRow = getExcelRowNumber(raw);
    const mapped = mapRow(raw, sheet.columns);
    const result = sheet.rowSchema.safeParse(mapped);

    if (result.success) {
      valid.push({ data: result.data as Record<string, unknown>, excelRow });
    } else {
      const issues = result.error.issues
        .map((i) => {
          const field = i.path.join('.') || 'fila';
          return `${field}: ${i.message}`;
        })
        .join('; ');
      errors.push({ sheet: sheet.sheetName, excelRow, message: issues });
    }
  });

  return { valid, errors };
}
