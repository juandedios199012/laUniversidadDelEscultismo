/**
 * Utilidades puras para calcular y filtrar cumpleaños a partir de una
 * fecha de nacimiento en formato "YYYY-MM-DD". Sin dependencias de UI,
 * para poder reutilizarse en otras vistas (ej. notificaciones) o testear
 * de forma aislada.
 */
import { parseLocalDate } from './utils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMonthDay(fechaNacimiento: string): { month: number; day: number } {
  const d = parseLocalDate(fechaNacimiento);
  return { month: d.getMonth(), day: d.getDate() };
}

function getWeekRange(from: Date): { start: Date; end: Date } {
  const today = startOfDay(from);
  const diffToMonday = (today.getDay() + 6) % 7; // lunes = inicio de semana
  const start = new Date(today);
  start.setDate(today.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/** Días restantes hasta la próxima ocurrencia del cumpleaños (0 = hoy). */
export function getDaysUntilNextBirthday(fechaNacimiento: string, from: Date = new Date()): number {
  const { month, day } = getMonthDay(fechaNacimiento);
  const today = startOfDay(from);
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) {
    next = new Date(today.getFullYear() + 1, month, day);
  }
  return Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
}

/** true si el cumpleaños cae dentro de la semana calendario (lunes-domingo) actual. */
export function isBirthdayInCurrentWeek(fechaNacimiento: string, from: Date = new Date()): boolean {
  const { month, day } = getMonthDay(fechaNacimiento);
  const { start, end } = getWeekRange(from);
  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    const candidate = new Date(year, month, day);
    if (candidate >= start && candidate <= end) return true;
  }
  return false;
}

/** true si el cumpleaños cae dentro del mes calendario actual. */
export function isBirthdayInCurrentMonth(fechaNacimiento: string, from: Date = new Date()): boolean {
  return getMonthDay(fechaNacimiento).month === from.getMonth();
}

/** Ordena una lista por proximidad al próximo cumpleaños (el más cercano primero). */
export function sortByUpcomingBirthday<T>(
  items: T[],
  getFechaNacimiento: (item: T) => string | undefined,
  from: Date = new Date()
): T[] {
  return [...items].sort((a, b) => {
    const fa = getFechaNacimiento(a);
    const fb = getFechaNacimiento(b);
    if (!fa && !fb) return 0;
    if (!fa) return 1;
    if (!fb) return -1;
    return getDaysUntilNextBirthday(fa, from) - getDaysUntilNextBirthday(fb, from);
  });
}

/** Texto corto para mostrar cuánto falta para el cumpleaños ("¡Hoy!", "Mañana", "En 5 días"). */
export function formatDaysUntilBirthday(days: number): string {
  if (days === 0) return '¡Hoy! 🎉';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}
