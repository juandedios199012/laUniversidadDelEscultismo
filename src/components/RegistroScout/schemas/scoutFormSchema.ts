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

export const TipoDocumentoEnum = z.enum(["DNI", "CE", "PASAPORTE"], {
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
  codigo_postal: z.string().max(10, "Código postal muy largo").optional(),
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
 * Health Data Section
 */
export const datosSaludSchema = z.object({
  grupo_sanguineo: GrupoSanguineoEnum.optional(),
  factor_sanguineo: FactorSanguineoEnum.optional(),
  seguro_medico: z.string().max(100, "Nombre muy largo").optional(),
  tipo_discapacidad: z.string().optional(),
  carnet_conadis: z.string().max(20, "Carnet muy largo").optional(),
  descripcion_discapacidad: z.string().max(500, "Descripción muy larga").optional(),
});

/**
 * Scout Data Section
 */
export const datosScoutSchema = z.object({
  rama_actual: z.string().optional(),
  rama: z.string().optional(),
  es_dirigente: z.boolean().default(false),
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
  parentesco: ParentescoEnum,
  celular: celularSchema,
  correo: emailSchema,
  es_contacto_emergencia: z.boolean().default(false),
  es_apoderado: z.boolean().default(false),
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
  codigo_postal: "",
  centro_estudio: "",
  anio_estudios: "",
  ocupacion: "",
  centro_laboral: "",
  religion: "",
  grupo_sanguineo: "",
  factor_sanguineo: "",
  seguro_medico: "",
  tipo_discapacidad: "",
  carnet_conadis: "",
  descripcion_discapacidad: "",
  rama_actual: "",
  rama: "",
  es_dirigente: false,
  codigo_asociado: "",
  fecha_ingreso: new Date().toISOString().split("T")[0],
  patrulla_id: null,
  cargo_patrulla: "MIEMBRO",
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
