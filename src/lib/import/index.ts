/**
 * 📥 Framework de importación — barrel.
 */
export * from './types';
export { parseWorkbook } from './excelParser';
export { prepareRecords } from './assemble';
export { downloadTemplate } from './excelTemplate';
export { runImport } from './runImport';
export type { RunOptions } from './runImport';
export { IMPORT_CONFIGS, getImportConfig } from './registry';
