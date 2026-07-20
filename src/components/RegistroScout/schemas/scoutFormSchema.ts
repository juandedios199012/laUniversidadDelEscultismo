/**
 * Scout Registration Validation Schemas
 * Using Zod for runtime validation with TypeScript inference
 * 
 * @fileoverview
 * This file defines all validation schemas for the scout registration module.
 * Schemas are organized by section for maintainability and reusability.
 * 
 * Follows these principles:
 * - DRY: Reusable schema fragments
 * - SOLID: Single responsibility per schema
 * - Clean Code: Clear naming and documentation
 */

import { z } from "zod";

// ============================================
// Base Validation Rules (Reusable)
// ============================================

/**
 * Peruvian DNI validation (8 digits)
 */
const dniSchema = z
  .string()
  .regex(/^\d{8}$/, "DNI debe tener 8 dígitos")
  .optional()
  .or(z.literal(""));

/**
 * Carné de Extranjería validation
 */
const ceSchema = z
  .string()
  .min(9, "CE debe tener al menos 9 caracteres")
  .optional()
  .or(z.literal(""));

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email("Correo electrónico inválido")
  .optional()
  .or(z.literal(""));

/**
 * Peruvian phone validation (9 digits starting with 9)
 */
const celularSchema = z
  .string()
  .regex(/^9\d{8}$/, "Celular debe tener 9 dígitos y empezar con 9")
  .optional()
  .or(z.literal(""));

/**
 * Date validation (YYYY-MM-DD format)
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido")
  .optional()
  .or(z.literal(""));

/**
 * Required date validation
 */
const requiredDateSchema = z
  .string()
  .min(1, "Este campo es requerido")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido");

// ============================================
// Enum Definitions
// ============================================

export const SexoEnum = z.enum(["MASCULINO", "FEMENINO", ""], {
  errorMap: () => ({ message: "Seleccione un sexo" }),
});

export const TipoDocumentoEnum = z.enum(["DNI", "CARNET_EXTRANJERIA", "PASAPORTE"], {
  errorMap: () => ({ message: "Seleccione tipo de documento" }),
});

export const RamaEnum = z.enum(
  ["Manada", "Tropa", "Comunidad", "Clan", "Dirigentes"],
  {
    errorMap: () => ({ message: "Seleccione una rama" }),
  }
);

export const GrupoSanguineoEnum = z.enum(["A", "B", "AB", "O", ""], {
  errorMap: () => ({ message: "Seleccione grupo sanguíneo" }),
});

export const FactorSanguineoEnum = z.enum(["+", "-", ""], {
  errorMap: () => ({ message: "Seleccione factor sanguíneo" }),
});

export const CargoPatrullaEnum = z.enum(
  ["MIEMBRO", "GUIA", "SUBGUIA", "INTENDENTE", "ENFERMERO", "TESORERO", "SECRETARIO", "GUARDALMACEN"],
  {
    errorMap: () => ({ message: "Seleccione cargo" }),
  }
);

export const ParentescoEnum = z.enum(
  ["PADRE", "MADRE", "TUTOR", "HERMANO", "ABUELO", "TIO", "OTRO"],
  {
    errorMap: () => ({ message: "Seleccione parentesco" }),
  }
);

// ============================================
// Section Schemas
// ============================================

/**
 * Personal Data Section
 */
export const datosPersonalesSchema = z.object({
  nombres: z
    .string()
    .min(2, "Nombres debe tener al menos 2 caracteres")
    .max(100, "Nombres no puede exceder 100 caracteres"),
  apellidos: z
    .string()
    .min(2, "Apellidos debe tener al menos 2 caracteres")
    .max(100, "Apellidos no puede exceder 100 caracteres"),
  fecha_nacimiento: requiredDateSchema,
  sexo: SexoEnum,
  tipo_documento: TipoDocumentoEnum,
  numero_documento: z.string().optional(),
});

/**
 * Contact Data Section
 */
export const datosContactoSchema = z.object({
  celular: celularSchema,
  celular_secundario: celularSchema,
  telefono: z.string().optional(),
  correo: emailSchema,
  correo_secundario: emailSchema,
  correo_institucional: emailSchema,
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  direccion: z.string().max(200, "Dirección muy larga").optional(),
  direccion_completa: z.string().max(500, "Dirección muy larga").optional(),
  codigo_postal: z.string().max(10, "Código postal muy largo").optional(),
  ubicacion_latitud: z.number().min(-90).max(90).optional().nullable(),
  ubicacion_longitud: z.number().min(-180).max(180).optional().nullable(),
});

