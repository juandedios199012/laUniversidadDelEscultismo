// ============================================================================
// OBJECTIVES CHECKLIST COMPONENT
// ============================================================================
// Lista de objetivos educativos con checkboxes para marcar completados
// ============================================================================

import React, { useState } from 'react';
import { ObjetivoScout } from '../../services/progresionService';
import { Check, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface ObjectivesChecklistProps {
  objetivos: ObjetivoScout[];
  onToggleObjetivo?: (objetivo: ObjetivoScout, completado: boolean) => void;
  groupByArea?: boolean;
  readOnly?: boolean;
  showIndicadores?: boolean;
  loading?: boolean;
  className?: string;
}

const ObjectivesChecklist: React.FC<ObjectivesChecklistProps> = ({
  objetivos,
  onToggleObjetivo,
  groupByArea = true,
  readOnly = false,
  showIndicadores = false,
  loading = false,
  className = ''
}) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedObjetivos, setExpandedObjetivos] = useState<Set<string>>(new Set());

  // Tipo para datos agrupados por área
  type AreaGroup = { 
    area_nombre: string; 
    area_icono: string; 
    area_color: string; 
    objetivos: ObjetivoScout[] 
  };

  // Agrupar objetivos por área
  const objetivosPorArea = React.useMemo((): Record<string, AreaGroup> => {
    if (!groupByArea) {
      return { 
        todos: { 
          area_nombre: 'Todos', 
          area_icono: '📋', 
          area_color: '#6b7280', 
          objetivos 
        } 
      };
    }
    
    return objetivos.reduce<Record<string, AreaGroup>>((acc, obj) => {
      const key = obj.area_codigo;
      if (!acc[key]) {
        acc[key] = {
          area_nombre: obj.area_nombre,
          area_icono: obj.area_icono,
          area_color: obj.area_color,
          objetivos: []
        };
      }
      acc[key].objetivos.push(obj);
      return acc;
    }, {});
  }, [objetivos, groupByArea]);

  const toggleArea = (areaCodigo: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaCodigo)) {
        next.delete(areaCodigo);
      } else {
        next.add(areaCodigo);
      }
      return next;
    });
  };

  const toggleObjetivoExpand = (objetivoId: string) => {
    setExpandedObjetivos(prev => {
      const next = new Set(prev);
      if (next.has(objetivoId)) {
        next.delete(objetivoId);
      } else {
        next.add(objetivoId);
      }
      return next;
    });
  };

  const handleCheckboxChange = (objetivo: ObjetivoScout) => {
    if (readOnly || loading) return;
    onToggleObjetivo?.(objetivo, !objetivo.completado);
  };

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

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (objetivos.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Info className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">No hay objetivos para mostrar</p>
      </div>
    );
  }

  // Renderizar objetivo individual
  const renderObjetivo = (objetivo: ObjetivoScout, color: string) => {
    const isExpanded = expandedObjetivos.has(objetivo.id);
    
    return (
      <div
        key={objetivo.id}
        className={`
          border rounded-lg overflow-hidden transition-all
          ${objetivo.completado ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
        `}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Checkbox */}
          <button
            onClick={() => handleCheckboxChange(objetivo)}
            disabled={readOnly || loading}
            className={`
              flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center
              transition-all mt-0.5
              ${objetivo.completado
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${readOnly ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            {objetivo.completado && <Check className="w-4 h-4" />}
          </button>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`font-medium ${objetivo.completado ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                  {objetivo.titulo}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {objetivo.descripcion}
                </p>
              </div>
              
              {/* Botón expandir indicadores */}
              {objetivo.indicadores && objetivo.indicadores.length > 0 && showIndicadores && (
                <button
                  onClick={() => toggleObjetivoExpand(objetivo.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>
            
            {/* Indicadores expandidos */}
            {isExpanded && objetivo.indicadores && objetivo.indicadores.length > 0 && (
              <div className="mt-3 pl-2 border-l-2 space-y-1" style={{ borderColor: color }}>
                <p className="text-xs font-medium text-gray-600 mb-2">Indicadores:</p>
                {objetivo.indicadores.map((ind, idx) => (
                  <p key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {ind}
                  </p>
                ))}
              </div>
            )}
            
            {/* Info de completado */}
            {objetivo.completado && objetivo.fecha_completado && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Completado el {new Date(objetivo.fecha_completado).toLocaleDateString('es-PE')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Si no agrupar por área
  if (!groupByArea) {
    return (
      <div className={`space-y-3 ${className}`}>
        {objetivos.map(obj => renderObjetivo(obj, '#6b7280'))}
      </div>
    );
  }

  // Agrupado por área
  return (
    <div className={`space-y-4 ${className}`}>
      {Object.entries(objetivosPorArea).map(([areaCodigo, areaData]) => {
        const isExpanded = expandedAreas.has(areaCodigo);
        const color = getAreaColor(areaCodigo);
        const completados = areaData.objetivos.filter(o => o.completado).length;
        const total = areaData.objetivos.length;
        const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
        
        return (
          <div key={areaCodigo} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header del área */}
            <button
              onClick={() => toggleArea(areaCodigo)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{areaData.area_icono}</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{areaData.area_nombre}</p>
                  <p className="text-sm text-gray-500">{completados} de {total} objetivos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Barra de progreso mini */}
                <div className="hidden sm:block w-24">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
                
                <span className="font-bold" style={{ color }}>{porcentaje}%</span>
                
                {isExpanded 
                  ? <ChevronDown className="w-5 h-5 text-gray-400" />
                  : <ChevronRight className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            
            {/* Lista de objetivos */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {areaData.objetivos.map(obj => renderObjetivo(obj, color))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ObjectivesChecklist;
