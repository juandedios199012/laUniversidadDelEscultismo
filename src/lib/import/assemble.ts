/**
 * ======================================================================
 * 📥 ENSAMBLADO PADRE → HIJOS + DETECCIÓN DE DUPLICADOS
 * ======================================================================
 * Orquesta: coerciona/valida cada hoja, agrupa las filas hijas bajo su
 * padre por la columna de referencia, y marca duplicados contra los
 * existentes en BD.
 * ======================================================================
 */
import type {
  AssembledRecord,
  ImportConfig,
  ParseOutcome,
  PreparedRecord,
  RawRow,
  RowError,
} from './types';
import { coerceAndValidateSheet } from './validateRows';

/**
 * Construye los registros listos para previsualizar/persistir a partir
 * de las filas crudas por hoja.
 */
export async function prepareRecords(
  config: ImportConfig,
  sheets: Record<string, RawRow[]>,
): Promise<ParseOutcome> {
  const errors: RowError[] = [];

  // 1) Padre
  const parentRows = sheets[config.parentSheet.sheetName] ?? [];
  const parentValidation = coerceAndValidateSheet(parentRows, config.parentSheet);
  errors.push(...parentValidation.errors);

  // 2) Hijos → agrupar por valor de refColumn
  //    childrenByTarget: targetKey → (refValue → filas[])
  const childrenByTarget: Record<string, Map<string, AssembledRecord[]>> = {};

  for (const child of config.childSheets ?? []) {
    const childRows = sheets[child.sheetName] ?? [];
    const childValidation = coerceAndValidateSheet(childRows, child);
    errors.push(...childValidation.errors);

    const grouped = new Map<string, AssembledRecord[]>();
    childValidation.valid.forEach(({ data, excelRow }) => {
      const ref = String((data[child.refColumn] ?? '')).trim();
      if (!ref) {
        errors.push({
          sheet: child.sheetName,
          excelRow,
          message: `La columna de enlace "${child.refColumn}" está vacía`,
        });
        return;
      }
      const list = grouped.get(ref) ?? [];
      list.push(data);
      grouped.set(ref, list);
    });
    childrenByTarget[child.targetKey] = grouped;
  }

  // 3) Existentes para duplicados
  const existing = config.fetchExisting ? await config.fetchExisting() : undefined;

  // 4) Ensamblar
  const records: PreparedRecord[] = [];
  parentValidation.valid.forEach(({ data }, index) => {
    const record: AssembledRecord = { ...data };
    const childCounts: Record<string, number> = {};

    for (const child of config.childSheets ?? []) {
      const refValue = config.parentRefColumn
        ? String((data[config.parentRefColumn] ?? '')).trim()
        : '';
      const grouped = childrenByTarget[child.targetKey];
      const items = refValue ? grouped.get(refValue) ?? [] : [];
      record[child.targetKey] = items;
      childCounts[child.targetKey] = items.length;
    }

    const duplicateKey = config.getDuplicateKey
      ? config.getDuplicateKey(record)
      : undefined;
    const existingId =
      duplicateKey && existing ? existing.get(duplicateKey)?.id : undefined;

    records.push({ index, data: record, duplicateKey, existingId, childCounts });
  });

  return { records, errors };
}
