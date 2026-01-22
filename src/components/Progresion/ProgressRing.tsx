// ============================================================================
// PROGRESS RING COMPONENT
// ============================================================================
// Anillo de progreso animado usando SVG
// Adaptado de scout-progression-hub (Lovable)
// ============================================================================

import React from 'react';

interface ProgressRingProps {
  progress: number;       // Porcentaje de progreso (0-100)
  size?: number;          // Tamaño del anillo en píxeles
  strokeWidth?: number;   // Grosor del trazo
  color?: string;         // Color del progreso (clase Tailwind o hex)
  bgColor?: string;       // Color de fondo del anillo
  showPercentage?: boolean; // Mostrar porcentaje en el centro
  label?: string;         // Etiqueta adicional debajo del porcentaje
  animated?: boolean;     // Animar al aparecer
  className?: string;     // Clases adicionales
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#22c55e',    // green-500
  bgColor = '#e5e7eb',  // gray-200
  showPercentage = true,
  label,
  animated = true,
  className = ''
}) => {
  // Validar progreso entre 0 y 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Cálculos del SVG
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;
  
  // Centro del círculo
  const center = size / 2;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className={animated ? 'transform -rotate-90 transition-all duration-1000' : 'transform -rotate-90'}
      >
        {/* Círculo de fondo */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Círculo de progreso */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : offset}
          style={{
            transition: animated ? 'stroke-dashoffset 1s ease-in-out' : 'none'
          }}
        />
      </svg>
      
      {/* Contenido central */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="text-2xl font-bold"
            style={{ color: color }}
          >
            {Math.round(normalizedProgress)}%
          </span>
          {label && (
            <span className="text-xs text-gray-500 mt-1">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Versión mini para uso en listas/tablas
export const ProgressRingMini: React.FC<{
  progress: number;
  color?: string;
  size?: number;
}> = ({ progress, color = '#22c55e', size = 32 }) => (
  <ProgressRing
    progress={progress}
    size={size}
    strokeWidth={3}
    color={color}
    showPercentage={false}
    animated={false}
  />
);

// Versión con etiqueta para áreas de crecimiento
export const ProgressRingArea: React.FC<{
  progress: number;
  areaName: string;
  areaIcon: string;
  color: string;
}> = ({ progress, areaName, areaIcon, color }) => (
  <div className="flex flex-col items-center gap-2">
    <ProgressRing
      progress={progress}
      size={80}
      strokeWidth={6}
      color={color}
      showPercentage={false}
    />
    <div className="text-center">
      <span className="text-2xl">{areaIcon}</span>
      <p className="text-sm font-medium text-gray-700">{areaName}</p>
      <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
    </div>
  </div>
);

export default ProgressRing;
