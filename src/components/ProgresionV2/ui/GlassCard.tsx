/**
 * GlassCard V2 – Tarjeta con efecto glassmorphism
 * Inspirada en scout-progression-hub-main
 * NO modifica el módulo v1 existente
 */
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowColor?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = false,
  glowColor,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6',
        'transition-all duration-300',
        hoverable
          ? 'cursor-pointer hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl'
          : '',
        className,
      ].join(' ')}
      style={glowColor ? { boxShadow: `0 0 28px ${glowColor}40` } : undefined}
    >
      {children}
    </div>
  );
};
