/**
 * ======================================================================
 * 📥 CONFIG DE IMPORTACIÓN — Programas semanales
 * ======================================================================
 * Declara cómo importar Programas semanales (padre) con sus Actividades
 * (detalle 1-a-N). Reutiliza ProgramaSemanalService.
 * ======================================================================
 */
import { z } from 'zod';
import type {
  AssembledRecord,
  ColumnDef,
  ExistingMap,
  ImportConfig,
  PersistResult,
  SheetDef,
} from '../types';
import ProgramaSemanalService from '../../../services/programaSemanalService';

const RAMAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'] as const;

/** Capitaliza la rama (primera mayúscula, resto minúscula). */
function normalizarRama(rama: string): string {
  const r = (rama ?? '').trim();
  return r ? r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() : r;
}

/** Clave natural de duplicado: fecha_inicio | rama. */
function duplicateKey(fechaInicio: string, rama: string): string {
  return `${(fechaInicio ?? '').trim()}|${normalizarRama(rama)}`;
}

// ----------------------------------------------------------------------
// Esquemas Zod
// ----------------------------------------------------------------------
const programaSchema = z.object({
  ref_programa: z.string().min(1, 'requerido'),
  fecha_inicio: z.string().min(1, 'requerida'),
  fecha_fin: z.string().min(1, 'requerida'),
  tema_central: z.string().min(1, 'requerido'),
  rama: z
    .string()
    .min(1, 'requerida')
    .refine(
      (r) => RAMAS.includes(normalizarRama(r) as (typeof RAMAS)[number]),
      { message: `debe ser una de: ${RAMAS.join(', ')}` },
    ),
  objetivos: z.array(z.string()).optional().default([]),
  responsable_programa: z.string().min(1, 'requerido'),
  observaciones_generales: z.string().optional(),
});

/**
 * Esquema y columnas base de una Actividad de Programa Semanal, sin la
 * referencia "ref_programa" (solo necesaria para enlazar hojas en la
 * importación masiva por archivo). Se reutilizan tal cual en el pegado
 * de filas desde Excel dentro del formulario "Agregar Actividad"
 * (ver src/lib/pasteRows + ProgramaSemanal.tsx) para no duplicar la
 * lista de campos en dos lugares.
 */
export const ACTIVIDAD_PROGRAMA_BASE_SCHEMA = z.object({
  nombre: z.string().min(1, 'requerido'),
  desarrollo: z.string().optional().default(''),
  hora_inicio: z.string().optional().default(''),
  duracion_minutos: z.number().optional(),
  responsable: z.string().optional().default(''),
  materiales: z.array(z.string()).optional().default([]),
  observaciones: z.string().optional().default(''),
});

export const ACTIVIDAD_PROGRAMA_BASE_COLUMNS: ColumnDef[] = [
  {
    key: 'nombre',
    header: 'nombre',
    type: 'string',
    required: true,
    example: 'Nudo de pescador',
  },
  {
    key: 'desarrollo',
    header: 'desarrollo',
    type: 'string',
    example: 'Explicación y práctica guiada.',
  },
  {
    key: 'hora_inicio',
    header: 'hora_inicio',
    type: 'string',
    example: '15:00',
    help: 'Formato HH:MM.',
  },
  {
    key: 'duracion_minutos',
    header: 'duracion_minutos',
    type: 'number',
    example: '30',
  },
  {
    key: 'responsable',
    header: 'responsable',
    type: 'string',
    example: 'Baloo',
  },
  {
    key: 'materiales',
    header: 'materiales',
    type: 'array',
    example: 'Cuerdas; Conos',
    help: 'Separar varios materiales con ";".',
  },
  {
    key: 'observaciones',
    header: 'observaciones',
    type: 'string',
    example: '',
  },
];

const actividadSchema = ACTIVIDAD_PROGRAMA_BASE_SCHEMA.extend({
  ref_programa: z.string().min(1, 'requerido'),
});

/** SheetDef de Actividad lista para pegado de filas (sin ref_programa). */
export const actividadProgramaSheet: SheetDef = {
  sheetName: 'Actividades',
  columns: ACTIVIDAD_PROGRAMA_BASE_COLUMNS,
  rowSchema: ACTIVIDAD_PROGRAMA_BASE_SCHEMA,
};

