/**
 * StageBadge V2 – Badge de etapa scout con color semántico
 */
import React from 'react';
import { ETAPAS_CONFIG } from '../config/etapasConfig';

interface StageBadgeProps {
  etapaCodigo: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StageBadge: React.FC<StageBadgeProps> = ({
  etapaCodigo,
  size = 'md',
  showIcon = true,
}) => {
  const config = ETAPAS_CONFIG[etapaCodigo] ?? ETAPAS_CONFIG['PISTA'];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        background: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}50`,
      }}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.nombre}
    </span>
  );
};
