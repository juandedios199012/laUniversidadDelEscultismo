// ============================================================================
// TIPOS PARA EL MÓDULO DE ESPECIALIDADES SCOUT
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

// Tipos base
export type AreaId = 'ciencia' | 'naturaleza' | 'arte' | 'deportes' | 'servicio' | 'institucional';
export type FaseId = 'exploracion' | 'taller' | 'desafio';
export type FaseEstado = 'pendiente' | 'en_progreso' | 'completada';
export type TipoEvidencia = 'imagen' | 'video' | 'documento' | 'otro';
export type NivelDificultad = 'basico' | 'intermedio' | 'avanzado';

// ============================================================================
// ÁREA DE ESPECIALIDAD
// ============================================================================
export interface AreaEspecialidad {
  id: string;
  codigo: AreaId;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
  total_especialidades?: number;
}

// ============================================================================
// ESPECIALIDAD
// ============================================================================
export interface Especialidad {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  exploracion: string;
  taller: string;
  desafio: string;
  nivel_dificultad: NivelDificultad;
  tiempo_estimado_dias: number;
  requisitos_previos?: string[];
  materiales_sugeridos?: string[];
  area: {
    id: string;
    codigo: AreaId;
    nombre: string;
    icono: string;
    color: string;
  };
}

export interface EspecialidadDetalle extends Especialidad {
  scouts_cursando: number;
  scouts_completaron: number;
}

// ============================================================================
// PROGRESO DE ESPECIALIDAD
// ============================================================================
export interface FasesProgreso {
  exploracion: FaseEstado;
  taller: FaseEstado;
  desafio: FaseEstado;
}

export interface EvidenciaEspecialidad {
  id: string;
  tipo: TipoEvidencia;
  url: string;
  nombre_archivo?: string;
  descripcion?: string;
  fase: FaseId | 'general';
}

export interface ProgresoEspecialidad {
  progreso_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  fase_exploracion: FaseEstado;
  fase_taller: FaseEstado;
  fase_desafio: FaseEstado;
  asesor_nombre?: string;
  notas?: string;
  especialidad: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    // Contenido de las fases (viñetas separadas por " • ")
    exploracion?: string;
    taller?: string;
    desafio?: string;
  };
  area: {
    id: string;
    codigo: string;
    nombre: string;
    icono: string;
    color: string;
  };
  evidencias: EvidenciaEspecialidad[];
  completada: boolean;
}

// ============================================================================
// DASHBOARD Y REPORTES
// ============================================================================
export interface DashboardStats {
  total_especialidades: number;
  total_asignaciones: number;
  en_progreso: number;
  completadas: number;
  scouts_con_especialidades: number;
}

export interface AreaStats {
  codigo: string;
  nombre: string;
  icono: string;
  color: string;
  total_especialidades: number;
  asignadas: number;
  completadas: number;
}

export interface DashboardEspecialidades {
  stats: DashboardStats;
  areas: AreaStats[];
}

export interface ReporteScoutEspecialidades {
  scout_id: string;
  codigo_scout: string;
  nombre: string;
  rama: string;
  patrulla?: string;
  total_especialidades: number;
  completadas: number;
  en_progreso: number;
}

// ============================================================================
// FORMULARIOS Y INPUTS
// ============================================================================
export interface AsignarEspecialidadInput {
  scout_id: string;
  especialidad_id: string;
  asesor_id?: string;
  asesor_nombre?: string;
  notas?: string;
  fecha_inicio?: string; // Formato YYYY-MM-DD, si no se envía usa fecha actual
}

export interface ActualizarProgresoInput {
  progreso_id: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  asesor_id?: string;
  asesor_nombre?: string;
  notas?: string;
}

export interface ActualizarFaseInput {
  progreso_id: string;
  fase: FaseId;
  nuevo_estado: FaseEstado;
}

export interface AgregarEvidenciaInput {
  progreso_id: string;
  tipo: TipoEvidencia;
  url: string;
  nombre_archivo?: string;
  descripcion?: string;
  fase?: FaseId | 'general';
}

// ============================================================================
// RESPUESTAS API
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  mensaje?: string;
  data?: T;
}

export interface EspecialidadesScoutResponse {
  success: boolean;
  scout_id: string;
  especialidades: ProgresoEspecialidad[];
  total: number;
  completadas: number;
  en_progreso: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================
export const FASE_LABELS: Record<FaseId, string> = {
  exploracion: '🔍 Exploración',
  taller: '🔧 Taller',
  desafio: '🎯 Desafío'
};

export const ESTADO_LABELS: Record<FaseEstado, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completada: 'Completada'
};

export const ESTADO_COLORS: Record<FaseEstado, string> = {
  pendiente: 'bg-gray-100 text-gray-600',
  en_progreso: 'bg-amber-100 text-amber-700',
  completada: 'bg-green-100 text-green-700'
};

export const AREA_COLORS: Record<AreaId, string> = {
  ciencia: 'bg-blue-100 text-blue-700 border-blue-200',
  naturaleza: 'bg-green-100 text-green-700 border-green-200',
  arte: 'bg-purple-100 text-purple-700 border-purple-200',
  deportes: 'bg-orange-100 text-orange-700 border-orange-200',
  servicio: 'bg-red-100 text-red-700 border-red-200',
  institucional: 'bg-indigo-100 text-indigo-700 border-indigo-200'
};

export const AREA_GRADIENTS: Record<AreaId, string> = {
  ciencia: 'from-blue-500 to-cyan-500',
  naturaleza: 'from-green-500 to-emerald-500',
  arte: 'from-purple-500 to-pink-500',
  deportes: 'from-orange-500 to-amber-500',
  servicio: 'from-red-500 to-rose-500',
  institucional: 'from-indigo-500 to-violet-500'
};
