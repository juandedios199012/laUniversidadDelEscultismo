// ============================================================================
// GROWTH AREAS GRID COMPONENT
// ============================================================================
// Cuadrícula de las 6 áreas de crecimiento con progreso visual
// Adaptado de scout-progression-hub (Lovable)
// ============================================================================

import React from 'react';
import ProgressRing from './ProgressRing';
import { ProgresoArea } from '../../services/progresionService';

interface GrowthAreasGridProps {
  areas: ProgresoArea[];
  onAreaClick?: (area: ProgresoArea) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const GrowthAreasGrid: React.FC<GrowthAreasGridProps> = ({
  areas,
  onAreaClick,
  size = 'md',
  showLabels = true,
  className = ''
}) => {
  // Mapeo de colores por código de área
  const getAreaColor = (areaCodigo: string): string => {
    const colores: Record<string, string> = {
      CORPORALIDAD: '#ef4444',    // red-500
      CREATIVIDAD: '#f97316',     // orange-500
      CARACTER: '#eab308',        // yellow-500
      AFECTIVIDAD: '#ec4899',     // pink-500
      SOCIABILIDAD: '#22c55e',    // green-500
      ESPIRITUALIDAD: '#a855f7'   // purple-500
    };
    return colores[areaCodigo] || '#6b7280';
  };

  // Tamaños de anillo según size prop
  const ringSizes = {
    sm: 60,
    md: 80,
    lg: 100
  };

  const strokeWidths = {
    sm: 4,
    md: 6,
    lg: 8
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {areas.map((area) => (
        <div
          key={area.area_id}
          onClick={() => onAreaClick?.(area)}
          className={`
            flex flex-col items-center p-4 rounded-xl bg-white shadow-sm
            border border-gray-100 transition-all duration-200
            ${onAreaClick ? 'cursor-pointer hover:shadow-md hover:scale-105 hover:border-gray-200' : ''}
          `}
        >
          {/* Anillo de progreso */}
          <ProgressRing
            progress={area.porcentaje}
            size={ringSizes[size]}
            strokeWidth={strokeWidths[size]}
            color={area.area_color || getAreaColor(area.area_codigo)}
            showPercentage={false}
          />
          
          {/* Icono del área */}
          <div 
            className="text-2xl -mt-12 mb-2 z-10"
            style={{ fontSize: size === 'lg' ? '2rem' : size === 'md' ? '1.5rem' : '1.25rem' }}
          >
            {area.area_icono}
          </div>
          
          {showLabels && (
            <>
              {/* Nombre del área */}
              <p className="text-sm font-medium text-gray-700 text-center mt-1">
                {area.area_nombre}
              </p>
              
              {/* Porcentaje y conteo */}
              <p className="text-xs text-gray-500 mt-1">
                {area.objetivos_completados}/{area.total_objetivos} • {Math.round(area.porcentaje)}%
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// Versión compacta para cards
export const GrowthAreasCompact: React.FC<{
  areas: ProgresoArea[];
  className?: string;
}> = ({ areas, className = '' }) => {
  const getAreaColor = (areaCodigo: string): string => {
    const colores: Record<string, string> = {
      CORPORALIDAD: '#ef4444',
      CREATIVIDAD: '#f97316',
      CARACTER: '#eab308',
      AFECTIVIDAD: '#ec4899',
      SOCIABILIDAD: '#22c55e',
      ESPIRITUALIDAD: '#a855f7'
    };
    return colores[areaCodigo] || '#6b7280';
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {areas.map((area) => (
        <div
          key={area.area_id}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50"
          title={`${area.area_nombre}: ${area.objetivos_completados}/${area.total_objetivos}`}
        >
          <span className="text-sm">{area.area_icono}</span>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${area.porcentaje}%`,
                backgroundColor: getAreaColor(area.area_codigo)
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Versión de lista vertical
export const GrowthAreasList: React.FC<{
  areas: ProgresoArea[];
  onAreaClick?: (area: ProgresoArea) => void;
}> = ({ areas, onAreaClick }) => {
  const getAreaColor = (areaCodigo: string): string => {
    const colores: Record<string, string> = {
      CORPORALIDAD: '#ef4444',
      CREATIVIDAD: '#f97316',
      CARACTER: '#eab308',
      AFECTIVIDAD: '#ec4899',
      SOCIABILIDAD: '#22c55e',
      ESPIRITUALIDAD: '#a855f7'
    };
    return colores[areaCodigo] || '#6b7280';
  };

  return (
    <div className="space-y-3">
      {areas.map((area) => (
        <div
          key={area.area_id}
          onClick={() => onAreaClick?.(area)}
          className={`
            flex items-center gap-4 p-3 rounded-lg bg-white border border-gray-100
            ${onAreaClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
          `}
        >
          {/* Icono */}
          <div className="text-2xl">{area.area_icono}</div>
          
          {/* Info y barra */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800 truncate">
                {area.area_nombre}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {area.objetivos_completados}/{area.total_objetivos}
              </span>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${area.porcentaje}%`,
                  backgroundColor: getAreaColor(area.area_codigo)
                }}
              />
            </div>
          </div>
          
          {/* Porcentaje */}
          <div 
            className="text-lg font-bold"
            style={{ color: getAreaColor(area.area_codigo) }}
          >
            {Math.round(area.porcentaje)}%
          </div>
        </div>
      ))}
    </div>
  );
};

export default GrowthAreasGrid;
