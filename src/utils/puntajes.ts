/**
 * Reglas de puntaje de Programa Semanal.
 *
 * Espejo en el cliente de lo que calcula la BD (database/171_puntaje_asistencia_y_puestos.sql):
 * - fn_puntaje_por_puesto         → puntajePorPuesto
 * - vista_puntaje_asistencia_programa → calcularPuntajeAsistencia
 * Se usa solo para previsualizar; el valor oficial siempre es el de la BD.
 */

export interface ConfigPuntajesRama {
  rama: string;
  /** Máximo por asistencia perfecta y puntaje del 1er puesto */
  puntos: number;
  /** % del peso de un miembro que vale una tardanza (0–100) */
  porcentaje_tardanza: number;
}

export const CONFIG_PUNTAJES_DEFAULT = { puntos: 100, porcentaje_tardanza: 50 };

const FRACCIONES_PASO = [0.2, 0.1, 0.05];

/**
 * Puntos de un puesto: puntos − (puesto − 1) × paso, con paso = 20/10/5 % de
 * `puntos` (el mayor con el que el último puesto aún recibe puntos).
 * 4 patrullas → 100, 80, 60, 40 · 6 patrullas → 100, 90, 80, 70, 60, 50
 */
export function puntajePorPuesto(puntos: number, patrullas: number, puesto: number): number {
  if (patrullas < 1 || puesto < 1) return 0;
  const frac = FRACCIONES_PASO.find(f => puntos - (patrullas - 1) * puntos * f > 0);
  const paso = frac !== undefined ? puntos * frac : puntos / patrullas;
  return Math.round(Math.max(puntos - (puesto - 1) * paso, 0));
}

/**
 * Puntos de asistencia de una patrulla:
 * puntos × (presentes + tardanzas × %tardanza) / miembros en lista. 2 decimales.
 */
export function calcularPuntajeAsistencia(
  config: Pick<ConfigPuntajesRama, 'puntos' | 'porcentaje_tardanza'>,
  presentes: number,
  tardanzas: number,
  totalMiembros: number
): number {
  if (totalMiembros <= 0) return 0;
  const valor = (config.puntos * (presentes + (tardanzas * config.porcentaje_tardanza) / 100)) / totalMiembros;
  return Math.round(valor * 100) / 100;
}

/** 87.5 → "87.5", 100 → "100" */
export function formatPuntos(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace(/0$/, '');
}
