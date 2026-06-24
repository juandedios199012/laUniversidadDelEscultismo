/**
 * Encadenado de horarios para listas de filas con hora_inicio + duracion_minutos
 * (actividades de Programa Semanal, bloques de Aire Libre). Cada fila empieza
 * justo cuando termina la anterior; solo la primera usa la hora de inicio dada.
 */

export function timeToMinutes(time: string): number | null {
  if (!time || !time.includes(':')) return null;
  const [hh, mm] = time.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return (hh * 60) + mm;
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60).toString().padStart(2, '0');
  const mm = (normalized % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function recalcularHorarioSecuencial<
  T extends { hora_inicio: string; duracion_minutos?: number }
>(items: T[], startTime: string): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const startMinutes = timeToMinutes(startTime) ?? 9 * 60;
  let currentStart = startMinutes;

  return items.map((item, index) => {
    const duracion = Number(item.duracion_minutos) > 0 ? Number(item.duracion_minutos) : 0;
    const horaInicio = index === 0
      ? (startTime || item.hora_inicio || '09:00')
      : minutesToTime(currentStart);

    currentStart += duracion;
    return {
      ...item,
      hora_inicio: horaInicio,
    };
  });
}
