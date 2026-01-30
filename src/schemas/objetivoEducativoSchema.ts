// ============================================================================
// SCHEMA ZOD - OBJETIVO EDUCATIVO
// ============================================================================
// Validación de datos para objetivos educativos del sistema de progresión
// ============================================================================

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

/**
 * Schema para un indicador individual
 */
export const indicadorSchema = z
  .string()
  .min(3, 'El indicador debe tener al menos 3 caracteres')
  .max(200, 'El indicador no puede exceder 200 caracteres');

/**
 * Schema para el Paso 1: Información básica
 */
export const paso1Schema = z.object({
  etapa_id: z
    .string()
    .uuid('Selecciona una etapa válida')
    .min(1, 'La etapa es requerida'),
  area_id: z
    .string()
    .uuid('Selecciona un área válida')
    .min(1, 'El área de crecimiento es requerida'),
});

/**
 * Schema para el Paso 2: Contenido del objetivo
 */
export const paso2Schema = z.object({
  titulo: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(255, 'El título no puede exceder 255 caracteres'),
  descripcion: z
    .string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
});

/**
 * Schema para el Paso 3: Indicadores de logro
 */
export const paso3Schema = z.object({
  indicadores: z
    .array(indicadorSchema)
    .min(1, 'Debe agregar al menos 1 indicador de logro')
    .max(10, 'No puede agregar más de 10 indicadores'),
});

/**
 * Schema completo del objetivo educativo
 */
export const objetivoEducativoSchema = z.object({
  // Paso 1
  etapa_id: paso1Schema.shape.etapa_id,
  area_id: paso1Schema.shape.area_id,
  // Paso 2
  titulo: paso2Schema.shape.titulo,
  descripcion: paso2Schema.shape.descripcion,
  // Paso 3
  indicadores: paso3Schema.shape.indicadores,
  // Campos opcionales
  codigo: z.string().optional(),
  orden: z.number().int().positive().optional(),
});

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

export type Paso1Data = z.infer<typeof paso1Schema>;
export type Paso2Data = z.infer<typeof paso2Schema>;
export type Paso3Data = z.infer<typeof paso3Schema>;
export type ObjetivoEducativoFormData = z.infer<typeof objetivoEducativoSchema>;

// ============================================================================
// VALORES POR DEFECTO
// ============================================================================

export const defaultObjetivoValues: ObjetivoEducativoFormData = {
  etapa_id: '',
  area_id: '',
  titulo: '',
  descripcion: '',
  indicadores: [''],
};

// ============================================================================
// SCHEMAS DE PASOS PARA VALIDACIÓN
// ============================================================================

export const stepSchemas = [paso1Schema, paso2Schema, paso3Schema] as const;

/**
 * Valida un paso específico del formulario
 */
export function validateStep(step: number, data: Partial<ObjetivoEducativoFormData>) {
  const schema = stepSchemas[step];
  if (!schema) return { success: true, errors: [] };
  
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, errors: [] };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
