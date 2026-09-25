/**
 * ======================================================================
 * 🚦 SEMÁFORO DE EVALUACIÓN — sin ML
 * ======================================================================
 * Clasifica un promedio (enunciado, respuesta, patrulla) en 3 niveles
 * según qué tan cerca está del máximo de la escala. Es una regla fija
 * de porcentaje, no un modelo — transparente y auditable: cualquiera
 * puede recalcularla a mano con una calculadora.
 * ======================================================================
 */

export type NivelSemaforo = 'bien' | 'regular' | 'atencion';

export interface Semaforo {
  nivel: NivelSemaforo;
  emoji: string;
  label: string;
  color: string;        // hex, para gráficos (recharts)
  claseFondo: string;   // tailwind
  claseTexto: string;   // tailwind
  claseBorde: string;   // tailwind
}

const NIVELES: Record<NivelSemaforo, Omit<Semaforo, 'nivel'>> = {
  bien: { emoji: '🟢', label: 'Bien', color: '#059669', claseFondo: 'bg-emerald-50', claseTexto: 'text-emerald-700', claseBorde: 'border-emerald-200' },
  regular: { emoji: '🟡', label: 'A mejorar', color: '#d97706', claseFondo: 'bg-amber-50', claseTexto: 'text-amber-700', claseBorde: 'border-amber-200' },
  atencion: { emoji: '🔴', label: 'Atención', color: '#dc2626', claseFondo: 'bg-red-50', claseTexto: 'text-red-700', claseBorde: 'border-red-200' },
};

/**
 * `>= 70% del rango` = bien, `>= 40%` = a mejorar (amarillo), el resto = atención.
 * Umbrales fijos y visibles acá mismo — cambiarlos es editar estos 2 números.
 */
export function calcularSemaforo(promedio: number, escalaMin: number, escalaMax: number): Semaforo {
  const rango = escalaMax - escalaMin || 1;
  const pct = (promedio - escalaMin) / rango;
  const nivel: NivelSemaforo = pct >= 0.7 ? 'bien' : pct >= 0.4 ? 'regular' : 'atencion';
  return { nivel, ...NIVELES[nivel] };
}

/** Punto de corte real (en unidades de la escala, no %) del nivel "atención" — para líneas de referencia en gráficos. */
export function umbralAtencion(escalaMin: number, escalaMax: number): number {
  return escalaMin + (escalaMax - escalaMin) * 0.4;
}

export function umbralBien(escalaMin: number, escalaMax: number): number {
  return escalaMin + (escalaMax - escalaMin) * 0.7;
}
