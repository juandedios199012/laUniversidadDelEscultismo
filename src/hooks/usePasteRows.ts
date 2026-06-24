/**
 * ======================================================================
 * 📋 usePasteRows — Pegar filas copiadas desde Excel en una grilla
 * ======================================================================
 * Hook reutilizable para cualquier formulario que mantenga un arreglo de
 * filas editables (bloques de programa, actividades, etc.) y quiera
 * soportar "copiar celdas en Excel → pegar en la web".
 *
 * Se apoya en el motor de importación genérico (src/lib/import): mismo
 * `SheetDef` (columnas + esquema Zod) que ya usan los importadores por
 * archivo, así los campos soportados nunca quedan desincronizados entre
 * el pegado rápido y la importación masiva.
 *
 * Solo intercepta el evento de pegado cuando el portapapeles trae más de
 * una celda (tab o salto de línea); un pegado de una sola celda sigue su
 * curso normal en el input enfocado.
 * ======================================================================
 */
import { useCallback } from 'react';
import type { SheetDef } from '@/lib/import/types';
import { looksLikeMultiCellPaste, parseClipboardRows } from '@/lib/import/clipboardParser';
import { coerceAndValidateSheet } from '@/lib/import/validateRows';

export interface UsePasteRowsResult {
  /** Resultado: filas válidas listas para agregar + mensajes de error. */
  rowsAdded: number;
  errorMessages: string[];
}

/**
 * @param sheet Columnas (en el orden en que aparecen en Excel) + esquema Zod de cada fila.
 * @param onRowsParsed Recibe las filas válidas ya tipadas y coercionadas para que el caller las agregue a su estado.
 */
export function usePasteRows<T = Record<string, unknown>>(
  sheet: SheetDef,
  onRowsParsed: (rows: T[]) => void,
) {
  const handlePaste = useCallback(
    (event: React.ClipboardEvent): UsePasteRowsResult | null => {
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!looksLikeMultiCellPaste(text)) return null; // pegado normal de una celda

      event.preventDefault();

      const { rows } = parseClipboardRows(text, sheet.columns);
      const { valid, errors } = coerceAndValidateSheet(rows, sheet);

      if (valid.length > 0) {
        onRowsParsed(valid.map((v) => v.data as T));
      }

      return {
        rowsAdded: valid.length,
        errorMessages: errors.map((e) =>
          e.excelRow >= 0 ? `Fila ${e.excelRow}: ${e.message}` : e.message,
        ),
      };
    },
    [sheet, onRowsParsed],
  );

  return { handlePaste };
}