/**
 * Education Data Section
 */
export const datosEducacionSchema = z.object({
  centro_estudio: z.string().max(150, "Nombre muy largo").optional(),
  anio_estudios: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  ocupacion: z.string().max(100, "Ocupación muy larga").optional(),
  centro_laboral: z.string().max(150, "Nombre muy largo").optional(),
});

/**
 * Religious Data Section
 */
export const datosReligiososSchema = z.object({
  religion: z.string().max(50, "Religión muy larga").optional(),
});

/**
 * Health Data Section - Condición Médica (lista)
 * fecha_atencion se maneja como texto libre, no como fecha estricta
 */
export const saludCondicionSchema = z.object({
  condicion: z.string().max(150, "Máximo 150 caracteres").optional(),
  fecha_atencion: z.string().max(50, "Máximo 50 caracteres").optional(),
});

/**
 * Health Data Section - Alergia (lista)
 */
export const saludAlergiaSchema = z.object({
  alergia: z.string().max(150, "Máximo 150 caracteres").optional(),
  mencionar: z.string().max(500, "Máximo 500 caracteres").optional(),
});

/**
 * Health Data Section - Medicamento (lista)
 * fecha_inicio_duracion se maneja como texto libre, no como fecha estricta
 */
export const saludMedicamentoSchema = z.object({
  medicamento: z.string().max(150, "Máximo 150 caracteres").optional(),
  dosis: z.string().max(50, "Máximo 50 caracteres").optional(),
  frecuencia: z.string().max(100, "Máximo 100 caracteres").optional(),
  activo: z.boolean().optional().default(true),
  fecha_inicio_duracion: z.string().max(100, "Máximo 100 caracteres").optional(),
});

/**
 * Health Data Section - Vacuna (lista)
 * fecha_ultima_dosis se maneja como texto libre, no como fecha estricta
 */
export const saludVacunaSchema = z.object({
  vacuna: z.string().max(150, "Máximo 150 caracteres").optional(),
  fecha_ultima_dosis: z.string().max(50, "Máximo 50 caracteres").optional(),
});

/**
 * Health Data Section
 */
export const datosSaludSchema = z.object({
  estatura_cm: z
    .union([z.string(), z.number()])
    .transform((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)))
    .pipe(z.number().min(0.5, "Estatura mínima 0.50m").max(2.5, "Estatura máxima 2.50m").optional())
    .optional()
    .nullable(),
  peso_kg: z
    .union([z.string(), z.number()])
    .transform((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)))
    .pipe(z.number().min(10, "Peso mínimo 10kg").max(300, "Peso máximo 300kg").optional())
    .optional()
    .nullable(),
  grupo_sanguineo: GrupoSanguineoEnum.optional(),
  factor_sanguineo: FactorSanguineoEnum.optional(),
  seguro_medico: z.string().max(100, "Nombre muy largo").optional(),
  tipo_discapacidad: z.string().optional(),
  carnet_conadis: z.string().max(20, "Carnet muy largo").optional(),
  descripcion_discapacidad: z.string().max(500, "Descripción muy larga").optional(),
  condiciones: z.array(saludCondicionSchema).default([]),
  alergias: z.array(saludAlergiaSchema).default([]),
  medicamentos: z.array(saludMedicamentoSchema).default([]),
  vacunas: z.array(saludVacunaSchema).default([]),
});

/**
 * Scout Data Section
 */
export const datosScoutSchema = z.object({
  rama_actual: z.string().optional(),
  rama: z.string().optional(),
  codigo_asociado: z.string().max(50, "Código muy largo").optional(),
  fecha_ingreso: dateSchema,
  patrulla_id: z.string().uuid().nullable().optional(),
  cargo_patrulla: CargoPatrullaEnum.default("MIEMBRO"),
});

/**
 * Familiar Schema
 */
export const familiarSchema = z.object({
  id: z.string().uuid().optional(),
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().optional(),
  tipo_documento: TipoDocumentoEnum.optional(),
  numero_documento: z.string().max(20).optional(),
  parentesco: ParentescoEnum,
  celular: celularSchema,
  correo: emailSchema,
  es_contacto_emergencia: z.boolean().default(false),
  es_apoderado: z.boolean().default(false),
});

/**
 * Schema individual para un familiar
 */
