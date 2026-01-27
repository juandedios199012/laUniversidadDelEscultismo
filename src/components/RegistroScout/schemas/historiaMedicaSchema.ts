/**
 * Medical History Validation Schemas
 * 
 * Defines validation for:
 * - Header: Basic medical info
 * - Conditions: Medical conditions
 * - Allergies: Known allergies
 * - Medications: Current medications
 * - Vaccines: Vaccination record
 */

import { z } from "zod";

// ============================================
// Enums
// ============================================

export const SeveridadEnum = z.enum(["LEVE", "MODERADA", "SEVERA"], {
  errorMap: () => ({ message: "Seleccione severidad" }),
});

export const TipoAlergiaEnum = z.enum(
  ["MEDICAMENTO", "ALIMENTO", "AMBIENTAL", "CONTACTO", "OTRA"],
  { errorMap: () => ({ message: "Seleccione tipo de alergia" }) }
);

export const TipoCondicionEnum = z.enum(
  ["CRONICA", "AGUDA", "CONTROLADA", "EN_TRATAMIENTO"],
  { errorMap: () => ({ message: "Seleccione tipo de condición" }) }
);

// ============================================
// Section Schemas
// ============================================

/**
 * Header Section - Basic Medical Info
 */
export const historiaCabeceraSchema = z.object({
  fecha_llenado: z.string().min(1, "Fecha requerida"),
  lugar_nacimiento: z.string().max(100, "Máximo 100 caracteres").optional(),
  estatura_cm: z
    .number()
    .min(50, "Estatura mínima 50cm")
    .max(250, "Estatura máxima 250cm")
    .optional()
    .nullable(),
  peso_kg: z
    .number()
    .min(10, "Peso mínimo 10kg")
    .max(300, "Peso máximo 300kg")
    .optional()
    .nullable(),
  seguro_medico: z.string().max(100, "Máximo 100 caracteres").optional(),
  numero_poliza: z.string().max(50, "Máximo 50 caracteres").optional(),
  medico_cabecera: z.string().max(100, "Máximo 100 caracteres").optional(),
  telefono_medico: z.string().max(20, "Máximo 20 caracteres").optional(),
  hospital_preferencia: z.string().max(150, "Máximo 150 caracteres").optional(),
  observaciones_generales: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

/**
 * Medical Condition Schema
 * - condicion_id: ID del catálogo de condiciones
 * - fecha_atencion: Fecha de atención médica
 */
export const condicionMedicaSchema = z.object({
  id: z.string().uuid().optional(),
  condicion_id: z.string().min(1, "Seleccione una condición"),
  nombre: z.string().optional(), // Se llena automáticamente desde el catálogo
  fecha_atencion: z.string().optional(),
  tratamiento: z.string().max(500, "Máximo 500 caracteres").optional(),
  notas: z.string().max(500, "Máximo 500 caracteres").optional(),
  activa: z.boolean().optional().default(true),
});

/**
 * Allergy Schema
 * - alergia_id: ID del catálogo de alergias
 * - aplica: SI/NO tiene esta alergia
 * - mencionar: Campo de texto para detalles
 */
export const alergiaSchema = z.object({
  id: z.string().uuid().optional(),
  alergia_id: z.string().min(1, "Seleccione una alergia"),
  nombre: z.string().optional(), // Se llena automáticamente desde el catálogo
  aplica: z.boolean().optional().default(false),
  mencionar: z.string().max(500, "Máximo 500 caracteres").optional(),
});

/**
 * Medication Schema
 */
export const medicamentoSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, "Nombre del medicamento requerido"),
  dosis: z.string().min(1, "Dosis requerida"),
  frecuencia: z.string().min(1, "Frecuencia requerida"),
  via_administracion: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  motivo: z.string().max(300, "Máximo 300 caracteres").optional(),
  prescrito_por: z.string().max(100, "Máximo 100 caracteres").optional(),
  activo: z.boolean().optional().default(true),
});

/**
 * Vaccine Schema
 * - vacuna_id: ID del catálogo de vacunas
 * - aplica: SI/NO tiene esta vacuna
 * - fecha: Fecha de aplicación
 */
export const vacunaSchema = z.object({
  id: z.string().uuid().optional(),
  vacuna_id: z.string().min(1, "Seleccione una vacuna"),
  nombre: z.string().optional(), // Se llena automáticamente desde el catálogo
  aplica: z.boolean().optional().default(false),
  fecha: z.string().optional(),
});

// ============================================
// Complete Medical History Schema
// ============================================

export const historiaMedicaSchema = z.object({
  // Header
  ...historiaCabeceraSchema.shape,
  // Arrays
  condiciones: z.array(condicionMedicaSchema).default([]),
  alergias: z.array(alergiaSchema).default([]),
  medicamentos: z.array(medicamentoSchema).default([]),
  vacunas: z.array(vacunaSchema).default([]),
});

// ============================================
// Type Exports
// ============================================

export type HistoriaCabeceraData = z.infer<typeof historiaCabeceraSchema>;
export type CondicionMedicaData = z.infer<typeof condicionMedicaSchema>;
export type AlergiaData = z.infer<typeof alergiaSchema>;
export type MedicamentoData = z.infer<typeof medicamentoSchema>;
export type VacunaData = z.infer<typeof vacunaSchema>;
export type HistoriaMedicaData = z.infer<typeof historiaMedicaSchema>;

// ============================================
// Default Values
// ============================================

export const defaultHistoriaMedicaValues: HistoriaMedicaData = {
  fecha_llenado: new Date().toISOString().split("T")[0],
  lugar_nacimiento: "",
  estatura_cm: undefined,
  peso_kg: undefined,
  seguro_medico: "",
  numero_poliza: "",
  medico_cabecera: "",
  telefono_medico: "",
  hospital_preferencia: "",
  observaciones_generales: "",
  condiciones: [],
  alergias: [],
  medicamentos: [],
  vacunas: [],
};

export const defaultCondicion: CondicionMedicaData = {
  condicion_id: "",
  nombre: "",
  fecha_atencion: "",
  tratamiento: "",
  notas: "",
  activa: true,
};

export const defaultAlergia: AlergiaData = {
  alergia_id: "",
  nombre: "",
  aplica: false,
  mencionar: "",
};

export const defaultMedicamento: MedicamentoData = {
  nombre: "",
  dosis: "",
  frecuencia: "",
  via_administracion: "",
  fecha_inicio: "",
  fecha_fin: "",
  motivo: "",
  prescrito_por: "",
  activo: true,
};

export const defaultVacuna: VacunaData = {
  vacuna_id: "",
  nombre: "",
  aplica: false,
  fecha: "",
};