// ----------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------
export const programaImportConfig: ImportConfig = {
  id: 'programas',
  label: 'Programas semanales',
  description:
    'Importa programas semanales con sus actividades. Cada actividad se enlaza al programa por la columna "ref_programa".',
  templateFileName: 'programas_semanales',

  parentSheet: {
    sheetName: 'Programas',
    rowSchema: programaSchema,
    columns: [
      {
        key: 'ref_programa',
        header: 'ref_programa',
        type: 'string',
        required: true,
        example: 'P1',
        help: 'Identificador temporal para enlazar las actividades (no se guarda).',
      },
      {
        key: 'fecha_inicio',
        header: 'fecha_inicio',
        type: 'date',
        required: true,
        example: '2026-03-01',
        help: 'Formato AAAA-MM-DD.',
      },
      {
        key: 'fecha_fin',
        header: 'fecha_fin',
        type: 'date',
        required: true,
        example: '2026-03-01',
        help: 'Formato AAAA-MM-DD.',
      },
      {
        key: 'tema_central',
        header: 'tema_central',
        type: 'string',
        required: true,
        example: 'Pionerismo y nudos',
      },
      {
        key: 'rama',
        header: 'rama',
        type: 'string',
        required: true,
        example: 'Tropa',
        help: 'Manada, Tropa, Comunidad o Clan.',
      },
      {
        key: 'objetivos',
        header: 'objetivos',
        type: 'array',
        example: 'Aprender nudos; Trabajo en equipo',
        help: 'Separar varios objetivos con ";".',
      },
      {
        key: 'responsable_programa',
        header: 'responsable_programa',
        type: 'string',
        required: true,
        example: 'Akela',
      },
      {
        key: 'observaciones_generales',
        header: 'observaciones_generales',
        type: 'string',
        example: '',
      },
    ],
  },

  parentRefColumn: 'ref_programa',

  childSheets: [
    {
      sheetName: 'Actividades',
      rowSchema: actividadSchema,
      refColumn: 'ref_programa',
      targetKey: 'actividades',
      columns: [
        {
          key: 'ref_programa',
          header: 'ref_programa',
          type: 'string',
          required: true,
          example: 'P1',
          help: 'Debe coincidir con el "ref_programa" de la hoja Programas.',
        },
        ...ACTIVIDAD_PROGRAMA_BASE_COLUMNS,
      ],
    },
  ],

  getDuplicateKey: (record) =>
    duplicateKey(String(record.fecha_inicio ?? ''), String(record.rama ?? '')),

  fetchExisting: async (): Promise<ExistingMap> => {
    const map: ExistingMap = new Map();
    const programas = await ProgramaSemanalService.getProgramas();
    for (const p of programas ?? []) {
      const key = duplicateKey(String(p.fecha_inicio ?? ''), String(p.rama ?? ''));
      if (!map.has(key)) map.set(key, { id: String(p.id) });
    }
    return map;
  },

  persist: async (
    record: AssembledRecord,
    opts: { existingId?: string },
  ): Promise<PersistResult> => {
    const actividades = ((record.actividades as AssembledRecord[]) ?? []).map(
      (a) => ({
        nombre: String(a.nombre ?? ''),
        desarrollo: String(a.desarrollo ?? ''),
        hora_inicio: String(a.hora_inicio ?? ''),
        duracion_minutos: Number(a.duracion_minutos ?? 0) || 0,
        responsable: a.responsable ? String(a.responsable) : undefined,
        materiales: (a.materiales as string[]) ?? [],
        observaciones: a.observaciones ? String(a.observaciones) : undefined,
      }),
    );

    const payload = {
      fecha_inicio: String(record.fecha_inicio ?? ''),
      fecha_fin: String(record.fecha_fin ?? ''),
      tema_central: String(record.tema_central ?? ''),
      rama: normalizarRama(String(record.rama ?? '')),
      objetivos: (record.objetivos as string[]) ?? [],
      actividades,
      responsable_programa: String(record.responsable_programa ?? ''),
      observaciones_generales: record.observaciones_generales
        ? String(record.observaciones_generales)
        : undefined,
    };

    if (opts.existingId) {
      const res = await ProgramaSemanalService.updatePrograma(
        opts.existingId,
        payload,
      );
      if (!res.success) {
        return { action: 'updated', error: res.error ?? 'No se pudo actualizar' };
      }
      return { action: 'updated' };
    }

    const res = await ProgramaSemanalService.crearPrograma(payload);
    if (!res.success) {
      return { action: 'created', error: res.error ?? 'No se pudo crear' };
    }
    return { action: 'created' };
  },
};