export const familiarItemSchema = z.object({
  id: z.string().optional(), // Para edición
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  sexo: SexoEnum.optional(),
  tipo_documento: TipoDocumentoEnum.default("DNI"),
  numero_documento: z.string().max(20).optional(),
  parentesco: ParentescoEnum,
  celular: celularSchema,
  correo: emailSchema,
  // Datos laborales
  profesion: z.string().max(100).optional(),
  centro_laboral: z.string().max(200).optional(),
  cargo: z.string().max(100).optional(),
  // Dirección
  usar_direccion_scout: z.boolean().default(true),
  direccion: z.string().max(300).optional(),
  departamento: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  distrito: z.string().max(100).optional(),
  // Flags
  es_contacto_emergencia: z.boolean().default(true),
  es_apoderado: z.boolean().default(false),
});

export type FamiliarItem = z.infer<typeof familiarItemSchema>;

/**
 * Tipos para las listas del Step Salud
 */
export type SaludCondicionData = z.infer<typeof saludCondicionSchema>;
export type SaludAlergiaData = z.infer<typeof saludAlergiaSchema>;
export type SaludMedicamentoData = z.infer<typeof saludMedicamentoSchema>;
export type SaludVacunaData = z.infer<typeof saludVacunaSchema>;

/**
 * Schema para array de familiares
 */
export const familiaresArraySchema = z.object({
  familiares: z.array(familiarItemSchema).default([]),
});

// ============================================
// Complete Scout Form Schema
// ============================================

/**
 * Complete Scout Registration Schema
 * Combines all section schemas into a single validation schema
 */
export const scoutFormSchema = z.object({
  // Personal Data
  ...datosPersonalesSchema.shape,
  // Contact Data
  ...datosContactoSchema.shape,
  // Education Data
  ...datosEducacionSchema.shape,
  // Religious Data
  ...datosReligiososSchema.shape,
  // Health Data
  ...datosSaludSchema.shape,
  // Scout Data
  ...datosScoutSchema.shape,
  // Familiares (array de N familiares)
  ...familiaresArraySchema.shape,
});

/**
 * Type inference from schema
 */
export type ScoutFormData = z.infer<typeof scoutFormSchema>;
export type FamiliarFormData = z.infer<typeof familiarSchema>;

/**
 * Default values for the form
 */
export const defaultScoutFormValues: ScoutFormData = {
  nombres: "",
  apellidos: "",
  fecha_nacimiento: "",
  sexo: "",
  tipo_documento: "DNI",
  numero_documento: "",
  celular: "",
  celular_secundario: "",
  telefono: "",
  correo: "",
  correo_secundario: "",
  correo_institucional: "",
  departamento: "",
  provincia: "",
  distrito: "",
  direccion: "",
  direccion_completa: "",
  codigo_postal: "",
  ubicacion_latitud: null,
  ubicacion_longitud: null,
  centro_estudio: "",
  anio_estudios: "",
  ocupacion: "",
  centro_laboral: "",
  religion: "",
  estatura_cm: undefined,
  peso_kg: undefined,
  grupo_sanguineo: "",
  factor_sanguineo: "",
  seguro_medico: "",
  tipo_discapacidad: "",
  carnet_conadis: "",
  descripcion_discapacidad: "",
  condiciones: [],
  alergias: [],
  medicamentos: [],
  vacunas: [],
  rama_actual: "",
  rama: "",
  codigo_asociado: "",
  fecha_ingreso: new Date().toISOString().split("T")[0],
  patrulla_id: null,
  cargo_patrulla: "MIEMBRO",
  // Familiares (array vacío por defecto)
  familiares: [],
};

/**
 * Valores por defecto para un nuevo ítem de cada lista del Step Salud
 */
export const defaultSaludCondicion: SaludCondicionData = {
  condicion: "",
  fecha_atencion: "",
};

export const defaultSaludAlergia: SaludAlergiaData = {
  alergia: "",
  mencionar: "",
};

export const defaultSaludMedicamento: SaludMedicamentoData = {
  medicamento: "",
  dosis: "",
  frecuencia: "",
  activo: true,
  fecha_inicio_duracion: "",
};

export const defaultSaludVacuna: SaludVacunaData = {
  vacuna: "",
  fecha_ultima_dosis: "",
};

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate a single field
 */
export function validateField<T extends keyof ScoutFormData>(
  field: T,
  value: ScoutFormData[T]
): string | null {
  const fieldSchema = scoutFormSchema.shape[field];
  const result = fieldSchema.safeParse(value);
  return result.success ? null : result.error.errors[0]?.message || "Error de validación";
}

/**
 * Validate entire form
 */
export function validateScoutForm(data: unknown): {
  success: boolean;
  data?: ScoutFormData;
  errors?: Record<string, string>;
} {
  const result = scoutFormSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join(".");
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}
