// ============================================================================
// SERVICIO DE PROGRESIÓN SCOUT
// ============================================================================
// Gestiona todas las operaciones relacionadas con el sistema de progresión:
// - Etapas (Pista, Senda, Rumbo, Travesía)
// - Áreas de crecimiento (6 áreas)
// - Objetivos educativos
// - Progreso de scouts
// ============================================================================

import { supabase } from '../lib/supabase';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Etapa {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  edad_tipica: number;
  orden: number;
  icono: string;
  color: string;
  requisitos_avance?: string;
  rama: string;
}

export interface AreaCrecimiento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  orden: number;
}

export interface Objetivo {
  id: string;
  codigo: string;
  titulo: string;
  indicadores: string[];
  orden: number;
  // Grupo de objetivo (nuevo)
  grupo_id?: string;
  grupo_codigo?: string;
  grupo_nombre?: string;
  grupo_rama?: string;
  etapa_objetivo_grupo_id?: string;
  // Etapa legacy
  etapa_id: string;
  etapa_codigo: string;
  etapa_nombre: string;
  area_id: string;
  area_codigo: string;
  area_nombre: string;
  area_icono: string;
  area_color: string;
}

export interface ObjetivoScout extends Objetivo {
  completado: boolean;
  fecha_completado: string | null;
  observaciones: string | null;
  validado_por: string | null;
  fecha_validacion: string | null;
}

export interface ProgresoArea {
  area_id: string;
  area_codigo: string;
  area_nombre: string;
  area_icono: string;
  area_color: string;
  area_orden: number;
  total_objetivos: number;
  objetivos_completados: number;
  porcentaje: number;
}

export interface ProgresoCompletoScout {
  scout_id: string;
  scout_nombre: string;
  etapa_actual_id: string;
  etapa_actual_codigo: string;
  etapa_actual_nombre: string;
  etapa_actual_icono: string;
  etapa_actual_color: string;
  fecha_inicio_etapa: string;
  grupo_objetivo_codigo?: string;
  grupo_objetivo_nombre?: string;
  areas: ProgresoArea[];
  progreso_general: number;
  total_objetivos: number;
  objetivos_completados: number;
}

export interface ResumenProgresoScout {
  scout_id: string;
  scout_nombre: string;
  rama: string;
  patrulla_nombre: string | null;
  etapa_actual_codigo: string;
  etapa_actual_nombre: string;
  etapa_actual_icono: string;
  etapa_actual_color: string;
  grupo_objetivo_codigo?: string;
  progreso_general: number;
  total_objetivos: number;
  objetivos_completados: number;
}

