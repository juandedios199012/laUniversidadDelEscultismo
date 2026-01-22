/**
 * 🎖️ CargoPatrullaSelector Component
 * @description Selector inteligente de cargo/rol dentro de una patrulla
 * @principles UX, Usability, SOLID, Clean Code
 */

import { useState, useEffect } from 'react';
import { Award, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  CargoPatrulla, 
  getCargosDisponibles,
  validarAsignacionCargo,
  getCargoDefinicion 
} from '../../types/patrulla';

interface CargoPatrullaSelectorProps {
  patrullaId: string | null;
  cargoActual?: CargoPatrulla;
  scoutId?: string; // Para excluir al scout actual al validar
  onChange: (cargo: CargoPatrulla) => void;
  disabled?: boolean;
}

export default function CargoPatrullaSelector({ 
  patrullaId, 
  cargoActual = 'MIEMBRO',
  scoutId,
  onChange,
  disabled = false 
}: CargoPatrullaSelectorProps) {
  const [cargosOcupados, setCargosOcupados] = useState<CargoPatrulla[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patrullaId) {
      cargarCargosOcupados();
    }
  }, [patrullaId]);

  const cargarCargosOcupados = async () => {
    if (!patrullaId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('miembros_patrulla')
        .select('cargo_patrulla, scout_id')
        .eq('patrulla_id', patrullaId)
        .eq('estado_miembro', 'ACTIVO')
        .is('fecha_salida', null);

      if (error) throw error;

      // Filtrar cargos ocupados (excluyendo el scout actual)
      const ocupados = (data || [])
        .filter(m => m.scout_id !== scoutId)
        .map(m => m.cargo_patrulla as CargoPatrulla);

      setCargosOcupados(ocupados);
    } catch (err) {
      console.error('Error cargando cargos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarCargo = (nuevoCargo: CargoPatrulla) => {
    const validacion = validarAsignacionCargo(nuevoCargo, cargosOcupados, cargoActual);
    
    if (!validacion.valido) {
      alert(`⚠️ ${validacion.mensaje}`);
      return;
    }

    onChange(nuevoCargo);
  };

  const cargosDisponibles = getCargosDisponibles(cargosOcupados, cargoActual);
  const cargoActualDef = getCargoDefinicion(cargoActual);

  if (!patrullaId) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Info className="w-4 h-4" />
          <p>Primero selecciona una patrulla para asignar un cargo</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm">Cargando cargos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector Principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            Cargo en la Patrulla
          </span>
        </label>
        
        <select
          value={cargoActual}
          onChange={(e) => handleCambiarCargo(e.target.value as CargoPatrulla)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {cargosDisponibles.map((cargo) => {
            const estaOcupado = cargo.esUnico && cargosOcupados.includes(cargo.value) && cargo.value !== cargoActual;
            
            return (
              <option 
                key={cargo.value} 
                value={cargo.value}
                disabled={estaOcupado}
              >
                {cargo.emoji} {cargo.label}
                {estaOcupado && ' (Ocupado)'}
                {cargo.value === cargoActual && ' (Actual)'}
              </option>
            );
          })}
        </select>
      </div>

      {/* Información del Cargo Seleccionado */}
      {cargoActualDef && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-2xl">{cargoActualDef.emoji}</div>
            <div className="flex-1">
              <p className="font-medium text-blue-900 text-sm">{cargoActualDef.label}</p>
              <p className="text-blue-700 text-xs mt-1">{cargoActualDef.descripcion}</p>
              {cargoActualDef.esUnico && (
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Cargo único - Solo puede haber uno por patrulla</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mapa de Cargos Ocupados */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
          Ver cargos ocupados en esta patrulla ({cargosOcupados.length})
        </summary>
        <div className="mt-2 space-y-1 pl-4">
          {cargosOcupados.length === 0 ? (
            <p className="text-gray-500 italic">No hay cargos asignados aún</p>
          ) : (
            cargosOcupados.map((cargo, idx) => {
              const def = getCargoDefinicion(cargo);
              return def ? (
                <div key={idx} className="flex items-center gap-2 text-gray-700">
                  <span>{def.emoji}</span>
                  <span>{def.label}</span>
                  {cargo === cargoActual && (
                    <span className="text-green-600 font-medium">(Tú)</span>
                  )}
                </div>
              ) : null;
            })
          )}
        </div>
      </details>

      {/* Guía de Cargos Disponibles */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">💡 Cargos en una Patrulla Scout:</p>
        <ul className="pl-4 space-y-0.5">
          <li>🦅 <strong>Guía:</strong> Líder de la patrulla</li>
          <li>⭐ <strong>Subguía:</strong> Reemplaza al guía en su ausencia</li>
          <li>🍽️ <strong>Intendente:</strong> Organiza alimentación</li>
          <li>⚕️ <strong>Enfermero:</strong> Primeros auxilios</li>
          <li>💰 <strong>Tesorero:</strong> Administra fondos</li>
          <li>📝 <strong>Secretario:</strong> Registros y actas</li>
          <li>📦 <strong>Guardalmacén:</strong> Cuida el equipo</li>
        </ul>
      </div>
    </div>
  );
}
