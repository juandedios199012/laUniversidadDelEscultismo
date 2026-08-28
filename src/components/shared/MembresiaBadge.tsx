import type { EstadoMembresia } from '@/services/membresiaService';

const ESTILOS: Record<EstadoMembresia, { label: string; className: string }> = {
  ACTIVE:  { label: 'Al día',     className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendiente',  className: 'bg-amber-100 text-amber-700' },
  EXPIRED: { label: 'Vencido',    className: 'bg-red-100 text-red-700' },
  EXEMPT:  { label: 'Exonerado',  className: 'bg-blue-100 text-blue-700' },
};

interface Props {
  estado?: EstadoMembresia;
  className?: string;
}

/** Badge del estado de la membresía anual (31 marzo - 31 marzo) de una persona. */
export default function MembresiaBadge({ estado, className = '' }: Props) {
  if (!estado) return null;
  const { label, className: colorClass } = ESTILOS[estado];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorClass} ${className}`}>
      {label}
    </span>
  );
}
