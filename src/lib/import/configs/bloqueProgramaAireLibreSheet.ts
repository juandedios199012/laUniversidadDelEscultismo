/**
 * ======================================================================
 * 📥 DEFINICIÓN DE FILA — Bloques de Programa (Aire Libre)
 * ======================================================================
 * Columnas y esquema de un "bloque" dentro de un Programa de una
 * actividad de Aire Libre (NuevoProgramaDialog.tsx). Mismos campos base
 * que "Actividad" de Programación (ver ACTIVIDAD_PROGRAMA_BASE_COLUMNS
 * en programaImportConfig.ts), menos "responsable" (en Aire Libre es un
 * selector de dirigente por id, no texto libre) y "materiales"/array.
 *
 * Se usa para pegar filas copiadas desde Excel (ver src/hooks/usePasteRows)
 * directamente en el paso "Bloques de Actividades" del formulario.
 *
 * No es un ImportConfig completo (no persiste por sí solo): las filas
 * resultantes se cargan al estado local del formulario, que ya sabe
 * guardar el programa completo con sus bloques.
 * ======================================================================
 */
import { z } from 'zod';
import type { ColumnDef, SheetDef } from '../types';

export const BLOQUE_PROGRAMA_COLUMNS: ColumnDef[] = [
  {
    key: 'nombre',
    header: 'nombre',
    type: 'string',
    required: true,
    example: 'Juegos de presentación',
  },
  {
    key: 'descripcion',
    header: 'descripcion',
    type: 'string',
    example: 'Dinámica para romper el hielo entre patrullas.',
  },
  {
    key: 'hora_inicio',
    header: 'hora_inicio',
    type: 'string',
    example: '08:00',
    help: 'Formato HH:MM. Solo se usa para el primer bloque pegado; los siguientes se encadenan según la duración.',
  },
  {
    key: 'duracion_minutos',
    header: 'duracion_minutos',
    type: 'number',
    example: '30',
  },
  {
    key: 'materiales_necesarios',
    header: 'materiales_necesarios',
    type: 'string',
    example: 'Silbato, conos',
  },
  {
    key: 'observaciones',
    header: 'observaciones',
    type: 'string',
    example: '',
  },
];

export const bloqueProgramaRowSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional().default(''),
  hora_inicio: z.string().optional().default(''),
  duracion_minutos: z.number().min(1).optional().default(30),
  materiales_necesarios: z.string().optional().default(''),
  observaciones: z.string().optional().default(''),
});

export const bloqueProgramaSheet: SheetDef = {
  sheetName: 'Bloques',
  columns: BLOQUE_PROGRAMA_COLUMNS,
  rowSchema: bloqueProgramaRowSchema,
};
