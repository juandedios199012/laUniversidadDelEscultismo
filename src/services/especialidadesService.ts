// ============================================================================
// SERVICIO DE ESPECIALIDADES SCOUT
// ============================================================================
// Sistema de Gestión Scout - Grupo Scout Lima 12
// ============================================================================

import { supabase } from '../lib/supabase';
import type {
  AreaEspecialidad,
  Especialidad,
  EspecialidadDetalle,
  DashboardEspecialidades,
  ReporteScoutEspecialidades,
  AsignarEspecialidadInput,
  ActualizarFaseInput,
  AgregarEvidenciaInput,
  EspecialidadesScoutResponse,
  ActualizarProgresoInput,
  FaseEstado,
  AreaId
} from '../types/especialidades';

// ============================================================================
// ÁREAS DE ESPECIALIDAD
// ============================================================================

/**
 * Obtiene todas las áreas de especialidad con conteo
 */
export async function obtenerAreasEspecialidad(): Promise<AreaEspecialidad[]> {
  const { data, error } = await supabase.rpc('api_obtener_areas_especialidad');

  if (error) {
    console.error('Error obteniendo áreas:', error);
    throw new Error('Error al obtener áreas de especialidad');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data.areas;
}

// ============================================================================
// ESPECIALIDADES
// ============================================================================

/**
 * Obtiene el catálogo de especialidades con filtros opcionales
 */
export async function obtenerEspecialidades(
  areaCodigo?: AreaId | null,
  busqueda?: string | null
): Promise<Especialidad[]> {
  const { data, error } = await supabase.rpc('api_obtener_especialidades', {
    p_area_codigo: areaCodigo || null,
    p_busqueda: busqueda || null
  });

  if (error) {
    console.error('Error obteniendo especialidades:', error);
    throw new Error('Error al obtener especialidades');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data.especialidades;
}

/**
 * Obtiene el detalle de una especialidad específica
 */
export async function obtenerEspecialidadDetalle(
  especialidadId: string
): Promise<EspecialidadDetalle> {
  const { data, error } = await supabase.rpc('api_obtener_especialidad_detalle', {
    p_especialidad_id: especialidadId
  });

  if (error) {
    console.error('Error obteniendo detalle:', error);
    throw new Error('Error al obtener detalle de especialidad');
  }

  if (!data.success) {
    throw new Error(data.error || 'Especialidad no encontrada');
  }

  return data.especialidad;
}

// ============================================================================
// PROGRESO DE SCOUTS
// ============================================================================

/**
 * Asigna una especialidad a un scout
 */
export async function asignarEspecialidadScout(
  input: AsignarEspecialidadInput
): Promise<{ progreso_id: string }> {
  const { data, error } = await supabase.rpc('api_asignar_especialidad_scout', {
    p_scout_id: input.scout_id,
    p_especialidad_id: input.especialidad_id,
    p_asesor_id: input.asesor_id || null,
    p_asesor_nombre: input.asesor_nombre || null,
    p_notas: input.notas || null,
    p_fecha_inicio: input.fecha_inicio || null
  });

  if (error) {
    console.error('Error asignando especialidad:', error);
    throw new Error('Error al asignar especialidad');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error al asignar especialidad');
  }

  return { progreso_id: data.progreso_id };
}

/**
 * Actualiza el estado de una fase de especialidad
 */
export async function actualizarFaseEspecialidad(
  input: ActualizarFaseInput
): Promise<{ especialidad_completada: boolean }> {
  const { data, error } = await supabase.rpc('api_actualizar_fase_especialidad', {
    p_progreso_id: input.progreso_id,
    p_fase: input.fase,
    p_nuevo_estado: input.nuevo_estado
  });

  if (error) {
    console.error('Error actualizando fase:', error);
    throw new Error('Error al actualizar fase');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error al actualizar fase');
  }

  return { especialidad_completada: data.especialidad_completada };
}

/**
 * Obtiene las especialidades asignadas a un scout
 */
export async function obtenerEspecialidadesScout(
  scoutId: string
): Promise<EspecialidadesScoutResponse> {
  const { data, error } = await supabase.rpc('api_obtener_especialidades_scout', {
    p_scout_id: scoutId
  });

  if (error) {
    console.error('Error obteniendo especialidades del scout:', error);
    throw new Error('Error al obtener especialidades del scout');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data;
}

/**
 * Elimina la asignación de una especialidad
 */
export async function eliminarEspecialidadScout(progresoId: string): Promise<void> {
  const { data, error } = await supabase.rpc('api_eliminar_especialidad_scout', {
    p_progreso_id: progresoId
  });

  if (error) {
    console.error('Error eliminando especialidad:', error);
    throw new Error('Error al eliminar especialidad');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error al eliminar especialidad');
  }
}

/**
 * Actualiza un progreso de especialidad (fechas, asesor, notas)
 */
export async function actualizarProgresoEspecialidad(
  input: ActualizarProgresoInput
): Promise<void> {
  const { data, error } = await supabase.rpc('api_actualizar_progreso_especialidad', {
    p_progreso_id: input.progreso_id,
    p_fecha_inicio: input.fecha_inicio || null,
    p_fecha_fin: input.fecha_fin || null,
    p_asesor_id: input.asesor_id || null,
    p_asesor_nombre: input.asesor_nombre || null,
    p_notas: input.notas || null
  });

  if (error) {
    console.error('Error actualizando progreso:', error);
    throw new Error('Error al actualizar progreso');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error al actualizar progreso');
  }
}

// ============================================================================
// EVIDENCIAS
// ============================================================================

/**
 * Agrega una evidencia a un progreso de especialidad
 */
export async function agregarEvidencia(
  input: AgregarEvidenciaInput
): Promise<{ evidencia_id: string }> {
  const { data, error } = await supabase.rpc('api_agregar_evidencia_especialidad', {
    p_progreso_id: input.progreso_id,
    p_tipo: input.tipo,
    p_url: input.url,
    p_nombre_archivo: input.nombre_archivo || null,
    p_descripcion: input.descripcion || null,
    p_fase: input.fase || 'general'
  });

  if (error) {
    console.error('Error agregando evidencia:', error);
    throw new Error('Error al agregar evidencia');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error al agregar evidencia');
  }

  return { evidencia_id: data.evidencia_id };
}

/**
 * Elimina una evidencia
 */
export async function eliminarEvidencia(evidenciaId: string): Promise<void> {
  const { data, error } = await supabase.rpc('api_eliminar_evidencia_especialidad', {
    p_evidencia_id: evidenciaId
  });

  if (error) {
    console.error('Error eliminando evidencia:', error);
    throw new Error('Error al eliminar evidencia');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error al eliminar evidencia');
  }
}

/**
 * Sube un archivo de evidencia a Supabase Storage
 */
export async function subirArchivoEvidencia(
  file: File,
  progresoId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${progresoId}/${crypto.randomUUID()}.${fileExt}`;
  const filePath = `especialidades/evidencias/${fileName}`;

  // Usar bucket 'finanzas' que ya existe en el proyecto
  const { data, error } = await supabase.storage
    .from('finanzas')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error subiendo archivo:', error);
    throw new Error('Error al subir archivo');
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('finanzas')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ============================================================================
// DASHBOARD Y REPORTES
// ============================================================================

/**
 * Obtiene estadísticas para el dashboard de especialidades
 */
export async function obtenerDashboardEspecialidades(): Promise<DashboardEspecialidades> {
  const { data, error } = await supabase.rpc('api_dashboard_especialidades');

  if (error) {
    console.error('Error obteniendo dashboard:', error);
    throw new Error('Error al obtener dashboard');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error desconocido');
  }

  return {
    stats: data.stats,
    areas: data.areas
  };
}

/**
 * Obtiene el reporte de especialidades por rama
 */
export async function obtenerReporteEspecialidadesRama(
  rama?: string | null
): Promise<ReporteScoutEspecialidades[]> {
  const { data, error } = await supabase.rpc('api_reporte_especialidades_rama', {
    p_rama: rama || null
  });

  if (error) {
    console.error('Error obteniendo reporte:', error);
    throw new Error('Error al obtener reporte');
  }

  if (!data.success) {
    throw new Error(data.error || 'Error desconocido');
  }

  return data.reporte;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula el porcentaje de progreso de una especialidad
 */
export function calcularPorcentajeProgreso(
  fases: { exploracion: FaseEstado; taller: FaseEstado; desafio: FaseEstado }
): number {
  const valores: Record<FaseEstado, number> = {
    pendiente: 0,
    en_progreso: 0.5,
    completada: 1
  };

  const total = valores[fases.exploracion] + valores[fases.taller] + valores[fases.desafio];
  return Math.round((total / 3) * 100);
}

/**
 * Obtiene el siguiente estado de una fase (ciclo: pendiente -> en_progreso -> completada -> pendiente)
 */
export function getSiguienteEstadoFase(estadoActual: FaseEstado): FaseEstado {
  const ciclo: Record<FaseEstado, FaseEstado> = {
    pendiente: 'en_progreso',
    en_progreso: 'completada',
    completada: 'pendiente'
  };
  return ciclo[estadoActual];
}

/**
 * Verifica si todas las fases están completadas
 */
export function estaCompletada(fases: { exploracion: FaseEstado; taller: FaseEstado; desafio: FaseEstado }): boolean {
  return fases.exploracion === 'completada' && 
         fases.taller === 'completada' && 
         fases.desafio === 'completada';
}

// ============================================================================
// EXPORT DEFAULT COMO SERVICIO
// ============================================================================

const EspecialidadesService = {
  // Áreas
  obtenerAreasEspecialidad,
  // Especialidades
  obtenerEspecialidades,
  obtenerEspecialidadDetalle,
  // Progreso
  asignarEspecialidadScout,
  actualizarFaseEspecialidad,
  obtenerEspecialidadesScout,
  eliminarEspecialidadScout,
  actualizarProgresoEspecialidad,
  // Evidencias
  agregarEvidencia,
  eliminarEvidencia,
  subirArchivoEvidencia,
  // Dashboard/Reportes
  obtenerDashboardEspecialidades,
  obtenerReporteEspecialidadesRama,
  // Helpers
  calcularPorcentajeProgreso,
  getSiguienteEstadoFase,
  estaCompletada
};

export default EspecialidadesService;
