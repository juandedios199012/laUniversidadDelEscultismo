// ============================================================================
// SCHEMA ZOD - REGISTRO SCOUT MOBILE
// ============================================================================
// Validación de datos para registro rápido de scouts en mobile
// ============================================================================

import { z } from 'zod';

// ============================================================================
// CARGOS DE PATRULLA
// ============================================================================

export const CARGOS_PATRULLA = [
  'MIEMBRO', 'GUIA', 'SUBGUIA', 'INTENDENTE', 'ENFERMERO', 'TESORERO', 'SECRETARIO', 'GUARDALMACEN'
] as const;

// ============================================================================
// SCHEMA DE FAMILIAR
// ============================================================================

export const familiarSchema = z.object({
  id: z.string().optional(),
  nombres: z.string().max(100),
  apellidos: z.string().max(100),
  parentesco: z.enum(['PADRE', 'MADRE', 'ABUELO', 'ABUELA', 'TIO', 'TIA', 'HERMANO', 'HERMANA', 'TUTOR', 'OTRO']),
  celular: z.string().optional(),
  correo: z.string().email().optional().or(z.literal('')),
  es_contacto_emergencia: z.boolean().default(true),
  es_apoderado: z.boolean().default(false),
});

export type Familiar = z.infer<typeof familiarSchema>;

// ============================================================================
// SCHEMAS DE VALIDACIÓN POR PASO
// ============================================================================

/**
 * Paso 1: Datos Personales
 */
export const paso1Schema = z.object({
  nombres: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  apellidos: z
    .string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres'),
  sexo: z.enum(['M', 'F'], {
    required_error: 'Selecciona el sexo',
  }),
  fecha_nacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      return date < today;
    }, 'La fecha debe ser anterior a hoy'),
  tipo_documento: z.string().default('DNI'),
  numero_documento: z.string().max(20).optional(),
});

/**
 * Paso 2: Datos Scout (ahora incluye patrulla y cargo)
 */
export const paso2Schema = z.object({
  rama_actual: z.enum(['Manada', 'Tropa', 'Comunidad', 'Clan'], {
    required_error: 'Selecciona una rama',
  }),
  fecha_ingreso: z.string().optional(),
  patrulla_id: z.string().nullable().optional(),
  cargo_patrulla: z.enum(CARGOS_PATRULLA).default('MIEMBRO'),
});

/**
 * Paso 3: Contacto y Ubicación
 */
export const paso3Schema = z.object({
  celular: z
    .string()
    .regex(/^9\d{8}$/, 'El celular debe tener 9 dígitos y empezar con 9')
    .optional()
    .or(z.literal('')),
  departamento: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  distrito: z.string().max(100).optional(),
  direccion_completa: z.string().max(300).optional(),
  // Ubicación del mapa
  ubicacion_latitud: z.number().optional(),
  ubicacion_longitud: z.number().optional(),
  ubicacion_direccion: z.string().optional(),
});

/**
 * Paso 4: Familiares (ahora soporta múltiples)
 */
export const paso4Schema = z.object({
  familiares: z.array(familiarSchema).default([]),
  // Campos legacy para compatibilidad
  familiar_nombres: z.string().max(100).optional(),
  familiar_apellidos: z.string().max(100).optional(),
  familiar_telefono: z
    .string()
    .regex(/^9\d{8}$/, 'El teléfono debe tener 9 dígitos y empezar con 9')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema completo del formulario
 */
export const registroScoutMobileSchema = z.object({
  // Paso 1
  ...paso1Schema.shape,
  // Paso 2
  ...paso2Schema.shape,
  // Paso 3
  ...paso3Schema.shape,
  // Paso 4
  ...paso4Schema.shape,
});

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

export type Paso1Data = z.infer<typeof paso1Schema>;
export type Paso2Data = z.infer<typeof paso2Schema>;
export type Paso3Data = z.infer<typeof paso3Schema>;
export type Paso4Data = z.infer<typeof paso4Schema>;
export type RegistroScoutMobileFormData = z.infer<typeof registroScoutMobileSchema>;

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

export const defaultRegistroValues: RegistroScoutMobileFormData = {
  nombres: '',
  apellidos: '',
  sexo: 'M',
  fecha_nacimiento: '',
  tipo_documento: 'DNI',
  numero_documento: '',
  rama_actual: 'Tropa',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  patrulla_id: null,
  cargo_patrulla: 'MIEMBRO',
  celular: '',
  departamento: '',
  provincia: '',
  distrito: '',
  direccion_completa: '',
  ubicacion_latitud: undefined,
  ubicacion_longitud: undefined,
  ubicacion_direccion: '',
  familiares: [],
  familiar_nombres: '',
  familiar_apellidos: '',
  familiar_telefono: '',
};

// ============================================================================
// CONSTANTES
// ============================================================================

// NOTA: Los distritos ahora se obtienen de la BD via UbigeoService
// Las tablas: departamentos, provincias, distritos

export const RAMAS = [
  { id: 'Manada', label: 'Manada', icon: '🐺', color: 'yellow' },
  { id: 'Tropa', label: 'Tropa', icon: '⚜️', color: 'green' },
  { id: 'Comunidad', label: 'Comunidad', icon: '🔥', color: 'orange' },
  { id: 'Clan', label: 'Clan', icon: '🦅', color: 'blue' },
] as const;
