/**
 * ======================================================================
 * 📥 REGISTRO DE CONFIGURACIONES DE IMPORTACIÓN
 * ======================================================================
 * Punto único donde se registran las entidades importables. Para añadir
 * una nueva entidad (aire libre, scouts, finanzas, inventario, etc.)
 * basta con crear su config en ./configs y registrarla aquí.
 * ======================================================================
 */
import type { ImportConfig } from './types';
import { programaImportConfig } from './configs/programaImportConfig';

/** Todas las configuraciones de importación disponibles. */
export const IMPORT_CONFIGS: ImportConfig[] = [
  programaImportConfig,
];

/** Obtiene una configuración por su id. */
export function getImportConfig(id: string): ImportConfig | undefined {
  return IMPORT_CONFIGS.find((c) => c.id === id);
}
