/**
 * ======================================================================
 * 📥 FRAMEWORK DE IMPORTACIÓN GENÉRICO — Contratos
 * ======================================================================
 * Define la importación de CUALQUIER entidad del sistema mediante
 * configuración (config-driven). Cada entidad declara un ImportConfig;
 * el motor (parser, validación, plantilla, diálogo) es compartido.
 *
 * Principios: SOLID (Open-Closed: se extiende con nuevas configs sin
 * tocar el motor), DRY y Clean Code.
 *
 * Soporta:
 *  - Entidad simple (solo hoja padre).
 *  - Entidad con varios detalles 1-a-N (hoja padre + N hojas hijas).
 *  - Reutilización de personas / resolución de FKs (vía persist/resolveRefs).
 *
 * Límite conocido: 1 nivel de detalle (padre → hijos). Sin anidamiento
 * profundo (hijo de hijo) en esta versión.
 * ======================================================================
 */
import type { ZodTypeAny } from 'zod';

/** Tipo lógico de una columna del Excel. */
export type ColumnType = 'string' | 'number' | 'date' | 'boolean' | 'array';

/** Fila cruda de Excel: encabezado → valor en texto. */
export type RawRow = Record<string, string>;

/** Definición de una columna dentro de una hoja. */
export interface ColumnDef {
  /** Clave destino en el objeto resultante. */
  key: string;
  /** Encabezado tal cual aparece (y se genera) en el Excel. */
  header: string;
  /** Tipo lógico para coerción y validación. */
  type: ColumnType;
  /** Si es obligatoria (se valida y se marca con * en la plantilla). */
  required?: boolean;
  /** Valor de ejemplo para la fila demo de la plantilla. */
  example?: string;
  /** Texto de ayuda corto (se muestra como comentario/segunda fila). */
  help?: string;
  /** Delimitador para columnas tipo 'array' (por defecto ';'). */
  arrayDelimiter?: string;
  /**
   * Encabezados alternativos aceptados al pegar desde el portapapeles
   * (p. ej. "HORA" para hora_inicio). Solo los usa el pegado rápido
   * (clipboardParser.ts) para reconocer el encabezado sin importar el
   * orden de columnas del Excel del usuario; no afecta la plantilla de
   * importación por archivo.
   */
  aliases?: string[];
}

/** Definición de una hoja del libro (padre o hija). */
export interface SheetDef {
  /** Nombre exacto de la hoja en el Excel. */
  sheetName: string;
  /** Columnas de la hoja. */
  columns: ColumnDef[];
  /** Esquema Zod que valida una fila ya tipada de esta hoja. */
  rowSchema: ZodTypeAny;
}

/** Definición de una hoja de detalle (hija) enlazada a la hoja padre. */
export interface ChildSheetDef extends SheetDef {
  /**
   * Columna (key) de ESTA hoja hija cuyo valor enlaza con la columna
   * `parentRefColumn` del padre. p. ej. 'ref_programa'.
   */
  refColumn: string;
  /**
   * Propiedad donde se inyecta el arreglo de hijos en el registro
   * ensamblado del padre. p. ej. 'actividades'.
   */
  targetKey: string;
}

/** Registro ensamblado: campos del padre + arreglos de hijos por targetKey. */
export type AssembledRecord = Record<string, unknown>;

/** Acción aplicada al persistir un registro. */
export type PersistAction = 'created' | 'updated' | 'skipped';

/** Resultado de persistir un registro. */
export interface PersistResult {
  action: PersistAction;
  error?: string;
}

/** Mapa de existentes: clave natural → id en BD. */
export type ExistingMap = Map<string, { id: string }>;

/**
 * Configuración de importación de una entidad.
 * TParent: forma del registro padre ya tipado (post-coerción).
 */
export interface ImportConfig {
  /** Identificador único (p. ej. 'programas'). */
  id: string;
  /** Etiqueta visible (p. ej. 'Programas semanales'). */
  label: string;
  /** Descripción corta para el diálogo. */
  description?: string;
  /** Nombre de archivo sugerido para la plantilla (sin extensión). */
  templateFileName?: string;

  /** Hoja principal (1 fila = 1 entidad). */
  parentSheet: SheetDef;
  /**
   * Columna (key) del padre que sirve de referencia para enlazar hijos.
   * Requerida si hay childSheets. p. ej. 'ref_programa'.
   */
  parentRefColumn?: string;
  /** Hojas de detalle (0..N). */
  childSheets?: ChildSheetDef[];

  /**
   * Clave natural para detectar duplicados (p. ej. fecha_inicio + rama).
   * Si no se define, no se detectan duplicados.
   */
  getDuplicateKey?: (record: AssembledRecord) => string;
  /** Precarga los existentes para marcar duplicados. */
  fetchExisting?: () => Promise<ExistingMap>;
  /**
   * Resuelve referencias legibles a ids/valores reales (FKs) antes de
   * persistir. Recibe y devuelve los registros ensamblados.
   */
  resolveRefs?: (records: AssembledRecord[]) => Promise<AssembledRecord[]>;

  /**
   * Persiste un registro. `existingId` viene informado cuando es un
   * duplicado y el usuario decidió actualizar.
   */
  persist: (
    record: AssembledRecord,
    opts: { existingId?: string },
  ) => Promise<PersistResult>;
}

/** Error de validación de una fila concreta. */
export interface RowError {
  sheet: string;
  /** Número de fila en el Excel (1-based, contando encabezado). */
  excelRow: number;
  message: string;
}

/** Registro listo para previsualizar/persistir. */
export interface PreparedRecord {
  /** Índice estable dentro del lote. */
  index: number;
  /** Registro ensamblado (padre + hijos). */
  data: AssembledRecord;
  /** Clave natural (si la config la define). */
  duplicateKey?: string;
  /** Id del existente si es duplicado. */
  existingId?: string;
  /** Nº de hijos por targetKey, para la vista previa. */
  childCounts: Record<string, number>;
}

/** Resultado de parsear + validar el archivo. */
export interface ParseOutcome {
  records: PreparedRecord[];
  errors: RowError[];
}

/** Resumen final de la importación. */
export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}
