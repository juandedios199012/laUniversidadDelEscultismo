/**
 * 🎯 Tipos y Constantes para Sistema de Patrullas
 * @description Define tipos, cargos y reglas para gestión de patrullas
 * @principles Type Safety, Single Source of Truth, Scalability
 */

export type CargoPatrulla = 
  | 'MIEMBRO'
  | 'GUIA'
  | 'SUBGUIA'
  | 'INTENDENTE'
  | 'ENFERMERO'
  | 'TESORERO'
  | 'SECRETARIO'
  | 'GUARDALMACEN';

export interface CargoDefinicion {
  value: CargoPatrulla;
  label: string;
  emoji: string;
  descripcion: string;
  esUnico: boolean; // Solo puede haber uno por patrulla
  nivel: number; // Jerarquía (1 = más alto)
}

/**
 * Catálogo de cargos disponibles en una patrulla
 * @constant
 */
export const CARGOS_PATRULLA: CargoDefinicion[] = [
  {
    value: 'GUIA',
    label: 'Guía de Patrulla',
    emoji: '🦅',
    descripcion: 'Líder principal de la patrulla',
    esUnico: true,
    nivel: 1
  },
  {
    value: 'SUBGUIA',
    label: 'Subguía',
    emoji: '⭐',
    descripcion: 'Segundo al mando, apoya al guía',
    esUnico: true,
    nivel: 2
  },
  {
    value: 'INTENDENTE',
    label: 'Intendente',
    emoji: '🍽️',
    descripcion: 'Encargado de alimentación y cocina',
    esUnico: true,
    nivel: 3
  },
  {
    value: 'ENFERMERO',
    label: 'Enfermero',
    emoji: '⚕️',
    descripcion: 'Responsable de primeros auxilios',
    esUnico: true,
    nivel: 3
  },
  {
    value: 'TESORERO',
    label: 'Tesorero',
    emoji: '💰',
    descripcion: 'Administra fondos de la patrulla',
    esUnico: true,
    nivel: 3
  },
  {
    value: 'SECRETARIO',
    label: 'Secretario',
    emoji: '📝',
    descripcion: 'Lleva registros y documentación',
    esUnico: true,
    nivel: 3
  },
  {
    value: 'GUARDALMACEN',
    label: 'Guardalmacén',
    emoji: '📦',
    descripcion: 'Cuida el equipo y materiales',
    esUnico: true,
    nivel: 3
  },
  {
    value: 'MIEMBRO',
    label: 'Miembro',
    emoji: '👤',
    descripcion: 'Miembro activo de la patrulla',
    esUnico: false,
    nivel: 4
  }
];

/**
 * Capacidades de patrulla según metodología scout
 */
export const CAPACIDAD_MINIMA_PATRULLA = 4;
export const CAPACIDAD_OPTIMA_PATRULLA = 6;
export const CAPACIDAD_MAXIMA_PATRULLA = 8;

/**
 * Obtiene definición de un cargo
 */
export function getCargoDefinicion(cargo: CargoPatrulla): CargoDefinicion | undefined {
  return CARGOS_PATRULLA.find(c => c.value === cargo);
}

/**
 * Valida si un cargo puede ser asignado en una patrulla
 */
export function validarAsignacionCargo(
  cargo: CargoPatrulla,
  cargosOcupados: CargoPatrulla[],
  cargoActual?: CargoPatrulla
): { valido: boolean; mensaje?: string } {
  const def = getCargoDefinicion(cargo);
  
  if (!def) {
    return { valido: false, mensaje: 'Cargo no válido' };
  }

  // Si es el cargo actual del scout, siempre es válido
  if (cargoActual === cargo) {
    return { valido: true };
  }

  // Validar cargos únicos
  if (def.esUnico && cargosOcupados.includes(cargo)) {
    return { 
      valido: false, 
      mensaje: `El cargo de ${def.label} ya está ocupado en esta patrulla` 
    };
  }

  return { valido: true };
}

/**
 * Obtiene cargos disponibles para asignar
 */
export function getCargosDisponibles(
  cargosOcupados: CargoPatrulla[],
  cargoActual?: CargoPatrulla
): CargoDefinicion[] {
  return CARGOS_PATRULLA.filter(cargo => {
    // Siempre mostrar el cargo actual
    if (cargoActual === cargo.value) return true;
    
    // Filtrar cargos únicos ya ocupados
    if (cargo.esUnico && cargosOcupados.includes(cargo.value)) return false;
    
    return true;
  });
}
