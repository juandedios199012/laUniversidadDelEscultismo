export function formatFechaCorta(fecha: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatSoles(monto: number): string {
  return `S/ ${monto.toFixed(2)}`;
}

export const MEDIO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  OTRO: 'Otro',
};
