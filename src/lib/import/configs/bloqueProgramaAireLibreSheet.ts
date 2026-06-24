/**
 * ======================================================================
 * 📥 DEFINICIÓN DE FILA — Bloques de Programa (Aire Libre)
 * ======================================================================
 * Columnas y esquema de un "bloque" dentro de un Programa de una
 * actividad de Aire Libre (NuevoProgramaDialog.tsx). Mismos campos base
 * que "Actividad" de Programación (ver ACTIVIDAD_PROGRAMA_BASE_COLUMNS
 * en programaImportConfig.ts), salvo que "responsable" y
 * "objetivos_texto"/"area_nombre" llegan como texto libre del Excel y se
 * resuelven a IDs después del pegado (ver NuevoProgramaDialog.tsx).
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
    aliases: ['actividad'],
  },
  {
    key: 'descripcion',
    header: 'descripcion',
    type: 'string',
    example: 'Dinámica para romper el hielo entre patrullas.',
    aliases: ['desarrollo', 'descripción'],
  },
  {
    key: 'hora_inicio',
    header: 'hora_inicio',
    type: 'string',
    example: '08:00',
    help: 'Formato HH:MM. Solo se usa para el primer bloque pegado; los siguientes se encadenan según la duración.',
    aliases: ['hora'],
  },
  {
    key: 'duracion_minutos',
    header: 'duracion_minutos',
    type: 'number',
    example: '30',
    aliases: ['duracion', 'duración'],
  },
  {
    key: 'responsable_nombre',
    header: 'responsable_nombre',
    type: 'string',
    example: 'Baloo',
    help: 'Nombre del dirigente; se resuelve contra la lista de dirigentes disponibles de la actividad.',
    aliases: ['responsable'],
  },
  {
    key: 'materiales_necesarios',
    header: 'materiales_necesarios',
    type: 'string',
    example: 'Silbato, conos',
    aliases: ['materiales'],
  },
  {
    key: 'observaciones',
    header: 'observaciones',
    type: 'string',
    example: '',
  },
  {
    key: 'area_nombre',
    header: 'area_nombre',
    type: 'string',
    example: 'Corporalidad',
    help: 'Solo informativo, no se guarda.',
    aliases: ['areas de desarrollo', 'área de desarrollo', 'areas de crecimiento', 'área de crecimiento'],
  },
  {
    key: 'objetivos_texto',
    header: 'objetivos_texto',
    type: 'string',
    example: 'Convive constantemente en la naturaleza...',
    help: 'Uno o más títulos de Objetivos Educativos (uno por línea dentro de la celda); se resuelven contra el catálogo.',
    aliases: ['objetivos educativos'],
  },
];

export const bloqueProgramaRowSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional().default(''),
  hora_inicio: z.string().optional().default(''),
  duracion_minutos: z.number().min(1).optional().default(30),
  responsable_nombre: z.string().optional().default(''),
  materiales_necesarios: z.string().optional().default(''),
  observaciones: z.string().optional().default(''),
  area_nombre: z.string().optional().default(''),
  objetivos_texto: z.string().optional().default(''),
});

export const bloqueProgramaSheet: SheetDef = {
  sheetName: 'Bloques',
  columns: BLOQUE_PROGRAMA_COLUMNS,
  rowSchema: bloqueProgramaRowSchema,
};
