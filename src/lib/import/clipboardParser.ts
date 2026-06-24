/**
 * ======================================================================
 * 📋 PARSER DE PORTAPAPELES — Pegado de celdas copiadas desde Excel
 * ======================================================================
 * Convierte el texto plano que el navegador recibe al pegar un rango de
 * celdas de Excel (TSV: columnas separadas por tab, filas por salto de
 * línea, celdas con saltos de línea/tabs internos envueltas en comillas
 * igual que CSV) en RawRow[].
 *
 * A diferencia de excelParser (que mapea por encabezado leído de un
 * archivo .xlsx real), este mapea por POSICIÓN salvo que la primera
 * línea pegada sea reconocible como encabezado (coincide con
 * `column.header` o alguno de sus `column.aliases`, sin importar el
 * orden) — en ese caso mapea cada columna del Excel del usuario a la
 * columna correspondiente del sistema, en el orden en que él las trajo.
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

/** true si el texto pegado trae más de una celda (multi-columna o multi-fila). */
export function looksLikeMultiCellPaste(text: string): boolean {
  return text.includes('\t');
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Tokeniza texto delimitado por tabs en filas de celdas, respetando
 * celdas entre comillas que pueden contener saltos de línea, tabs o
 * comillas escapadas ("") — mismo formato que usa Excel al copiar un
 * rango con celdas de texto multilínea ("ajustar texto").
 */
function tokenizarTSV(text: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let dentroDeComillas = false;
  let i = 0;

  const normalizado = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < normalizado.length) {
    const char = normalizado[i];

    if (dentroDeComillas) {
      if (char === '"') {
        if (normalizado[i + 1] === '"') {
          celda += '"';
          i += 2;
          continue;
        }
        dentroDeComillas = false;
        i += 1;
        continue;
      }
      celda += char;
      i += 1;
      continue;
    }

    if (char === '"' && celda === '') {
      dentroDeComillas = true;
      i += 1;
      continue;
    }

    if (char === '\t') {
      fila.push(celda);
      celda = '';
      i += 1;
      continue;
    }

    if (char === '\n') {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
      i += 1;
      continue;
    }

    celda += char;
    i += 1;
  }

  // Última celda/fila pendiente
  fila.push(celda);
  filas.push(fila);

  // Descartar filas completamente vacías (p. ej. una línea final en blanco)
  return filas.filter((f) => f.some((c) => c.trim() !== ''));
}

/**
 * Parsea texto de portapapeles a RawRow[]. Si la primera fila coincide
 * con los encabezados esperados (en cualquier orden, vía header o
 * aliases), mapea por encabezado; si no, mapea por posición usando el
 * orden de `columns`.
 */
export function parseClipboardRows(
  text: string,
  columns: ColumnDef[],
): ClipboardParseResult {
  const filas = tokenizarTSV(text);
  if (filas.length === 0) {
    return { rows: [], skippedHeaderRow: false };
  }

  const aliasesPorColumna = columns.map((col) =>
    new Set([col.header, ...(col.aliases ?? [])].map(normalizar)),
  );

  const primeraFila = filas[0].map(normalizar);
  const celdasNoVacias = primeraFila.filter((c) => c !== '');
  const celdasReconocidas = celdasNoVacias.filter((c) =>
    aliasesPorColumna.some((set) => set.has(c)),
  );
  const looksLikeHeaderRow =
    celdasNoVacias.length > 0 &&
    celdasReconocidas.length >= Math.ceil(celdasNoVacias.length / 2);

  // índice de celda del Excel del usuario -> columna del sistema (o undefined)
  const indiceAColumna: (ColumnDef | undefined)[] = looksLikeHeaderRow
    ? primeraFila.map((celda) =>
        columns.find((_, i) => aliasesPorColumna[i].has(celda)),
      )
    : columns;

  const filasDeDatos = looksLikeHeaderRow ? filas.slice(1) : filas;

  const rows: RawRow[] = filasDeDatos.map((celdas, i) => {
    const row: RawRow = {};
    // Inicializar todas las columnas conocidas para que coerceAndValidateSheet
    // siempre tenga la clave, incluso si el usuario no trajo esa columna.
    columns.forEach((col) => {
      row[col.header] = '';
    });
    celdas.forEach((valor, indiceCelda) => {
      const columna = indiceAColumna[indiceCelda];
      if (columna) row[columna.header] = valor.trim();
    });
    Object.defineProperty(row, '__excelRow', {
      value: i + 1 + (looksLikeHeaderRow ? 1 : 0),
      enumerable: false,
    });
    return row;
  });

  return { rows, skippedHeaderRow: looksLikeHeaderRow };
}
