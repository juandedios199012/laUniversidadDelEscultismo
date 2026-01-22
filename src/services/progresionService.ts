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
  descripcion: string;
  indicadores: string[];
  orden: number;
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
  areas: ProgresoArea[];
  progreso_general: number;
  total_objetivos: number;
  objetivos_completados: number;
}

export interface ResumenProgresoScout {
  scout_id: string;
  scout_codigo: string;
  scout_nombre: string;
  rama: string;
  patrulla_nombre: string | null;
  etapa_actual_codigo: string;
  etapa_actual_nombre: string;
  etapa_actual_icono: string;
  etapa_actual_color: string;
  progreso_general: number;
  total_objetivos: number;
  objetivos_completados: number;
}

export interface EstadisticaEtapa {
  etapa_id: string;
  etapa_codigo: string;
  etapa_nombre: string;
  etapa_icono: string;
  etapa_color: string;
  total_scouts: number;
  promedio_progreso: number;
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
  static async obtenerEtapas(): Promise<Etapa[]> {
    const { data, error } = await supabase.rpc('obtener_etapas');
    
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
      descripcion: o.descripcion,
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
   * Obtiene resumen de progresión de todos los scouts
   */
  static async obtenerResumenProgresion(): Promise<ResumenProgresoScout[]> {
    const { data, error } = await supabase.rpc('obtener_resumen_progresion');
    
    if (error) {
      console.error('Error al obtener resumen de progresión:', error);
      throw new Error('No se pudo cargar el resumen de progresión');
    }
    
    return data || [];
  }
  
  /**
   * Obtiene estadísticas de scouts por etapa
   */
  static async obtenerEstadisticasEtapas(): Promise<EstadisticaEtapa[]> {
    const { data, error } = await supabase.rpc('obtener_estadisticas_etapas');
    
    if (error) {
      console.error('Error al obtener estadísticas de etapas:', error);
      throw new Error('No se pudieron cargar las estadísticas');
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
    
    return data === true;
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
  // CÁLCULOS AUXILIARES
  // ==========================================================================
  
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
