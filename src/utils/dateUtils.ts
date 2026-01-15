/**
 * =================================================================
 * UTILIDADES DE FORMATO DE FECHAS
 * =================================================================
 * Funciones para formatear fechas evitando problemas de timezone UTC
 * 
 * PROBLEMA: 
 * - BD guarda: "2026-01-10" (string sin timezone)
 * - new Date("2026-01-10") lo interpreta como UTC
 * - En Perú (UTC-5), muestra: "9 de enero de 2026"
 * 
 * SOLUCIÓN:
 * - Trabajar con el string directamente sin convertir a Date
 * - O usar parseLocalDate para crear Date en hora local
 * =================================================================
 */

/**
 * Formatea fecha desde string YYYY-MM-DD a formato DD/MM/YYYY
 * Sin conversión a Date para evitar problemas de timezone
 * 
 * @param fechaString - Fecha en formato "YYYY-MM-DD" (ej: "2026-01-10")
 * @returns Fecha formateada en formato "DD/MM/YYYY"
 * 
 * @example
 * formatFechaLocal("2026-01-10") // "10/01/2026"
 */
export function formatFechaLocal(fechaString: string): string {
  if (!fechaString) return '';
  return fechaString.split('-').reverse().join('/');
}

/**
 * Parsea string de fecha a objeto Date en hora local
 * Evita interpretación UTC
 * 
 * @param fechaString - Fecha en formato "YYYY-MM-DD"
 * @returns Date en hora local
 * 
 * @example
 * parseLocalDate("2026-01-10") // Date en hora local de Perú
 */
export function parseLocalDate(fechaString: string): Date {
  const [year, month, day] = fechaString.split('-').map(Number);
  return new Date(year, month - 1, day); // month es 0-indexed
}

/**
 * Obtiene fecha actual en formato YYYY-MM-DD (para inputs type="date")
 * 
 * @returns Fecha actual en formato "YYYY-MM-DD"
 */
export function getFechaActual(): string {
  return new Date().toISOString().split('T')[0];
}
