/**
 * ======================================================================
 * 📥 EJECUTOR DE IMPORTACIÓN
 * ======================================================================
 * Resuelve referencias y persiste los registros preparados, informando
 * el progreso. No conoce la UI.
 * ======================================================================
 */
import type {
  ImportConfig,
  ImportSummary,
  PreparedRecord,
} from './types';

export interface RunOptions {
  /** Si true, los duplicados se actualizan; si false, se omiten. */
  updateDuplicates: boolean;
  /** Callback de progreso (procesados, total). */
  onProgress?: (done: number, total: number) => void;
}

/** Persiste los registros aplicando la política de duplicados. */
export async function runImport(
  config: ImportConfig,
  records: PreparedRecord[],
  options: RunOptions,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Resolver FKs legibles → ids reales (si la config lo necesita)
  let data = records.map((r) => r.data);
  if (config.resolveRefs) {
    data = await config.resolveRefs(data);
  }

  const total = records.length;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const payload = data[i];

    // Duplicado + no actualizar → omitir
    if (record.existingId && !options.updateDuplicates) {
      summary.skipped += 1;
      options.onProgress?.(i + 1, total);
      continue;
    }

    try {
      const result = await config.persist(payload, {
        existingId: options.updateDuplicates ? record.existingId : undefined,
      });

      if (result.error) {
        summary.failed += 1;
        summary.errors.push(result.error);
      } else if (result.action === 'created') {
        summary.created += 1;
      } else if (result.action === 'updated') {
        summary.updated += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (err) {
      summary.failed += 1;
      summary.errors.push(err instanceof Error ? err.message : 'Error desconocido');
    }

    options.onProgress?.(i + 1, total);
  }

  return summary;
}