export interface GrupoObjetivo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  orden: number;
  rama: string;
  etapas_aplicables?: string[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const RAMAS = [
  { codigo: 'MANADA',    label: 'Manada',    icono: '🐺', color: 'from-green-500 to-emerald-600',   ring: 'ring-green-400',  bg: 'bg-green-50',  text: 'text-green-700'  },
  { codigo: 'TROPA',     label: 'Tropa',     icono: '🏕️', color: 'from-amber-500 to-orange-500',    ring: 'ring-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
  { codigo: 'COMUNIDAD', label: 'Comunidad', icono: '🌄', color: 'from-blue-500 to-cyan-600',       ring: 'ring-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  { codigo: 'CLAN',      label: 'Clan',      icono: '🏔️', color: 'from-purple-500 to-violet-600',   ring: 'ring-purple-400', bg: 'bg-purple-50', text: 'text-purple-700' },
] as const;

export type RamaCodigo = typeof RAMAS[number]['codigo'];

export interface EstadisticaEtapa {
  etapa_id: string;
  etapa_codigo: string;
  etapa_nombre: string;
  etapa_icono: string;
  etapa_color: string;
  etapa_rama: string;
  total_scouts: number;
  promedio_progreso: number;
}

export interface TendenciaProgresionMensual {
  mes: string;
  mes_label: string;
  etapa_codigo: string;
  etapa_nombre: string;
  promedio_progreso: number;
  total_scouts: number;
}

export interface ProximoEventoScout {
  id: string;
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
}

// ============================================================================
// SERVICIO DE PROGRESIÓN
// ============================================================================

export class ProgresionService {
  
  // ==========================================================================
  // ETAPAS
  // ==========================================================================
  
  /**
   * Obtiene todas las etapas de progresión
   */
  static async obtenerEtapas(rama?: string): Promise<Etapa[]> {
    const { data, error } = await supabase.rpc('obtener_etapas', {
      p_rama: rama || null
    });
    
    if (error) {
      console.error('Error al obtener etapas:', error);
      throw new Error('No se pudieron cargar las etapas de progresión');
    }
    
    return data || [];
  }
  
  /**
   * Obtiene una etapa por su código
   */
  static async obtenerEtapaPorCodigo(codigo: string): Promise<Etapa | null> {
    const etapas = await this.obtenerEtapas();
    return etapas.find(e => e.codigo === codigo) || null;
  }
  
  // ==========================================================================
  // GRUPOS DE OBJETIVO (PISTA_SENDA / RUMBO_TRAVESIA)
  // ==========================================================================

  /**
   * Obtiene los 2 grupos de objetivo para selectores de formulario
   */
  static async obtenerGruposObjetivo(rama?: string): Promise<GrupoObjetivo[]> {
    const { data, error } = await supabase.rpc('obtener_grupos_objetivo', {
      p_rama: rama || null
    });

    if (error) {
      console.error('Error al obtener grupos de objetivo:', error);
      throw new Error('No se pudieron cargar los grupos de objetivo');
    }

    return data || [];
  }

  // ==========================================================================
  // ÁREAS DE CRECIMIENTO
  // ==========================================================================
  
  /**
   * Obtiene todas las áreas de crecimiento
   */
  static async obtenerAreas(): Promise<AreaCrecimiento[]> {
    const { data, error } = await supabase.rpc('obtener_areas_crecimiento');
    
    if (error) {
      console.error('Error al obtener áreas:', error);
      throw new Error('No se pudieron cargar las áreas de crecimiento');
    }
    
    return data || [];
  }
  
  // ==========================================================================
  // OBJETIVOS
  // ==========================================================================
  
  /**
   * Obtiene objetivos filtrados por etapa y/o área
   */
  static async obtenerObjetivos(
    etapaCodigo?: string,
    areaCodigo?: string
  ): Promise<Objetivo[]> {
    const { data, error } = await supabase.rpc('obtener_objetivos', {
      p_etapa_codigo: etapaCodigo || null,
      p_area_codigo: areaCodigo || null
    });
    
    if (error) {
      console.error('Error al obtener objetivos:', error);
      throw new Error('No se pudieron cargar los objetivos');
    }
    
    return data || [];
  }

  // ==========================================================================
  // CRUD OBJETIVOS EDUCATIVOS (ADMIN)
  // ==========================================================================

  /**
   * Obtiene todos los objetivos para administración
   */
  static async obtenerObjetivosAdmin(rama?: string): Promise<Objetivo[]> {
    const { data, error } = await supabase.rpc('obtener_objetivos_admin', {
      p_rama: rama || null,
    });

    if (error) {
      console.error('Error al obtener objetivos admin:', error);
      throw new Error('No se pudieron cargar los objetivos');
    }

    return (data || []).map((o: Record<string, unknown>) => ({
      id: o.id as string,
      codigo: o.codigo as string,
      titulo: o.titulo as string,
      indicadores: (o.indicadores as string[]) || [],
      orden: o.orden as number,
      etapa_objetivo_grupo_id: o.etapa_objetivo_grupo_id as string,
      grupo_codigo: o.grupo_codigo as string,
      grupo_nombre: o.grupo_nombre as string,
      grupo_rama: o.grupo_rama as string,
      etapa_id: o.etapa_id as string,
      etapa_codigo: o.etapa_codigo as string,
      etapa_nombre: o.etapa_nombre as string,
      area_id: o.area_id as string,
      area_codigo: o.area_codigo as string,
      area_nombre: o.area_nombre as string,
      area_icono: o.area_icono as string,
      area_color: o.area_color as string,
    }));
  }

  /**
   * Crea un nuevo objetivo educativo
   */
  static async crearObjetivo(datos: {
    etapa_objetivo_grupo_id: string;
    area_id: string;
    titulo: string;
    indicadores: string[];
    codigo?: string;
    orden?: number;
  }): Promise<{ id: string; codigo: string }> {
    const { data, error } = await supabase.rpc('crear_objetivo_educativo', {
      p_etapa_objetivo_grupo_id: datos.etapa_objetivo_grupo_id,
      p_area_id:                 datos.area_id,
      p_titulo:                  datos.titulo,
      p_indicadores:             datos.indicadores,
      p_codigo:                  datos.codigo ?? null,
      p_orden:                   datos.orden ?? null,
    });

    if (error) {
      console.error('Error al crear objetivo:', error);
      if (error.code === '23505') {
        throw new Error('Ya existe un objetivo con ese código');
      }
      throw new Error('No se pudo crear el objetivo');
    }

    const row = data?.[0];
    return { id: row.id as string, codigo: row.codigo as string };
  }

  /**
   * Actualiza un objetivo educativo existente
   */
  static async actualizarObjetivo(
    id: string,
    datos: {
      etapa_objetivo_grupo_id?: string;
      etapa_id?: string;
      area_id?: string;
      titulo?: string;
      indicadores?: string[];
      orden?: number;
    }
  ): Promise<void> {
    const { error } = await supabase.rpc('actualizar_objetivo_educativo', {
      p_id:                      id,
      p_etapa_objetivo_grupo_id: datos.etapa_objetivo_grupo_id ?? null,
      p_area_id:                 datos.area_id ?? null,
      p_titulo:                  datos.titulo ?? null,
      p_indicadores:             datos.indicadores ?? null,
      p_orden:                   datos.orden ?? null,
    });

    if (error) {
      console.error('Error al actualizar objetivo [RPC]:', error.code, error.message, error.details);
      throw new Error(`No se pudo actualizar el objetivo: ${error.message}`);
    }
  }

  /**
   * Elimina (soft delete) un objetivo educativo
   */
  static async eliminarObjetivo(id: string): Promise<void> {
    const { error } = await supabase
      .from('objetivos_educativos')
      .update({ 
        estado: 'INACTIVO',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar objetivo:', error);
      throw new Error('No se pudo eliminar el objetivo');
    }
  }

  /**
   * Obtiene un objetivo por su ID
   */
  static async obtenerObjetivoPorId(id: string): Promise<Objetivo | null> {
    const { data, error } = await supabase.rpc('obtener_objetivo_por_id', { p_id: id });

    if (error) {
      console.error('Error al obtener objetivo:', error);
      return null;
    }

    const row = data?.[0];
    if (!row) return null;

    return {
      id: row.id,
      codigo: row.codigo,
      titulo: row.titulo,
      indicadores: row.indicadores || [],
      orden: row.orden,
      etapa_objetivo_grupo_id: row.etapa_objetivo_grupo_id,
      grupo_codigo: row.grupo_codigo,
      grupo_nombre: row.grupo_nombre,
      etapa_id: row.etapa_id,
      etapa_codigo: row.etapa_codigo,
      etapa_nombre: row.etapa_nombre,
      area_id: row.area_id,
      area_codigo: row.area_codigo,
      area_nombre: row.area_nombre,
      area_icono: row.area_icono,
      area_color: row.area_color,
    };
  }
  
  /**
   * Obtiene objetivos de un scout con su estado
   */
  static async obtenerObjetivosScout(
    scoutId: string,
    etapaCodigo?: string,
    areaCodigo?: string
  ): Promise<ObjetivoScout[]> {
    const { data, error } = await supabase.rpc('obtener_objetivos_scout', {
      p_scout_id: scoutId,
      p_etapa_codigo: etapaCodigo || null,
      p_area_codigo: areaCodigo || null
    });
    
    if (error) {
      console.error('Error al obtener objetivos del scout:', error);
      throw new Error('No se pudieron cargar los objetivos del scout');
    }
    
    return (data || []).map((o: Record<string, unknown>) => ({
      id: o.objetivo_id,
      codigo: o.objetivo_codigo,
      titulo: o.titulo,
      indicadores: o.indicadores || [],
      orden: 0,
      etapa_id: '',
      etapa_codigo: o.etapa_codigo,
      etapa_nombre: o.etapa_nombre,
      area_id: '',
      area_codigo: o.area_codigo,
      area_nombre: o.area_nombre,
      area_icono: o.area_icono,
      area_color: o.area_color,
      completado: o.completado || false,
      fecha_completado: o.fecha_completado,
      observaciones: o.observaciones,
      validado_por: o.validado_por,
      fecha_validacion: o.fecha_validacion
    }));
  }
  
  // ==========================================================================
  // PROGRESO DE SCOUTS
  // ==========================================================================
  
  /**
   * Obtiene el progreso completo de un scout
   */
  static async obtenerProgresoScout(scoutId: string): Promise<ProgresoCompletoScout | null> {
    const { data, error } = await supabase.rpc('obtener_progreso_completo_scout', {
      p_scout_id: scoutId
    });
    
    if (error) {
      console.error('Error al obtener progreso del scout:', error);
      throw new Error('No se pudo cargar el progreso del scout');
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return data[0];
  }
  
  /**
   * Obtiene resumen de progresión de todos los scouts (multi-rama)
   */
  static async obtenerResumenProgresion(rama?: RamaCodigo): Promise<ResumenProgresoScout[]> {
    const params = rama ? { p_rama: rama } : {};
    const { data, error } = await supabase.rpc('obtener_resumen_progresion', params);
    if (error) {
      console.error('Error al obtener resumen de progresión:', error);
      throw new Error('No se pudo cargar el resumen de progresión');
    }
    return data || [];
  }

  /**
   * Obtiene estadísticas de scouts por etapa (multi-rama)
   */
  static async obtenerEstadisticasEtapas(rama?: RamaCodigo): Promise<EstadisticaEtapa[]> {
    const params = rama ? { p_rama: rama } : {};
    const { data, error } = await supabase.rpc('obtener_estadisticas_etapas', params);
    if (error) {
      console.error('Error al obtener estadísticas de etapas:', error);
      throw new Error('No se pudieron cargar las estadísticas');
    }
    return data || [];
  }

  /**
   * Obtiene la tendencia mensual real de progreso para Progresion v4.
   */
  static async obtenerTendenciasProgresionMensual(periodoMeses: number = 8, rama?: string): Promise<TendenciaProgresionMensual[]> {
    const { data, error } = await supabase.rpc('api_obtener_tendencias_progresion_v4', {
      p_periodo_meses: periodoMeses,
      p_rama: rama || null,
    });

    if (error) {
      console.error('Error al obtener tendencias de progresion v4:', error);
      throw new Error('No se pudieron cargar las tendencias de progresion');
    }

    return data || [];
  }

  /**
   * Obtiene proximos eventos del scout para el Portal Padres de Progresion v4.
   */
  static async obtenerProximosEventosScout(scoutId: string, limite: number = 5): Promise<ProximoEventoScout[]> {
    const { data, error } = await supabase.rpc('api_obtener_proximos_eventos_scout_v4', {
      p_scout_id: scoutId,
      p_limite: limite,
    });

    if (error) {
      console.error('Error al obtener proximos eventos del scout:', error);
      throw new Error('No se pudieron cargar los proximos eventos');
    }

    return data || [];
  }
  
  // ==========================================================================
  // ACCIONES
  // ==========================================================================
  
  /**
   * Marca un objetivo como completado
   */
  static async completarObjetivo(
    scoutId: string,
    objetivoId: string,
    observaciones?: string,
    validadoPor?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('completar_objetivo', {
      p_scout_id: scoutId,
      p_objetivo_id: objetivoId,
      p_observaciones: observaciones || null,
      p_validado_por: validadoPor || null
    });
    
    if (error) {
      console.error('Error al completar objetivo:', error);
      throw new Error('No se pudo registrar el objetivo como completado');
    }

    // Compatibilidad: la RPC puede devolver boolean (legacy) u objeto con success.
    if (data === true) return true;
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return Boolean((data as { success?: unknown }).success);
    }

    return false;
  }
  
  /**
   * Desmarca un objetivo (lo marca como no completado)
   */
  static async desmarcarObjetivo(scoutId: string, objetivoId: string): Promise<void> {
    const { error } = await supabase
      .from('progreso_scout')
      .update({ 
        completado: false, 
        fecha_completado: null,
        validado_por: null,
        fecha_validacion: null
      })
      .eq('scout_id', scoutId)
      .eq('objetivo_id', objetivoId);
    
    if (error) {
      console.error('Error al desmarcar objetivo:', error);
      throw new Error('No se pudo desmarcar el objetivo');
    }
  }
  
  /**
   * Asigna una etapa a un scout
   */
  static async asignarEtapa(
    scoutId: string,
    etapaCodigo: string,
    ceremoniaInvestidura?: Date
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('asignar_etapa_scout', {
      p_scout_id: scoutId,
      p_etapa_codigo: etapaCodigo,
      p_ceremonia_investidura: ceremoniaInvestidura?.toISOString().split('T')[0] || null
    });
    
    if (error) {
      console.error('Error al asignar etapa:', error);
      throw new Error('No se pudo asignar la etapa al scout');
    }
    
    return data === true;
  }

  // ==========================================================================
  // CRUD ETAPAS (admin)
  // ==========================================================================

  static async crearEtapa(datos: {
    rama: string;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    edad_tipica?: number;
    orden?: number;
    icono?: string;
    color?: string;
    requisitos_avance?: string;
  }): Promise<{ id: string; codigo: string }> {
    const { data, error } = await supabase.rpc('crear_etapa_progresion', {
      p_rama:              datos.rama,
      p_nombre:            datos.nombre,
      p_codigo:            datos.codigo ?? null,
      p_descripcion:       datos.descripcion ?? null,
      p_edad_tipica:       datos.edad_tipica ?? null,
      p_orden:             datos.orden ?? null,
      p_icono:             datos.icono ?? '📍',
      p_color:             datos.color ?? 'hsl(210, 70%, 55%)',
      p_requisitos_avance: datos.requisitos_avance ?? null,
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Error al crear etapa');
    return { id: data.id, codigo: data.codigo };
  }

  static async actualizarEtapa(id: string, datos: {
    nombre?: string;
    descripcion?: string;
    edad_tipica?: number;
    orden?: number;
    icono?: string;
    color?: string;
    requisitos_avance?: string;
  }): Promise<void> {
    const { data, error } = await supabase.rpc('actualizar_etapa_progresion', {
      p_id:                id,
      p_nombre:            datos.nombre ?? null,
      p_descripcion:       datos.descripcion ?? null,
      p_edad_tipica:       datos.edad_tipica ?? null,
      p_orden:             datos.orden ?? null,
      p_icono:             datos.icono ?? null,
      p_color:             datos.color ?? null,
      p_requisitos_avance: datos.requisitos_avance ?? null,
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar etapa');
  }

  static async eliminarEtapa(id: string): Promise<void> {
    const { data, error } = await supabase.rpc('eliminar_etapa_progresion', { p_id: id });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar etapa');
  }

  // ==========================================================================
  // CRUD GRUPOS DE OBJETIVOS (admin)
  // ==========================================================================

  static async crearGrupoObjetivo(datos: {
    rama: string;
    nombre: string;
    codigo?: string;
    descripcion?: string;
    orden?: number;
    etapas_aplicables?: string[];
  }): Promise<{ id: string; codigo: string }> {
    const { data, error } = await supabase.rpc('crear_grupo_objetivo', {
      p_rama:               datos.rama,
      p_nombre:             datos.nombre,
      p_codigo:             datos.codigo ?? null,
      p_descripcion:        datos.descripcion ?? null,
      p_orden:              datos.orden ?? null,
      p_etapas_aplicables:  datos.etapas_aplicables ?? null,
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Error al crear grupo');
    return { id: data.id, codigo: data.codigo };
  }

  static async actualizarGrupoObjetivo(id: string, datos: {
    nombre?: string;
    descripcion?: string;
    orden?: number;
    etapas_aplicables?: string[];
  }): Promise<void> {
    const { data, error } = await supabase.rpc('actualizar_grupo_objetivo', {
      p_id:                id,
      p_nombre:            datos.nombre ?? null,
      p_descripcion:       datos.descripcion ?? null,
      p_orden:             datos.orden ?? null,
      p_etapas_aplicables: datos.etapas_aplicables ?? null,
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Error al actualizar grupo');
  }

  static async eliminarGrupoObjetivo(id: string): Promise<void> {
    const { data, error } = await supabase.rpc('eliminar_grupo_objetivo', { p_id: id });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Error al eliminar grupo');
  }
  
  /**
   * Calcula el progreso de un área específica
   */
  static async calcularProgresoArea(
    scoutId: string,
    areaId: string,
    etapaId: string
  ): Promise<number> {
    const { data, error } = await supabase.rpc('calcular_progreso_area', {
      p_scout_id: scoutId,
      p_area_id: areaId,
      p_etapa_id: etapaId
    });
    
    if (error) {
      console.error('Error al calcular progreso de área:', error);
      return 0;
    }
    
    return data || 0;
  }
  
  /**
   * Agrupa objetivos por área
   */
  static agruparObjetivosPorArea(objetivos: ObjetivoScout[]): Map<string, ObjetivoScout[]> {
    const grupos = new Map<string, ObjetivoScout[]>();
    
    objetivos.forEach(objetivo => {
      const grupo = grupos.get(objetivo.area_codigo) || [];
      grupo.push(objetivo);
      grupos.set(objetivo.area_codigo, grupo);
    });
    
    return grupos;
  }
  
  /**
   * Calcula porcentaje de progreso de una lista de objetivos
   */
  static calcularPorcentajeProgreso(objetivos: ObjetivoScout[]): number {
    if (objetivos.length === 0) return 0;
    const completados = objetivos.filter(o => o.completado).length;
    return Math.round((completados / objetivos.length) * 100);
  }
  
  // ==========================================================================
  // COLORES Y ESTILOS
  // ==========================================================================
  
  /**
   * Mapea códigos de etapa a colores Tailwind
   */
  static getColorClaseEtapa(etapaCodigo: string): {
    bg: string;
    text: string;
    border: string;
    bgLight: string;
  } {
    const colores: Record<string, { bg: string; text: string; border: string; bgLight: string }> = {
      PISTA: {
        bg: 'bg-green-600',
        text: 'text-green-600',
        border: 'border-green-600',
        bgLight: 'bg-green-50'
      },
      SENDA: {
        bg: 'bg-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-600',
        bgLight: 'bg-blue-50'
      },
      RUMBO: {
        bg: 'bg-amber-600',
        text: 'text-amber-600',
        border: 'border-amber-600',
        bgLight: 'bg-amber-50'
      },
      TRAVESIA: {
        bg: 'bg-red-600',
        text: 'text-red-600',
        border: 'border-red-600',
        bgLight: 'bg-red-50'
      }
    };
    
    return colores[etapaCodigo] || colores.PISTA;
  }
  
  /**
   * Mapea códigos de área a colores Tailwind
   */
  static getColorClaseArea(areaCodigo: string): {
    bg: string;
    text: string;
    border: string;
    bgLight: string;
  } {
    const colores: Record<string, { bg: string; text: string; border: string; bgLight: string }> = {
      CORPORALIDAD: {
        bg: 'bg-red-500',
        text: 'text-red-500',
        border: 'border-red-500',
        bgLight: 'bg-red-50'
      },
      CREATIVIDAD: {
        bg: 'bg-orange-500',
        text: 'text-orange-500',
        border: 'border-orange-500',
        bgLight: 'bg-orange-50'
      },
      CARACTER: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-500',
        border: 'border-yellow-500',
        bgLight: 'bg-yellow-50'
      },
      AFECTIVIDAD: {
        bg: 'bg-pink-500',
        text: 'text-pink-500',
        border: 'border-pink-500',
        bgLight: 'bg-pink-50'
      },
      SOCIABILIDAD: {
        bg: 'bg-green-500',
        text: 'text-green-500',
        border: 'border-green-500',
        bgLight: 'bg-green-50'
      },
      ESPIRITUALIDAD: {
        bg: 'bg-purple-500',
        text: 'text-purple-500',
        border: 'border-purple-500',
        bgLight: 'bg-purple-50'
      }
    };
    
    return colores[areaCodigo] || colores.CORPORALIDAD;
  }
}

export default ProgresionService;
