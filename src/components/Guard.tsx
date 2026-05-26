import React from 'react';
import { useAbility } from '../hooks/useAbility';

interface GuardProps {
  /** permission_key a verificar, ej. "scouts:crear" */
  permission: string;
  children: React.ReactNode;
  /**
   * - 'hide'    → oculta el contenido si no tiene permiso (default)
   * - 'disable' → muestra el contenido deshabilitado con tooltip
   */
  mode?: 'hide' | 'disable';
  /** Contenido alternativo cuando mode='hide' y no tiene permiso */
  fallback?: React.ReactNode;
}

/**
 * Componente de protección de grano fino (sistema V2).
 *
 * Uso:
 *   <Guard permission="scouts:crear">
 *     <button>Nuevo Scout</button>
 *   </Guard>
 *
 *   <Guard permission="reportes:exportar:pdf" mode="disable">
 *     <button>Exportar PDF</button>
 *   </Guard>
 */
export function Guard({ permission, children, mode = 'hide', fallback = null }: GuardProps) {
  const { can, loading } = useAbility();

  // Mientras carga, no mostrar nada para evitar flashes
  if (loading) return null;

  if (can(permission)) return <>{children}</>;

  if (mode === 'disable') {
    return (
      <span
        title="No tienes permiso para esta acción"
        className="inline-block cursor-not-allowed opacity-50 select-none"
        style={{ pointerEvents: 'none' }}
      >
        {children}
      </span>
    );
  }

  return <>{fallback}</>;
}
