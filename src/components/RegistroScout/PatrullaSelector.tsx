/**
 * 🎯 PatrullaSelector Component
 * @description Selector inteligente de patrulla con validaciones y UX optimizado
 * @principles DRY, SOLID, Clean Code, Accessibility
 */

import { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Patrulla {
  id: string;
  nombre: string;
  codigo_patrulla: string;
  rama: string;
  lema: string | null;
  animal_totem: string | null;
  color_patrulla: string | null;
  lider_nombre?: string;
  miembros_count: number;
  estado: string;
}

interface PatrullaSelectorProps {
  ramaActual: string;
  scoutId?: string;
  patrullaActualId?: string | null;
  onChange: (patrullaId: string | null) => void;
  disabled?: boolean;
}

const CAPACIDAD_MAXIMA_PATRULLA = 8;
const CAPACIDAD_OPTIMA_PATRULLA = 6;

export default function PatrullaSelector({ 
  ramaActual, 
  // scoutId, // No usado actualmente, preparado para futuras validaciones
  patrullaActualId, 
  onChange,
  disabled = false 
}: PatrullaSelectorProps) {
  const [patrullas, setPatrullas] = useState<Patrulla[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ramaActual) {
      cargarPatrullasPorRama();
    } else {
      setPatrullas([]);
    }
  }, [ramaActual]);

  const cargarPatrullasPorRama = async () => {
    setLoading(true);
    setError(null);

    try {
      // Query simplificada sin JOIN problemático
      const { data, error: queryError } = await supabase
        .from('patrullas')
        .select('id, codigo_patrulla, nombre, lema, animal_totem, color_patrulla, rama, estado, lider_id')
        .eq('rama', ramaActual)
        .eq('estado', 'ACTIVO')
        .order('nombre');

      if (queryError) throw queryError;

      // Procesar datos para calcular conteos y obtener nombres de líderes
      const patrullasConConteo = await Promise.all(
        (data || []).map(async (p: any) => {
          // Contar miembros activos directamente
          const { count } = await supabase
            .from('miembros_patrulla')
            .select('*', { count: 'exact', head: true })
            .eq('patrulla_id', p.id)
            .eq('estado_miembro', 'ACTIVO')
            .is('fecha_salida', null);

          // Obtener nombre del líder si existe
          let lider_nombre = 'Sin líder';
          if (p.lider_id) {
            const { data: scoutData } = await supabase
              .from('scouts')
              .select('persona_id')
              .eq('id', p.lider_id)
              .single();

            if (scoutData?.persona_id) {
              const { data: personaData } = await supabase
                .from('personas')
                .select('nombres, apellidos')
                .eq('id', scoutData.persona_id)
                .single();

              if (personaData) {
                lider_nombre = `${personaData.nombres} ${personaData.apellidos}`;
              }
            }
          }

          return {
            id: p.id,
            codigo_patrulla: p.codigo_patrulla,
            nombre: p.nombre,
            lema: p.lema,
            animal_totem: p.animal_totem,
            color_patrulla: p.color_patrulla,
            rama: p.rama,
            estado: p.estado,
            lider_nombre,
            miembros_count: count || 0
          };
        })
      );

      setPatrullas(patrullasConConteo);
    } catch (err) {
      console.error('Error cargando patrullas:', err);
      setError('No se pudieron cargar las patrullas');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoCapacidad = (count: number) => {
    if (count >= CAPACIDAD_MAXIMA_PATRULLA) {
      return { 
        label: 'Llena', 
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertCircle 
      };
    } else if (count >= CAPACIDAD_OPTIMA_PATRULLA) {
      return { 
        label: 'Casi llena', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Info 
      };
    } else {
      return { 
        label: 'Disponible', 
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle 
      };
    }
  };

  const handleSeleccion = (patrullaId: string) => {
    const patrulla = patrullas.find(p => p.id === patrullaId);
    
    if (!patrulla) return;

    // Validación de capacidad
    if (patrulla.miembros_count >= CAPACIDAD_MAXIMA_PATRULLA && patrullaId !== patrullaActualId) {
      alert(`La patrulla "${patrulla.nombre}" está llena (${CAPACIDAD_MAXIMA_PATRULLA}/${CAPACIDAD_MAXIMA_PATRULLA}). Por favor, elige otra patrulla.`);
      return;
    }

    onChange(patrullaId);
  };

  if (!ramaActual) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700">
          <Info className="w-5 h-5" />
          <p className="text-sm">Primero selecciona una rama para ver las patrullas disponibles</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span>Cargando patrullas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (patrullas.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <Info className="w-5 h-5" />
          <p className="text-sm">No hay patrullas activas en la rama {ramaActual}. Crea una primero.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector Principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Patrulla
        </label>
        <select
          value={patrullaActualId || ''}
          onChange={(e) => handleSeleccion(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Sin patrulla</option>
          {patrullas.map((patrulla) => {
            const estado = getEstadoCapacidad(patrulla.miembros_count);
            const estaLlena = patrulla.miembros_count >= CAPACIDAD_MAXIMA_PATRULLA;
            const esPatrullaActual = patrulla.id === patrullaActualId;

            return (
              <option 
                key={patrulla.id} 
                value={patrulla.id}
                disabled={estaLlena && !esPatrullaActual}
              >
                {patrulla.nombre} ({patrulla.miembros_count}/{CAPACIDAD_MAXIMA_PATRULLA}) - {estado.label}
                {patrulla.animal_totem && ` 🦅 ${patrulla.animal_totem}`}
              </option>
            );
          })}
        </select>
      </div>

      {/* Información Detallada de Patrulla Seleccionada */}
      {patrullaActualId && patrullas.find(p => p.id === patrullaActualId) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {(() => {
            const patrullaSeleccionada = patrullas.find(p => p.id === patrullaActualId)!;
            const estado = getEstadoCapacidad(patrullaSeleccionada.miembros_count);
            const IconoEstado = estado.icon;

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      {patrullaSeleccionada.nombre}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${estado.color} flex items-center gap-1`}>
                    <IconoEstado className="w-3 h-3" />
                    {estado.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Código:</span>
                    <span className="ml-2 font-medium">{patrullaSeleccionada.codigo_patrulla}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Guía:</span>
                    <span className="ml-2 font-medium">{patrullaSeleccionada.lider_nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Miembros:</span>
                    <span className="ml-2 font-medium">
                      {patrullaSeleccionada.miembros_count}/{CAPACIDAD_MAXIMA_PATRULLA}
                    </span>
                  </div>
                  {patrullaSeleccionada.animal_totem && (
                    <div>
                      <span className="text-gray-600">Tótem:</span>
                      <span className="ml-2 font-medium">{patrullaSeleccionada.animal_totem}</span>
                    </div>
                  )}
                </div>

                {patrullaSeleccionada.lema && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs italic text-gray-600">"{patrullaSeleccionada.lema}"</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Leyenda de Capacidad */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Capacidad óptima:</strong> {CAPACIDAD_OPTIMA_PATRULLA} scouts</p>
        <p>⚠️ <strong>Capacidad máxima:</strong> {CAPACIDAD_MAXIMA_PATRULLA} scouts</p>
      </div>
    </div>
  );
}
