// ============================================================================
// STAGE BADGE COMPONENT
// ============================================================================
// Badge que muestra la etapa actual de un scout con icono y color
// Adaptado de scout-progression-hub (Lovable)
// ============================================================================

import React from 'react';

interface StageBadgeProps {
  codigo: string;
  nombre: string;
  icono?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const StageBadge: React.FC<StageBadgeProps> = ({
  codigo,
  nombre,
  icono,
  color,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  // Mapeo de colores por código de etapa
  const getColorClasses = (etapaCodigo: string): { bg: string; text: string; border: string } => {
    const colores: Record<string, { bg: string; text: string; border: string }> = {
      PISTA: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      SENDA: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      RUMBO: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
      TRAVESIA: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    };
    return colores[etapaCodigo] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  };

  // Iconos por defecto si no se proporciona
  const getDefaultIcon = (etapaCodigo: string): string => {
    const iconos: Record<string, string> = {
      PISTA: '🥾',
      SENDA: '🧭',
      RUMBO: '⛺',
      TRAVESIA: '🏔️'
    };
    return iconos[etapaCodigo] || '📍';
  };

  const colors = getColorClasses(codigo);
  const displayIcon = icono || getDefaultIcon(codigo);

  // Tamaños
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        ${className}
      `}
      style={color ? { backgroundColor: color + '20', color: color, borderColor: color + '40' } : {}}
    >
      <span className={iconSizes[size]}>{displayIcon}</span>
      {showLabel && <span>{nombre}</span>}
    </span>
  );
};

// Variante circular solo con icono
export const StageBadgeCircle: React.FC<{
  codigo: string;
  icono?: string;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}> = ({ codigo, icono, size = 'md', tooltip }) => {
  const getColorClasses = (etapaCodigo: string): { bg: string; border: string } => {
    const colores: Record<string, { bg: string; border: string }> = {
      PISTA: { bg: 'bg-green-100', border: 'border-green-300' },
      SENDA: { bg: 'bg-blue-100', border: 'border-blue-300' },
      RUMBO: { bg: 'bg-amber-100', border: 'border-amber-300' },
      TRAVESIA: { bg: 'bg-red-100', border: 'border-red-300' }
    };
    return colores[etapaCodigo] || { bg: 'bg-gray-100', border: 'border-gray-300' };
  };

  const getDefaultIcon = (etapaCodigo: string): string => {
    const iconos: Record<string, string> = {
      PISTA: '🥾',
      SENDA: '🧭',
      RUMBO: '⛺',
      TRAVESIA: '🏔️'
    };
    return iconos[etapaCodigo] || '📍';
  };

  const colors = getColorClasses(codigo);
  const displayIcon = icono || getDefaultIcon(codigo);

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-12 h-12 text-2xl'
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full border-2
        ${colors.bg} ${colors.border}
        ${sizeClasses[size]}
      `}
      title={tooltip}
    >
      {displayIcon}
    </div>
  );
};

export default StageBadge;
